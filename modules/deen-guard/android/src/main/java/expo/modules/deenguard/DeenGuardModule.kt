package expo.modules.deenguard

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioManager
import android.net.Uri
import android.net.VpnService
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DeenGuardModule : Module() {
  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "React context is not available" }.applicationContext

  private fun openSettings(intent: Intent) {
    val activity = appContext.currentActivity
    if (activity != null) {
      activity.startActivity(intent)
    } else {
      context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
  }

  private fun refreshVpnIfRunning() {
    if (DnsVpnService.isRunning) {
      context.startService(Intent(context, DnsVpnService::class.java).setAction(DnsVpnService.ACTION_START))
    }
  }

  override fun definition() = ModuleDefinition {
    Name("DeenGuard")

    Function("getSupport") {
      mapOf("silent" to true, "contentFilter" to true, "appBlocker" to true, "platform" to "android")
    }

    // ------------------------------------------------------------ permissions / settings

    Function("hasDndAccess") { SilentScheduler.hasDndAccess(context) }

    Function("openDndSettings") {
      openSettings(Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS))
    }

    Function("canScheduleExactAlarms") { SilentScheduler.canScheduleExact(context) }

    Function("openExactAlarmSettings") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        openSettings(
          Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${context.packageName}"))
        )
      }
    }

    Function("isIgnoringBatteryOptimizations") {
      val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      pm.isIgnoringBatteryOptimizations(context.packageName)
    }

    Function("openBatterySettings") {
      openSettings(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
    }

    Function("getRingerMode") {
      when ((context.getSystemService(Context.AUDIO_SERVICE) as AudioManager).ringerMode) {
        AudioManager.RINGER_MODE_SILENT -> "silent"
        AudioManager.RINGER_MODE_VIBRATE -> "vibrate"
        else -> "normal"
      }
    }

    // ------------------------------------------------------------ auto-silent

    Function("scheduleSilentWindows") { windows: List<Map<String, Any?>>, mode: String ->
      val parsed = windows.mapNotNull { w ->
        val id = w["id"] as? String ?: return@mapNotNull null
        val start = (w["start"] as? Number)?.toLong() ?: return@mapNotNull null
        val end = (w["end"] as? Number)?.toLong() ?: return@mapNotNull null
        if (end <= start) return@mapNotNull null
        SilentScheduler.Window(id, start, end, w["label"] as? String ?: "")
      }
      SilentScheduler.saveSchedule(context, parsed, mode)
      parsed.size
    }

    Function("clearSilentWindows") { SilentScheduler.clearSchedule(context) }

    Function("getSilentStatus") { SilentScheduler.status(context) }

    // ------------------------------------------------------------ DNS content filter

    /** Returns true if VPN consent is already given; otherwise shows the system dialog. */
    Function("prepareContentFilter") {
      val intent = VpnService.prepare(context) ?: return@Function true
      val activity = appContext.currentActivity ?: return@Function false
      activity.startActivityForResult(intent, 52_010)
      false
    }

    /** Non-interactive check: has the user already accepted the VPN consent dialog? */
    Function("isContentFilterPrepared") { VpnService.prepare(context) == null }

    Function("startContentFilter") {
      if (VpnService.prepare(context) != null) {
        throw IllegalStateException("VPN permission not granted. Call prepareContentFilter() first.")
      }
      GuardConfig.setVpnWanted(context, true)
      context.startService(Intent(context, DnsVpnService::class.java).setAction(DnsVpnService.ACTION_START))
      true
    }

    Function("stopContentFilter") {
      GuardConfig.setVpnWanted(context, false)
      if (DnsVpnService.isRunning) {
        context.startService(Intent(context, DnsVpnService::class.java).setAction(DnsVpnService.ACTION_STOP))
      }
    }

    Function("getContentFilterStatus") {
      mapOf(
        "running" to DnsVpnService.isRunning,
        "wanted" to GuardConfig.isVpnWanted(context),
        "blockedCount" to GuardConfig.blockedCount(context).toDouble(),
        "upstream" to GuardConfig.upstream(context),
      )
    }

    Function("setContentFilterConfig") { upstream: List<String>, blockedDomains: List<String> ->
      GuardConfig.setUpstream(context, upstream)
      GuardConfig.setBlockedDomains(context, blockedDomains)
      refreshVpnIfRunning()
    }

    Function("openVpnSettings") { openSettings(Intent(Settings.ACTION_VPN_SETTINGS)) }

    // ------------------------------------------------------------ app blocker

    Function("isAppBlockerEnabled") {
      val expected = ComponentName(context, AppBlockerService::class.java).flattenToString()
      val enabled = Settings.Secure.getString(context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES) ?: ""
      enabled.split(':').any { it.equals(expected, ignoreCase = true) }
    }

    Function("openAccessibilitySettings") { openSettings(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) }

    Function("setBlockedApps") { packages: List<String> -> GuardConfig.setBlockedApps(context, packages) }

    Function("getBlockedApps") { GuardConfig.blockedApps(context).toList() }

    AsyncFunction("getInstalledApps") {
      val pm = context.packageManager
      val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
      val resolved = if (Build.VERSION.SDK_INT >= 33) {
        pm.queryIntentActivities(intent, PackageManager.ResolveInfoFlags.of(0))
      } else {
        @Suppress("DEPRECATION") pm.queryIntentActivities(intent, 0)
      }
      resolved
        .map { it.activityInfo.packageName to it.loadLabel(pm).toString() }
        .filter { it.first != context.packageName }
        .distinctBy { it.first }
        .sortedBy { it.second.lowercase() }
        .map { mapOf("packageName" to it.first, "label" to it.second) }
    }
  }
}
