package expo.modules.deenguard

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.util.Log

/** Re-arms the silent alarm chain (and the content filter) after reboot / clock change / update. */
class BootReceiver : BroadcastReceiver() {
  private val allowed = setOf(
    Intent.ACTION_BOOT_COMPLETED,
    Intent.ACTION_MY_PACKAGE_REPLACED,
    Intent.ACTION_TIME_CHANGED,
    Intent.ACTION_TIMEZONE_CHANGED,
    "android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED",
  )

  override fun onReceive(context: Context, intent: Intent) {
    // The receiver must be exported for system broadcasts; ignore explicit intents from
    // other apps that carry any other action.
    if (intent.action !in allowed) return
    val ctx = context.applicationContext
    SilentScheduler.reschedule(ctx)

    val isBootLike = intent.action == Intent.ACTION_BOOT_COMPLETED ||
      intent.action == Intent.ACTION_MY_PACKAGE_REPLACED
    if (isBootLike && GuardConfig.isVpnWanted(ctx) && VpnService.prepare(ctx) == null) {
      try {
        ctx.startService(Intent(ctx, DnsVpnService::class.java).setAction(DnsVpnService.ACTION_START))
      } catch (e: Exception) {
        // Background-start limits on some Android versions. "Always-on VPN" in system
        // settings is the reliable way to keep the filter running after reboot.
        Log.w("DeenGuard", "Could not auto-start filter after boot", e)
      }
    }
  }
}
