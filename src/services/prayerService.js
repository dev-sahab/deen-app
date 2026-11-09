import { Coordinates, CalculationMethod, Madhab, PrayerTimes, SunnahTimes, Qibla, HighLatitudeRule } from 'adhan';

export const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const CALC_METHODS = {
  Karachi: 'University of Islamic Sciences, Karachi',
  MuslimWorldLeague: 'Muslim World League',
  UmmAlQura: 'Umm al-Qura, Makkah',
  Egyptian: 'Egyptian General Authority',
  NorthAmerica: 'ISNA (North America)',
  MoonsightingCommittee: 'Moonsighting Committee',
  Dubai: 'Dubai',
  Kuwait: 'Kuwait',
  Qatar: 'Qatar',
  Singapore: 'Singapore',
  Turkey: 'Diyanet, Turkey',
  Tehran: 'Tehran',
};

const buildParams = ({ method = 'Karachi', madhab = 'hanafi', latitude } = {}) => {
  const factory = CalculationMethod[method] || CalculationMethod.Karachi;
  const params = factory();
  // Bangladesh / South Asia is overwhelmingly Hanafi: later Asr time.
  params.madhab = madhab === 'shafi' ? Madhab.Shafi : Madhab.Hanafi;
  if (Math.abs(latitude || 0) > 48) {
    params.highLatitudeRule = HighLatitudeRule.recommended(new Coordinates(latitude, 0));
  }
  return params;
};

/** Prayer times for one day. All values are JS Date objects. */
export const getPrayerTimes = (location, calc, date = new Date()) => {
  if (!location?.latitude || !location?.longitude) return null;
  try {
    const coords = new Coordinates(location.latitude, location.longitude);
    const pt = new PrayerTimes(coords, date, buildParams({ ...calc, latitude: location.latitude }));
    const sunnah = new SunnahTimes(pt);
    return {
      fajr: pt.fajr,
      sunrise: pt.sunrise,
      dhuhr: pt.dhuhr,
      asr: pt.asr,
      maghrib: pt.maghrib,
      isha: pt.isha,
      lastThird: sunnah.lastThirdOfTheNight,
      midnight: sunnah.middleOfTheNight,
    };
  } catch (e) {
    console.warn('Prayer time calculation failed', e);
    return null;
  }
};

/**
 * Current & next prayer, looking into tomorrow after Isha.
 * Returns { current, next: { key, time }, today }.
 */
export const getPrayerState = (location, calc, now = new Date()) => {
  const today = getPrayerTimes(location, calc, now);
  if (!today) return null;
  let current = null;
  let next = null;
  for (const key of PRAYERS) {
    if (today[key] <= now) current = key;
    else if (!next) next = { key, time: today[key] };
  }
  if (!next) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const t = getPrayerTimes(location, calc, tomorrow);
    next = { key: 'fajr', time: t?.fajr };
  }
  // Between sunrise and Dhuhr there is no fard prayer "running".
  if (current === 'fajr' && now >= today.sunrise) current = null;
  if (!current && now < today.fajr) current = 'isha';
  return { current, next, today };
};

export const getQiblaDirection = (location) =>
  location?.latitude ? Qibla(new Coordinates(location.latitude, location.longitude)) : null;

/** Parses "HH:MM" (24h) into a Date on the given day, or null. */
export const parseClock = (value, day) => {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec((value || '').trim());
  if (!m) return null;
  const d = new Date(day);
  d.setHours(+m[1], +m[2], 0, 0);
  return d;
};

/**
 * Builds the auto-silent windows for the next `days` days.
 * Friday Dhuhr uses the Jumu'ah settings when enabled.
 */
export const buildSilentWindows = (location, calc, silent, labels, days = 21, from = new Date()) => {
  const windows = [];
  const now = from.getTime();
  for (let i = 0; i < days; i++) {
    const day = new Date(from);
    day.setHours(12, 0, 0, 0);
    day.setDate(day.getDate() + i);
    const times = getPrayerTimes(location, calc, day);
    if (!times) continue;
    const isFriday = day.getDay() === 5;
    for (const key of PRAYERS) {
      const useJumuah = key === 'dhuhr' && isFriday && silent.jumuah?.enabled;
      const cfg = useJumuah ? silent.jumuah : silent.prayers[key];
      if (!cfg?.enabled) continue;
      const anchor = parseClock(cfg.jamaatTime, day) || times[key];
      const start = anchor.getTime() - (cfg.before || 0) * 60_000;
      const end = anchor.getTime() + (cfg.after || 0) * 60_000;
      if (end <= now || end <= start) continue;
      const dateKey = `${day.getFullYear()}${String(day.getMonth() + 1).padStart(2, '0')}${String(day.getDate()).padStart(2, '0')}`;
      windows.push({
        id: `${dateKey}-${useJumuah ? 'jumuah' : key}`,
        start,
        end,
        label: useJumuah ? labels.jumuah : labels[key],
      });
    }
  }
  return windows.sort((a, b) => a.start - b.start);
};

export const formatTime = (date, lang = 'en') => {
  if (!date) return '--:--';
  let h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return toLocalDigits(`${h}:${m} ${suffix}`, lang);
};

export const formatCountdown = (ms, lang = 'en') => {
  if (ms == null || ms < 0) return '--:--:--';
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return toLocalDigits(`${hh}:${mm}:${ss}`, lang);
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toLocalDigits = (value, lang) =>
  lang === 'bn' ? String(value).replace(/\d/g, (d) => BN_DIGITS[d]) : String(value);
