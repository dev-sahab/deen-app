package expo.modules.deenguard

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.os.Build
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.text.DateFormat
import java.util.Date

/**
 * Prayer-time auto-silent engine.
 *
 * JS computes prayer windows (start/end epoch ms) for the coming weeks and hands them over.
 * They are persisted in SharedPreferences and only ONE alarm is ever armed: the next start
 * or end event. Each time the alarm fires, the receiver applies it and arms the next one,
 * so the chain survives the app being killed. BootReceiver re-arms it after reboot.
 *
 * Rules:
 *  - At window start: if the phone is already silent/vibrate/DND, do nothing (and do not
 *    touch it at the end either).
 *  - Otherwise switch to the chosen mode and remember exactly what we set.
 *  - At window end: restore normal ONLY if the phone is still in the mode we set. If the
 *    user changed it manually during prayer, leave it alone.
 */
object SilentScheduler {
  private const val TAG = "DeenGuardSilent"
  private const val PREFS = "deen_guard_silent"
  private const val KEY_EVENTS = "events"
  private const val KEY_MODE = "mode"
  private const val KEY_ACTIVE = "active"
  private const val KEY_HANDLED = "handled"
  private const val KEY_LAST_SKIPPED = "lastSkipped"
  private const val REQUEST_CODE = 52_001
  private const val CHANNEL_ID = "deen_guard_silent"
  private const val NOTIFICATION_ID = 52_002

  const val ACTION_ALARM = "expo.modules.deenguard.SILENT_ALARM"

  data class Window(val id: String, val start: Long, val end: Long, val label: String)

  private fun prefs(ctx: Context) = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  // ---------------------------------------------------------------- persistence

  fun saveSchedule(ctx: Context, windows: List<Window>, mode: String) {
    val arr = JSONArray()
    windows.sortedBy { it.start }.forEach {
      arr.put(JSONObject().put("id", it.id).put("start", it.start).put("end", it.end).put("label", it.label))
    }
    prefs(ctx).edit()
      .putString(KEY_EVENTS, arr.toString())
      .putString(KEY_MODE, if (mode == "vibrate") "vibrate" else "silent")
      .apply()
    reschedule(ctx)
  }

  fun clearSchedule(ctx: Context) {
    prefs(ctx).edit().remove(KEY_EVENTS).remove(KEY_HANDLED).apply()
    // If we are mid-window, finish it cleanly so the phone is restored.
    if (prefs(ctx).getString(KEY_ACTIVE, null) != null) handleEnd(ctx)
    cancelAlarm(ctx)
  }

  private fun loadWindows(ctx: Context): List<Window> {
    val raw = prefs(ctx).getString(KEY_EVENTS, null) ?: return emptyList()
    return try {
      val arr = JSONArray(raw)
      (0 until arr.length()).map {
        val o = arr.getJSONObject(it)
        Window(o.getString("id"), o.getLong("start"), o.getLong("end"), o.optString("label"))
      }
    } catch (e: Exception) {
      Log.w(TAG, "Corrupt schedule", e)
      emptyList()
    }
  }

  private fun loadHandled(ctx: Context): MutableSet<String> =
    prefs(ctx).getStringSet(KEY_HANDLED, emptySet())!!.toMutableSet()

  private fun markHandled(ctx: Context, id: String) {
    val now = System.currentTimeMillis()
    val liveIds = loadWindows(ctx).filter { it.end > now }.map { it.id }.toSet()
    val handled = loadHandled(ctx).filter { it in liveIds }.toMutableSet()
    handled.add(id)
    prefs(ctx).edit().putStringSet(KEY_HANDLED, handled).apply()
  }

  private fun activeWindow(ctx: Context): JSONObject? =
    prefs(ctx).getString(KEY_ACTIVE, null)?.let { runCatching { JSONObject(it) }.getOrNull() }

  // ---------------------------------------------------------------- alarm chain

  /** Arms the single alarm for the next start/end event. Safe to call any time. */
  fun reschedule(ctx: Context) {
    val now = System.currentTimeMillis()
    val active = activeWindow(ctx)
    if (active != null) {
      val end = active.getLong("end")
      if (end <= now) handleEnd(ctx) else setAlarm(ctx, end)
      return
    }
    val handled = loadHandled(ctx)
    val next = loadWindows(ctx).firstOrNull { it.end > now && it.id !in handled }
    if (next == null) {
      cancelAlarm(ctx)
      return
    }
    if (next.start <= now) {
      // We are already inside a window (schedule set mid-prayer, or device just booted).
      handleStart(ctx, next)
    } else {
      setAlarm(ctx, next.start)
    }
  }

  fun onAlarm(ctx: Context) {
    val now = System.currentTimeMillis()
    val active = activeWindow(ctx)
    if (active != null && active.getLong("end") <= now + 1_000) {
      handleEnd(ctx)
      return
    }
    reschedule(ctx)
  }

