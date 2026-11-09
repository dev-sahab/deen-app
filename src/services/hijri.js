const t = Math.trunc;

/** Tabular (Kuwaiti) Islamic calendar. Can differ from moon sighting by ±1 day. */
const tabularHijri = (date) => {
  const d = date.getDate(), m = date.getMonth() + 1, y = date.getFullYear();
  const jd = t((1461 * (y + 4800 + t((m - 14) / 12))) / 4) + t((367 * (m - 2 - 12 * t((m - 14) / 12))) / 12)
    - t((3 * t((y + 4900 + t((m - 14) / 12)) / 100)) / 4) + d - 32075;
  let l = jd - 1948440 + 10632;
  const n = t((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = t((10985 - l) / 5316) * t((50 * l) / 17719) + t(l / 5670) * t((43 * l) / 15238);
  l = l - t((30 - j) / 15) * t((17719 * j) / 50) - t(j / 16) * t((15238 * j) / 43) + 29;
  const month = t((24 * l) / 709);
  return { day: l - t((709 * month) / 24), month, year: 30 * n + j - 30 };
};

let intlFormatter;
const intlHijri = (date) => {
  try {
    if (intlFormatter === undefined) {
      intlFormatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
        day: 'numeric', month: 'numeric', year: 'numeric',
      });
      // Engines without the calendar silently fall back to Gregorian.
      if (intlFormatter.resolvedOptions().calendar !== 'islamic-umalqura') intlFormatter = null;
    }
    if (!intlFormatter) return null;
    const parts = Object.fromEntries(intlFormatter.formatToParts(date).map((p) => [p.type, p.value]));
    const res = { day: parseInt(parts.day, 10), month: parseInt(parts.month, 10), year: parseInt(parts.year, 10) };
    return res.day && res.month && res.year ? res : null;
  } catch {
    intlFormatter = null;
    return null;
  }
};

/** @param offsetDays local moon-sighting adjustment (Bangladesh is often -1 vs Saudi). */
export const getHijriDate = (date = new Date(), offsetDays = 0) => {
  const d = new Date(date);
  d.setDate(d.getDate() + offsetDays);
  return intlHijri(d) || tabularHijri(d);
};

export const HIJRI_MONTHS = {
  en: ['Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani", 'Jumada al-Ula', 'Jumada al-Akhirah',
    'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhu al-Qa'dah", 'Dhu al-Hijjah'],
  bn: ['মুহাররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি', 'জমাদিউল আউয়াল', 'জমাদিউস সানি',
    'রজব', 'শাবান', 'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ'],
};
