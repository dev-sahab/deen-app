package expo.modules.deenguard

import android.content.Context

/** Settings shared by the DNS filter and the app blocker (written from JS). */
object GuardConfig {
  private const val PREFS = "deen_guard_config"
  private const val KEY_VPN_WANTED = "vpnWanted"
  private const val KEY_UPSTREAM = "upstream"
  private const val KEY_BLOCKED_DOMAINS = "blockedDomains"
  private const val KEY_BLOCKED_APPS = "blockedApps"
  private const val KEY_BLOCKED_COUNT = "blockedCount"

  /** AdGuard Family DNS: blocks adult content + ads/trackers and enforces SafeSearch. */
  val DEFAULT_UPSTREAM = listOf("94.140.14.15", "94.140.15.16")

  /**
   * Always blocked locally. Mostly public DNS-over-HTTPS endpoints: if a browser could reach
   * them it would bypass the filter, so blocking them makes browsers fall back to system DNS.
   */
  val BUILT_IN_BLOCKS = setOf(
    "dns.google", "dns.google.com", "cloudflare-dns.com", "mozilla.cloudflare-dns.com",
    "chrome.cloudflare-dns.com", "one.one.one.one", "dns.quad9.net", "dns.nextdns.io",
    "doh.opendns.com", "doh.cleanbrowsing.org", "dns.adguard.com", "dns.adguard-dns.com",
    "doh.mullvad.net", "dns.alidns.com", "doh.pub", "dns.twnic.tw", "use-application-dns.net"
  )

  private fun prefs(ctx: Context) = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun isVpnWanted(ctx: Context) = prefs(ctx).getBoolean(KEY_VPN_WANTED, false)
  fun setVpnWanted(ctx: Context, v: Boolean) = prefs(ctx).edit().putBoolean(KEY_VPN_WANTED, v).apply()

  fun upstream(ctx: Context): List<String> =
    prefs(ctx).getString(KEY_UPSTREAM, null)?.split(",")?.map { it.trim() }?.filter { it.isNotEmpty() }
      ?.takeIf { it.isNotEmpty() } ?: DEFAULT_UPSTREAM

  fun setUpstream(ctx: Context, servers: List<String>) =
    prefs(ctx).edit().putString(KEY_UPSTREAM, servers.joinToString(",")).apply()

  fun blockedDomains(ctx: Context): Set<String> =
    prefs(ctx).getStringSet(KEY_BLOCKED_DOMAINS, emptySet())!!.toSet()

  fun setBlockedDomains(ctx: Context, domains: List<String>) =
    prefs(ctx).edit().putStringSet(
      KEY_BLOCKED_DOMAINS,
      domains.map { it.trim().lowercase().removePrefix("www.").trimEnd('.') }.filter { it.isNotEmpty() }.toSet()
    ).apply()

  fun blockedApps(ctx: Context): Set<String> =
    prefs(ctx).getStringSet(KEY_BLOCKED_APPS, emptySet())!!.toSet()

  fun setBlockedApps(ctx: Context, pkgs: List<String>) =
    prefs(ctx).edit().putStringSet(KEY_BLOCKED_APPS, pkgs.toSet()).apply()

  fun blockedCount(ctx: Context) = prefs(ctx).getLong(KEY_BLOCKED_COUNT, 0L)
  fun addBlockedCount(ctx: Context, n: Long) =
    prefs(ctx).edit().putLong(KEY_BLOCKED_COUNT, blockedCount(ctx) + n).apply()
}
