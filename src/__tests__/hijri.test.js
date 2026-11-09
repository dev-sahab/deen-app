import { getHijriDate } from '../services/hijri';

describe('getHijriDate', () => {
  it('converts a known date to within one day of Umm al-Qura', () => {
    const h = getHijriDate(new Date(2026, 10, 9));
    expect(h.year).toBe(1448);
    expect(h.month).toBe(5);
    expect(Math.abs(h.day - 29)).toBeLessThanOrEqual(1);
  });

  it('applies the local moon-sighting offset', () => {
    const base = getHijriDate(new Date(2026, 2, 10));
    const minus = getHijriDate(new Date(2026, 2, 10), -1);
    const toNum = (x) => x.year * 400 + x.month * 31 + x.day;
    expect(toNum(minus)).toBeLessThan(toNum(base));
  });
});
