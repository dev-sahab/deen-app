package expo.modules.deenguard

import android.app.PendingIntent
import android.content.Intent
import android.net.VpnService
import android.os.ParcelFileDescriptor
import android.util.Log
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.ExecutorService
import java.util.concurrent.ThreadPoolExecutor
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicLong

/**
 * Local, on-device DNS filter (no remote VPN server, no traffic leaves through us except DNS).
 *
 * Only the virtual DNS address is routed into the tunnel, so normal app traffic never passes
 * through this service. Each DNS query is checked against the local blocklist; blocked names get
 * NXDOMAIN, everything else is forwarded to a family-safe upstream resolver (default: AdGuard
 * Family, which also blocks adult sites and ads).
 */
class DnsVpnService : VpnService() {
  companion object {
    const val ACTION_START = "expo.modules.deenguard.VPN_START"
    const val ACTION_STOP = "expo.modules.deenguard.VPN_STOP"
    private const val TAG = "DeenGuardVpn"
    private const val TUN_ADDRESS = "10.111.222.1"
    private const val DNS_ADDRESS = "10.111.222.53"

    @Volatile var isRunning = false
      private set
  }

  private var tun: ParcelFileDescriptor? = null
  private var reader: Thread? = null
  private var pool: ExecutorService? = null
  @Volatile private var blocklist: Set<String> = emptySet()
  @Volatile private var upstream: List<InetAddress> = emptyList()
  private val pendingBlocked = AtomicLong(0)

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      GuardConfig.setVpnWanted(this, false)
      stopFilter()
      stopSelf()
      return START_NOT_STICKY
    }
    // ACTION_START, or the system starting us for "Always-on VPN".
    GuardConfig.setVpnWanted(this, true)
    loadConfig()
    if (!isRunning) startFilter()
    return START_STICKY
  }

  /** Re-reads blocklist/upstream; called on start and when JS updates settings. */
  fun loadConfig() {
    blocklist = GuardConfig.BUILT_IN_BLOCKS + GuardConfig.blockedDomains(this)
    upstream = GuardConfig.upstream(this).mapNotNull { runCatching { InetAddress.getByName(it) }.getOrNull() }
      .ifEmpty { GuardConfig.DEFAULT_UPSTREAM.map { InetAddress.getByName(it) } }
  }

  private fun startFilter() {
    val launch = packageManager.getLaunchIntentForPackage(packageName)
    val builder = Builder()
      .setSession("Deen Guard")
      .addAddress(TUN_ADDRESS, 32)
      .addDnsServer(DNS_ADDRESS)
      .addRoute(DNS_ADDRESS, 32)
      .setBlocking(true)
    launch?.let { builder.setConfigureIntent(PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_IMMUTABLE)) }
    try {
      builder.addDisallowedApplication(packageName)
    } catch (_: Exception) {}

    val fd = try {
      builder.establish()
    } catch (e: Exception) {
      Log.e(TAG, "establish failed", e)
      null
    } ?: run {
      // Permission was revoked or another VPN took over.
      GuardConfig.setVpnWanted(this, false)
      stopSelf()
      return
    }

    tun = fd
    isRunning = true
    // Bounded queue: any app on the device can send UDP to the virtual DNS address, so an
    // unbounded queue would let a flood exhaust memory and kill the filter. Excess is dropped.
    pool = ThreadPoolExecutor(
      8, 8, 30, TimeUnit.SECONDS,
      ArrayBlockingQueue(256),
      ThreadPoolExecutor.DiscardPolicy()
    )
    reader = Thread({ readLoop(fd) }, "DeenGuardDns").also { it.start() }
  }

  private fun stopFilter() {
    isRunning = false
    flushStats()
    try { tun?.close() } catch (_: Exception) {}
    tun = null
    reader?.interrupt()
    reader = null
    pool?.shutdownNow()
    pool = null
  }

  override fun onRevoke() {
    // User switched to another VPN or turned us off in system settings.
    GuardConfig.setVpnWanted(this, false)
    stopFilter()
    super.onRevoke()
  }

  override fun onDestroy() {
    stopFilter()
    super.onDestroy()
  }

  // ------------------------------------------------------------------ packet loop

  private fun readLoop(fd: ParcelFileDescriptor) {
    val input = FileInputStream(fd.fileDescriptor)
    val output = FileOutputStream(fd.fileDescriptor)
    val buf = ByteArray(32_767)
    while (isRunning) {
      val len = try {
        input.read(buf)
      } catch (e: Exception) {
        if (isRunning) Log.w(TAG, "tun read failed", e)
        break
      }
      if (len <= 0) continue
      val packet = buf.copyOf(len)
      val query = DnsPacket.parseUdpQuery(packet) ?: continue // non-DNS (e.g. TCP/853): dropped

      val name = query.qname
      if (name != null && isBlocked(name)) {
        writePacket(output, DnsPacket.buildUdpResponse(query, DnsPacket.nxdomain(query.dns)))
        if (pendingBlocked.incrementAndGet() >= 20) flushStats()
        continue
      }
      pool?.execute { forward(query, output) }
    }
  }

  private fun isBlocked(name: String): Boolean {
    var d = name.lowercase().trimEnd('.')
    val list = blocklist
    while (true) {
      if (d in list) return true
      val dot = d.indexOf('.')
      if (dot < 0) return false
      d = d.substring(dot + 1)
    }
  }

  private fun forward(query: DnsPacket.UdpQuery, output: FileOutputStream) {
    for (server in upstream) {
      try {
        DatagramSocket().use { socket ->
          protect(socket) // keep our own upstream traffic out of the tunnel
          // connect() makes the kernel drop datagrams from any other source address/port.
          socket.connect(server, 53)
          socket.soTimeout = 3_000
          socket.send(DatagramPacket(query.dns, query.dns.size))
          val resp = ByteArray(4_096)
          val p = DatagramPacket(resp, resp.size)
          val deadline = System.currentTimeMillis() + 3_000
          while (true) {
            socket.receive(p)
            // Only accept an answer whose transaction ID matches our query (anti-spoofing).
            if (p.length >= 12 && resp[0] == query.dns[0] && resp[1] == query.dns[1]) break
            if (System.currentTimeMillis() > deadline) throw java.net.SocketTimeoutException()
            p.length = resp.size
          }
          writePacket(output, DnsPacket.buildUdpResponse(query, resp.copyOf(p.length)))
        }
        return
      } catch (e: Exception) {
        Log.d(TAG, "upstream $server failed: ${e.message}")
      }
    }
    // All upstreams failed: answer SERVFAIL so apps don't hang.
    writePacket(output, DnsPacket.buildUdpResponse(query, DnsPacket.servfail(query.dns)))
  }

  private fun writePacket(output: FileOutputStream, bytes: ByteArray) {
    if (!isRunning) return
    try {
      synchronized(output) { output.write(bytes) }
    } catch (e: Exception) {
      Log.d(TAG, "tun write failed: ${e.message}")
    }
  }

  private fun flushStats() {
    val n = pendingBlocked.getAndSet(0)
    if (n > 0) GuardConfig.addBlockedCount(this, n)
  }
}
