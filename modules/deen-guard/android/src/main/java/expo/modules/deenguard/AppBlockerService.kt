package expo.modules.deenguard

import android.accessibilityservice.AccessibilityService
import android.content.SharedPreferences
import android.view.accessibility.AccessibilityEvent
import android.widget.Toast

/**
 * Sends the user back to the home screen when a blocked app comes to the foreground.
 * Only window-state-change events are subscribed; no screen content is read.
 */
class AppBlockerService : AccessibilityService() {
  @Volatile private var blocked: Set<String> = emptySet()
  private var lastToast = 0L

  private val listener = SharedPreferences.OnSharedPreferenceChangeListener { _, _ ->
    blocked = GuardConfig.blockedApps(this)
  }

  override fun onServiceConnected() {
    super.onServiceConnected()
    blocked = GuardConfig.blockedApps(this)
    getSharedPreferences("deen_guard_config", MODE_PRIVATE).registerOnSharedPreferenceChangeListener(listener)
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
    val pkg = event.packageName?.toString() ?: return
    if (pkg == packageName || pkg !in blocked) return
    performGlobalAction(GLOBAL_ACTION_HOME)
    val now = System.currentTimeMillis()
    if (now - lastToast > 3_000) {
      lastToast = now
      Toast.makeText(this, "Blocked by Deen Guard", Toast.LENGTH_SHORT).show()
    }
  }

  override fun onInterrupt() {}

  override fun onDestroy() {
    getSharedPreferences("deen_guard_config", MODE_PRIVATE).unregisterOnSharedPreferenceChangeListener(listener)
    super.onDestroy()
  }
}
