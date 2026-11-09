import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

/**
 * JS wrapper for the native DeenGuard module.
 * In Expo Go / web / iOS the native features are absent; every call is safe and
 * `getSupport()` tells the UI what can be shown.
 */
const Native = requireOptionalNativeModule('DeenGuard');

const call = (name, fallback, ...args) => {
  if (!Native || typeof Native[name] !== 'function') return fallback;
  try {
    return Native[name](...args);
  } catch (e) {
    console.warn(`[DeenGuard] ${name} failed:`, e?.message || e);
    return fallback;
  }
};

export const isNativeAvailable = !!Native;

export const getSupport = () =>
  call('getSupport', { silent: false, contentFilter: false, appBlocker: false, platform: Platform.OS });

// Permissions / system settings
export const hasDndAccess = () => call('hasDndAccess', false);
export const openDndSettings = () => call('openDndSettings');
export const canScheduleExactAlarms = () => call('canScheduleExactAlarms', true);
export const openExactAlarmSettings = () => call('openExactAlarmSettings');
export const isIgnoringBatteryOptimizations = () => call('isIgnoringBatteryOptimizations', true);
export const openBatterySettings = () => call('openBatterySettings');
export const getRingerMode = () => call('getRingerMode', 'unknown');

// Auto-silent
/** @param {{id:string,start:number,end:number,label:string}[]} windows @param {'silent'|'vibrate'} mode */
export const scheduleSilentWindows = (windows, mode = 'silent') => call('scheduleSilentWindows', 0, windows, mode);
export const clearSilentWindows = () => call('clearSilentWindows');
export const getSilentStatus = () => call('getSilentStatus', { active: null, next: null, scheduledCount: 0 });

// Content filter (local DNS VPN)
export const prepareContentFilter = () => call('prepareContentFilter', false);
export const isContentFilterPrepared = () => call('isContentFilterPrepared', false);
export const startContentFilter =() => call('startContentFilter', false);
export const stopContentFilter = () => call('stopContentFilter');
export const getContentFilterStatus = () =>
  call('getContentFilterStatus', { running: false, wanted: false, blockedCount: 0, upstream: [] });
export const setContentFilterConfig = (upstream, blockedDomains) =>
  call('setContentFilterConfig', undefined, upstream, blockedDomains);
export const openVpnSettings = () => call('openVpnSettings');

// App blocker (accessibility service)
export const isAppBlockerEnabled = () => call('isAppBlockerEnabled', false);
export const openAccessibilitySettings = () => call('openAccessibilitySettings');
export const setBlockedApps = (packages) => call('setBlockedApps', undefined, packages);
export const getInstalledApps = async () => {
  if (!Native?.getInstalledApps) return [];
  try {
    return await Native.getInstalledApps();
  } catch (e) {
    console.warn('[DeenGuard] getInstalledApps failed:', e?.message || e);
    return [];
  }
};
