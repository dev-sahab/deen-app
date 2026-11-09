package expo.modules.deenguard

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test
import kotlin.random.Random

class DnsPacketTest {
  /** DNS query for [name] type A, id 0xBEEF, RD set. */
  private fun dnsQuery(name: String): ByteArray {
    val out = mutableListOf<Byte>(0xBE.toByte(), 0xEF.toByte(), 0x01, 0x00, 0, 1, 0, 0, 0, 0, 0, 0)
    name.split('.').forEach { label ->
      out.add(label.length.toByte()); label.forEach { out.add(it.code.toByte()) }
    }
    out.addAll(listOf(0, 0, 1, 0, 1))
    return out.toByteArray()
  }

  /** IPv4/UDP packet 10.111.222.1:40000 -> 10.111.222.53:53 carrying [dns]. */
  private fun ipUdp(dns: ByteArray, dstPort: Int = 53, proto: Int = 17): ByteArray {
    val total = 28 + dns.size
    val p = ByteArray(total)
    p[0] = 0x45; p[2] = (total shr 8).toByte(); p[3] = total.toByte(); p[8] = 64; p[9] = proto.toByte()
    byteArrayOf(10, 111, 222.toByte(), 1).copyInto(p, 12)
    byteArrayOf(10, 111, 222.toByte(), 53).copyInto(p, 16)
    p[20] = (40000 shr 8).toByte(); p[21] = 40000.toByte()
    p[22] = (dstPort shr 8).toByte(); p[23] = dstPort.toByte()
    p[24] = ((8 + dns.size) shr 8).toByte(); p[25] = (8 + dns.size).toByte()
    dns.copyInto(p, 28)
    return p
  }

  @Test fun parsesQueryName() {
    val q = DnsPacket.parseUdpQuery(ipUdp(dnsQuery("www.example.com")))
    assertNotNull(q)
    assertEquals("www.example.com", q!!.qname)
    assertEquals(40000, q.srcPort)
  }

  @Test fun ignoresNonDnsTraffic() {
    assertNull(DnsPacket.parseUdpQuery(ipUdp(dnsQuery("a.com"), dstPort = 443)))
    assertNull(DnsPacket.parseUdpQuery(ipUdp(dnsQuery("a.com"), proto = 6))) // TCP
    assertNull(DnsPacket.parseUdpQuery(ByteArray(10)))
  }

  @Test fun nxdomainKeepsIdAndQuestion() {
    val dns = dnsQuery("blocked.test")
    val r = DnsPacket.nxdomain(dns)
    assertEquals(dns[0], r[0]); assertEquals(dns[1], r[1])
    assertEquals(0x81, r[2].toInt() and 0xff) // QR + RD
    assertEquals(3, r[3].toInt() and 0x0f)    // NXDOMAIN
    assertArrayEquals(dns.copyOfRange(12, dns.size), r.copyOfRange(12, r.size))
  }

  @Test fun responsePacketIsReturnedToSenderWithValidChecksum() {
    val q = DnsPacket.parseUdpQuery(ipUdp(dnsQuery("a.com")))!!
    val pkt = DnsPacket.buildUdpResponse(q, DnsPacket.nxdomain(q.dns))
    assertArrayEquals(byteArrayOf(10, 111, 222.toByte(), 53), pkt.copyOfRange(12, 16))
    assertArrayEquals(byteArrayOf(10, 111, 222.toByte(), 1), pkt.copyOfRange(16, 20))
    var sum = 0
    for (i in 0 until 20 step 2) sum += ((pkt[i].toInt() and 0xff) shl 8) or (pkt[i + 1].toInt() and 0xff)
    while (sum shr 16 != 0) sum = (sum and 0xffff) + (sum shr 16)
    assertEquals(0xffff, sum) // header checksum verifies
  }

  @Test fun malformedPacketsNeverThrow() {
    val rnd = Random(42)
    repeat(20_000) {
      val base = ipUdp(dnsQuery("fuzz.example.org"))
      val p = if (rnd.nextBoolean()) base.copyOf(rnd.nextInt(base.size + 1)) else base
      if (p.isNotEmpty()) repeat(rnd.nextInt(1, 6)) { p[rnd.nextInt(p.size)] = rnd.nextInt(256).toByte() }
      val q = DnsPacket.parseUdpQuery(p) ?: return@repeat
      DnsPacket.buildUdpResponse(q, DnsPacket.nxdomain(q.dns))
      DnsPacket.servfail(q.dns)
    }
  }
}
