import { getPrayerTimes, getPrayerState, buildSilentWindows, parseClock, formatCountdown, toLocalDigits } from '../services/prayerService';

const dhaka = { latitude: 23.8103, longitude: 90.4125 };
const calc = { method: 'Karachi', madhab: 'hanafi' };
const hm = (d) => d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' });

const silent = {
  prayers: {
    fajr: { enabled: true, before: 5, after: 25, jamaatTime: '' },
    dhuhr: { enabled: true, before: 5, after: 25, jamaatTime: '' },
    asr: { enabled: false, before: 5, after: 20, jamaatTime: '' },
    maghrib: { enabled: true, before: 2, after: 18, jamaatTime: '' },
    isha: { enabled: true, before: 5, after: 25, jamaatTime: '' },
  },
  jumuah: { enabled: true, before: 10, after: 60, jamaatTime: '' },
};
const labels = { fajr: 'F', dhuhr: 'D', asr: 'A', maghrib: 'M', isha: 'I', jumuah: 'J' };

describe('prayer times (Dhaka, Karachi/Hanafi)', () => {
  const t = getPrayerTimes(dhaka, calc, new Date('2026-11-09T06:00:00Z'));

  it('matches Islamic Foundation Bangladesh times within a few minutes', () => {
    expect(hm(t.fajr)).toBe('04:51');
    expect(hm(t.asr)).toBe('15:39'); // Hanafi Asr (Shafi would be ~15:05)
    expect(hm(t.maghrib)).toBe('17:15');
  });

  it('uses Hanafi Asr by default and Shafi when chosen', () => {
    const shafi = getPrayerTimes(dhaka, { ...calc, madhab: 'shafi' }, new Date('2026-11-09T06:00:00Z'));
    expect(shafi.asr.getTime()).toBeLessThan(t.asr.getTime());
  });

  it('returns null without a location', () => {
    expect(getPrayerTimes(null, calc)).toBeNull();
  });
});

describe('getPrayerState', () => {
  it('after Isha the next prayer is tomorrow’s Fajr', () => {
    const s = getPrayerState(dhaka, calc, new Date('2026-11-09T15:30:00Z')); // 21:30 Dhaka
    expect(s.current).toBe('isha');
    expect(s.next.key).toBe('fajr');
    expect(s.next.time.getTime()).toBeGreaterThan(new Date('2026-11-09T15:30:00Z').getTime());
  });

  it('between sunrise and Dhuhr there is no current fard waqt', () => {
    const s = getPrayerState(dhaka, calc, new Date('2026-11-09T03:00:00Z')); // 09:00 Dhaka
    expect(s.current).toBeNull();
    expect(s.next.key).toBe('dhuhr');
  });
});

describe('buildSilentWindows', () => {
  const from = new Date('2026-11-12T08:00:00Z'); // Thu 14:00 Dhaka
  const w = buildSilentWindows(dhaka, calc, silent, labels, 21, from);

  it('never overlaps and ids are unique', () => {
    expect(new Set(w.map((x) => x.id)).size).toBe(w.length);
    for (let i = 1; i < w.length; i++) expect(w[i].start).toBeGreaterThanOrEqual(w[i - 1].end);
  });

  it('skips disabled prayers and past windows', () => {
    expect(w.some((x) => x.label === 'A')).toBe(false);
    expect(w.every((x) => x.end > from.getTime())).toBe(true);
  });

  it('uses Jumu’ah settings on Friday instead of Dhuhr', () => {
    const friday = w.filter((x) => x.id.startsWith('20261113-'));
    expect(friday.some((x) => x.label === 'J')).toBe(true);
    expect(friday.some((x) => x.label === 'D')).toBe(false);
    const j = friday.find((x) => x.label === 'J');
    expect(j.end - j.start).toBe(70 * 60_000);
  });

  it('anchors on a custom jamaat time', () => {
    const s = { ...silent, prayers: { ...silent.prayers, isha: { enabled: true, before: 5, after: 20, jamaatTime: '20:00' } } };
    const isha = buildSilentWindows(dhaka, calc, s, labels, 2, from).find((x) => x.label === 'I');
    expect(hm(new Date(isha.start))).toBe('19:55');
    expect(hm(new Date(isha.end))).toBe('20:20');
  });
});

describe('helpers', () => {
  it('parseClock validates 24h input', () => {
    const d = new Date(2026, 0, 1);
    expect(parseClock('25:00', d)).toBeNull();
    expect(parseClock('abc', d)).toBeNull();
    expect(parseClock('7:05', d).getHours()).toBe(7);
  });

  it('formats Bangla digits', () => {
    expect(toLocalDigits('12:30', 'bn')).toBe('১২:৩০');
    expect(formatCountdown(3_725_000, 'en')).toBe('01:02:05');
    expect(formatCountdown(-1)).toBe('--:--:--');
  });
});
