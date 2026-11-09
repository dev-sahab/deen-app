package expo.modules.deenguard

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Fired by AlarmManager at each silent-window start/end. */
class SilentReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == SilentScheduler.ACTION_ALARM) {
      SilentScheduler.onAlarm(context.applicationContext)
    }
  }
}
