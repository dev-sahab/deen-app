import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as DeenGuard from '../../modules/deen-guard';
import { useAppStore, FILTER_PRESETS } from '../store/useAppStore';
import { buildSilentWindows, getPrayerTimes, PRAYERS } from './prayerService';
import { translations } from '../constants/translations';

const ATHAN_CHANNEL = 'athan';
const REMINDER_CHANNEL = 'prayer-reminder';
const ATHAN_DAYS = 5; // iOS allows max 64 pending notifications

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let channelsReady = false;
const ensureChannels = async () => {
  if (channelsReady || Platform.OS !== 'android') return;
  // A custom athan sound is used when assets/sounds/athan.wav was bundled (see app.config.js).
  await Notifications.setNotificationChannelAsync(ATHAN_CHANNEL, {
    name: 'Athan',
    importance: Notifications.AndroidImportance.HIGH,
    sound: hasAthanSound() ? 'athan.wav' : 'default',
    vibrationPattern: [0, 400, 200, 400],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
    name: 'Prayer reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  channelsReady = true;
};

const hasAthanSound = () => !!Constants.expoConfig?.extra?.hasAthanSound;

export const requestNotificationPermission = async () => {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const res = await Notifications.requestPermissionsAsync();
  return res.granted;
};

/** Re-schedules athan notifications for the next few days. */
export const syncAthan = async () => {
  const { athan, location, calc, language } = useAppStore.getState();
  const t = translations[language];
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!athan.enabled) return;
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return;
  await ensureChannels();

  const now = Date.now();
  for (let i = 0; i < ATHAN_DAYS; i++) {
    const day = new Date();
    day.setHours(12, 0, 0, 0);
    day.setDate(day.getDate() + i);
    const times = getPrayerTimes(location, calc, day);
    if (!times) continue;
    for (const key of PRAYERS) {
      if (!athan.prayers[key]) continue;
      const at = times[key];
      if (at.getTime() > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${t[key]} — ${t.athanTitle}`,
            body: t.athanBody,
            sound: hasAthanSound() ? 'athan.wav' : true,
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: ATHAN_CHANNEL },
        });
      }
      const before = athan.reminderMinutes;
      if (before > 0 && at.getTime() - before * 60_000 > now) {
        await Notifications.scheduleNotificationAsync({
          content: { title: t[key], body: t.reminderBody.replace('{n}', before) },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(at.getTime() - before * 60_000),
            channelId: REMINDER_CHANNEL,
          },
        });
      }
    }
  }
};

/** Pushes the next 3 weeks of silent windows to the native scheduler (Android). */
export const syncSilent = () => {
  const { silent, location, calc, language } = useAppStore.getState();
  if (!DeenGuard.getSupport().silent) return 0;
  if (!silent.enabled) {
    DeenGuard.clearSilentWindows();
    return 0;
  }
  const t = translations[language];
  const windows = buildSilentWindows(location, calc, silent, { ...t, jumuah: t.jumuah });
  return DeenGuard.scheduleSilentWindows(windows, silent.mode);
};

export const syncContentFilter = () => {
  const { guard } = useAppStore.getState();
  if (!DeenGuard.getSupport().contentFilter) return;
  const preset = FILTER_PRESETS[guard.filterPreset] || FILTER_PRESETS.adguardFamily;
  DeenGuard.setContentFilterConfig(preset.servers, guard.customDomains);
  DeenGuard.setBlockedApps(guard.blockedApps);
};

/** Called on launch and whenever the app returns to foreground. */
export const syncAll = async () => {
  try {
    syncSilent();
    syncContentFilter();
    await syncAthan();
  } catch (e) {
    console.warn('sync failed', e);
  }
};