  private fun pendingIntent(ctx: Context): PendingIntent {
    val intent = Intent(ctx, SilentReceiver::class.java).setAction(ACTION_ALARM)
    return PendingIntent.getBroadcast(
      ctx, REQUEST_CODE, intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun setAlarm(ctx: Context, at: Long) {
    val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val pi = pendingIntent(ctx)
    try {
      if (canScheduleExact(ctx)) {
        am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi)
      } else {
        // Without exact-alarm access Android may delay this by several minutes.
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi)
      }
    } catch (e: SecurityException) {
      am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi)
    }
  }

  private fun cancelAlarm(ctx: Context) {
    val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    am.cancel(pendingIntent(ctx))
  }

  fun canScheduleExact(ctx: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
    val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    return am.canScheduleExactAlarms()
  }

  // ---------------------------------------------------------------- ringer control

  fun hasDndAccess(ctx: Context): Boolean {
    val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    return nm.isNotificationPolicyAccessGranted
  }

  private fun isAlreadyQuiet(ctx: Context): Boolean {
    val audio = ctx.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    return audio.ringerMode != AudioManager.RINGER_MODE_NORMAL ||
      nm.currentInterruptionFilter > NotificationManager.INTERRUPTION_FILTER_ALL
  }

  private fun handleStart(ctx: Context, w: Window) {
    markHandled(ctx, w.id)
    val audio = ctx.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    if (isAlreadyQuiet(ctx)) {
      // User already silenced the phone themselves: don't touch anything.
      prefs(ctx).edit().putString(KEY_LAST_SKIPPED, w.id).apply()
      reschedule(ctx)
      return
    }
    if (!hasDndAccess(ctx)) {
      Log.w(TAG, "DND access not granted; cannot silence for ${w.label}")
      reschedule(ctx)
      return
    }

    val target = if (prefs(ctx).getString(KEY_MODE, "silent") == "vibrate")
      AudioManager.RINGER_MODE_VIBRATE else AudioManager.RINGER_MODE_SILENT
    try {
      audio.ringerMode = target
    } catch (e: SecurityException) {
      Log.w(TAG, "Ringer change refused", e)
      reschedule(ctx)
      return
    }

    // Some OEMs map SILENT to DND; read back what actually happened so restore is exact.
    val active = JSONObject()
      .put("id", w.id)
      .put("end", w.end)
      .put("label", w.label)
      .put("setRinger", audio.ringerMode)
    prefs(ctx).edit().putString(KEY_ACTIVE, active.toString()).apply()
    showNotification(ctx, w)
    setAlarm(ctx, w.end)
  }

  fun handleEnd(ctx: Context) {
    val active = activeWindow(ctx)
    prefs(ctx).edit().remove(KEY_ACTIVE).apply()
    cancelNotification(ctx)
    if (active != null) {
      val audio = ctx.getSystemService(Context.AUDIO_SERVICE) as AudioManager
      val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      // Only the ringer mode is compared: on some OEMs the DND filter flips asynchronously
      // after a ringer change, so it is not a reliable "user touched it" signal.
      val untouched = audio.ringerMode == active.optInt("setRinger", -1)
      if (untouched) {
        try {
          if (nm.currentInterruptionFilter > NotificationManager.INTERRUPTION_FILTER_ALL && hasDndAccess(ctx)) {
            nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL)
          }
          audio.ringerMode = AudioManager.RINGER_MODE_NORMAL
        } catch (e: SecurityException) {
          Log.w(TAG, "Restore refused", e)
        }
      }
    }
    reschedule(ctx)
  }

  fun status(ctx: Context): Map<String, Any?> {
    val now = System.currentTimeMillis()
    val active = activeWindow(ctx)
    val handled = loadHandled(ctx)
    val windows = loadWindows(ctx).filter { it.end > now }
    val next = windows.firstOrNull { it.id !in handled }
    val last = windows.lastOrNull()
    return mapOf(
      "active" to active?.let { mapOf("id" to it.getString("id"), "label" to it.optString("label"), "end" to it.getLong("end").toDouble()) },
      "next" to next?.let { mapOf("id" to it.id, "label" to it.label, "start" to it.start.toDouble(), "end" to it.end.toDouble()) },
      "scheduledCount" to windows.size,
      "scheduledUntil" to last?.end?.toDouble(),
      "lastSkippedId" to prefs(ctx).getString(KEY_LAST_SKIPPED, null),
      "mode" to prefs(ctx).getString(KEY_MODE, "silent"),
    )
  }

  // ---------------------------------------------------------------- notification

  private fun showNotification(ctx: Context, w: Window) {
    val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    nm.createNotificationChannel(
      NotificationChannel(CHANNEL_ID, "Prayer silent mode", NotificationManager.IMPORTANCE_LOW)
    )
    if (Build.VERSION.SDK_INT >= 33 &&
      ctx.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED
    ) return

    val until = DateFormat.getTimeInstance(DateFormat.SHORT).format(Date(w.end))
    val launch = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)
    val contentIntent = launch?.let {
      PendingIntent.getActivity(ctx, 0, it, PendingIntent.FLAG_IMMUTABLE)
    }
    val n = android.app.Notification.Builder(ctx, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_lock_silent_mode)
      .setContentTitle("${w.label} — phone silenced")
      .setContentText("Sound returns at $until")
      .setOngoing(true)
      .setContentIntent(contentIntent)
      .build()
    nm.notify(NOTIFICATION_ID, n)
  }

  private fun cancelNotification(ctx: Context) {
    val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    nm.cancel(NOTIFICATION_ID)
  }
}
