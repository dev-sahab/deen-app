package expo.modules.deenguard

/** Minimal IPv4/UDP/DNS helpers for the local DNS filter. */
object DnsPacket {
  class UdpQuery(
    val srcIp: ByteArray,
    val dstIp: ByteArray,
    val srcPort: Int,
    val dstPort: Int,
    val dns: ByteArray,
    val qname: String?,
    /** Length of header + question section, used to build short answers. */
    val questionEnd: Int,
  )

  private fun u8(b: ByteArray, i: Int) = b[i].toInt() and 0xff
  private fun u16(b: ByteArray, i: Int) = (u8(b, i) shl 8) or u8(b, i + 1)

  /** Returns the DNS query if [p] is an IPv4 UDP packet to port 53, else null. */
  fun parseUdpQuery(p: ByteArray): UdpQuery? {
    if (p.size < 28) return null
    if ((u8(p, 0) shr 4) != 4) return null // IPv4 only (we only route an IPv4 DNS address)
    val ihl = (u8(p, 0) and 0x0f) * 4
    if (ihl < 20 || p.size < ihl + 8) return null
    if (u8(p, 9) != 17) return null // UDP
    val totalLen = u16(p, 2).coerceAtMost(p.size)
    val srcPort = u16(p, ihl)
    val dstPort = u16(p, ihl + 2)
    if (dstPort != 53) return null
    val dnsStart = ihl + 8
    if (totalLen <= dnsStart + 12) return null
    val dns = p.copyOfRange(dnsStart, totalLen)
    val (name, qEnd) = parseQuestion(dns)
    return UdpQuery(p.copyOfRange(12, 16), p.copyOfRange(16, 20), srcPort, dstPort, dns, name, qEnd)
  }

  /** Reads the first question's name; returns (name, offset just after QTYPE/QCLASS). */
  private fun parseQuestion(dns: ByteArray): Pair<String?, Int> {
    if (u16(dns, 4) < 1) return null to 12
    val sb = StringBuilder()
    var i = 12
    while (i < dns.size) {
      val len = u8(dns, i)
      if (len == 0) { i += 1; break }
      if (len and 0xc0 != 0) return null to dns.size // compression is not expected in queries
      if (i + 1 + len > dns.size) return null to dns.size
      if (sb.isNotEmpty()) sb.append('.')
      for (k in 1..len) sb.append(dns[i + k].toInt().toChar())
      i += 1 + len
    }
    val end = (i + 4).coerceAtMost(dns.size)
    return (if (sb.isEmpty()) null else sb.toString()) to end
  }

  private fun answerWithRcode(query: ByteArray, rcode: Int, questionEnd: Int): ByteArray {
    val out = query.copyOf(questionEnd.coerceIn(12, query.size))
    val rd = u8(query, 2) and 0x01
    out[2] = (0x80 or rd).toByte()        // QR=1, opcode 0, RD copied
    out[3] = (0x80 or (rcode and 0x0f)).toByte() // RA=1, RCODE
    // QDCOUNT stays, AN/NS/AR = 0
    for (k in 6..11) out[k] = 0
    return out
  }

  fun nxdomain(query: ByteArray): ByteArray = answerWithRcode(query, 3, parseQuestion(query).second)
  fun servfail(query: ByteArray): ByteArray = answerWithRcode(query, 2, parseQuestion(query).second)

  /** Wraps a DNS payload into an IPv4/UDP packet going back to the original sender. */
  fun buildUdpResponse(q: UdpQuery, payload: ByteArray): ByteArray {
    val total = 20 + 8 + payload.size
    val p = ByteArray(total)
    p[0] = 0x45
    p[2] = (total shr 8).toByte(); p[3] = total.toByte()
    p[6] = 0x40 // don't fragment
    p[8] = 64   // TTL
    p[9] = 17   // UDP
    System.arraycopy(q.dstIp, 0, p, 12, 4) // from the DNS address we pretended to be
    System.arraycopy(q.srcIp, 0, p, 16, 4)
    val sum = checksum(p, 0, 20)
    p[10] = (sum shr 8).toByte(); p[11] = sum.toByte()

    p[20] = (q.dstPort shr 8).toByte(); p[21] = q.dstPort.toByte()
    p[22] = (q.srcPort shr 8).toByte(); p[23] = q.srcPort.toByte()
    val udpLen = 8 + payload.size
    p[24] = (udpLen shr 8).toByte(); p[25] = udpLen.toByte()
    // UDP checksum 0 = "not computed", valid for IPv4.
    System.arraycopy(payload, 0, p, 28, payload.size)
    return p
  }

  private fun checksum(b: ByteArray, off: Int, len: Int): Int {
    var sum = 0L
    var i = off
    while (i < off + len - 1) {
      sum += ((b[i].toInt() and 0xff) shl 8) or (b[i + 1].toInt() and 0xff)
      i += 2
    }
    if (len % 2 == 1) sum += (b[off + len - 1].toInt() and 0xff) shl 8
    while (sum shr 16 != 0L) sum = (sum and 0xffff) + (sum shr 16)
    return (sum.inv() and 0xffff).toInt()
  }
}
