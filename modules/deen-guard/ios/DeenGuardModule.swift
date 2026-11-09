import ExpoModulesCore

/// iOS does not let third-party apps change the ringer/silent switch, and system-wide
/// content filtering needs a Network Extension (NEDNSSettingsManager) with Apple-approved
/// entitlements. This module therefore reports what is unsupported so the JS layer can show
/// the iOS alternatives (Focus automation via Shortcuts, Screen Time, DNS profile).
public class DeenGuardModule: Module {
  public func definition() -> ModuleDefinition {
    Name("DeenGuard")

    Function("getSupport") { () -> [String: Any] in
      return ["silent": false, "contentFilter": false, "appBlocker": false, "platform": "ios"]
    }

    Function("hasDndAccess") { false }
    Function("canScheduleExactAlarms") { true }
    Function("isIgnoringBatteryOptimizations") { true }
    Function("getRingerMode") { "unknown" }
    Function("getSilentStatus") { () -> [String: Any?] in
      return ["active": nil, "next": nil, "scheduledCount": 0]
    }
    Function("getContentFilterStatus") { () -> [String: Any] in
      return ["running": false, "wanted": false, "blockedCount": 0, "upstream": [String]()]
    }
    Function("isAppBlockerEnabled") { false }
  }
}
