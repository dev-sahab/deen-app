import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, SectionTitle } from '../../components/ui';
import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useT';
import { useNow } from '../../hooks/useNow';
import { theme } from '../../constants/theme';
import { getPrayerState, formatTime, formatCountdown, toLocalDigits, PRAYERS } from '../../services/prayerService';
import { getHijriDate, HIJRI_MONTHS } from '../../services/hijri';
import { getDailyHadith } from '../../services/contentService';
import * as DeenGuard from '../../../modules/deen-guard';

const c = theme.colors;

export default function Home() {
  const router = useRouter();
  const { t, lang } = useT();
  const location = useAppStore((s) => s.location);
  const calc = useAppStore((s) => s.calc);
  const silent = useAppStore((s) => s.silent);
  const now = useNow(1000);
  const dayKey = now.toDateString();
  const minuteKey = Math.floor(now.getTime() / 60_000);

  const state = useMemo(() => getPrayerState(location, calc, now), [location, calc, minuteKey]);
  const hijri = useMemo(() => getHijriDate(now, calc.hijriOffset), [dayKey, calc.hijriOffset]);

  const [silentStatus, setSilentStatus] = useState(null);
  useEffect(() => {
    setSilentStatus(DeenGuard.getSilentStatus());
  }, [minuteKey, silent]);

  const [hadith, setHadith] = useState(null);
  useEffect(() => {
    getDailyHadith(lang).then(setHadith).catch(() => setHadith(null));
  }, [lang, dayKey]);

  const gregorian = now.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const hijriText = `${toLocalDigits(hijri.day, lang)} ${HIJRI_MONTHS[lang][hijri.month - 1]} ${toLocalDigits(hijri.year, lang)}`;
  const nextIn = state?.next?.time ? state.next.time.getTime() - now.getTime() : null;

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.locRow}>
          <Ionicons name="location-outline" size={16} color={c.goldLight} />
          <Text style={styles.loc} numberOfLines={1}>
            {location.city}{location.country ? `, ${location.country}` : ''}
          </Text>
        </View>
        <Text style={styles.date}>{gregorian}</Text>
        <Text style={styles.hijri}>{hijriText} {lang === 'bn' ? 'হিজরি' : 'AH'}</Text>

        <View style={styles.divider} />
        <Text style={styles.heroLabel}>
          {t.currentWaqt}: {state?.current ? t[state.current] : t.noWaqt}
        </Text>
        <Text style={styles.nextName}>
          {t.nextPrayer}: {state?.next ? t[state.next.key] : '--'} · {formatTime(state?.next?.time, lang)}
        </Text>
        <Text style={styles.countdown}>{formatCountdown(nextIn, lang)}</Text>
        <Text style={styles.heroLabel}>{t.remaining}</Text>
      </View>

      {silent.enabled && silentStatus ? (
        <TouchableOpacity onPress={() => router.push('/silent')}>
          <Card style={styles.silentCard}>
            <Ionicons
              name={silentStatus.active ? 'volume-mute' : 'notifications-off-outline'}
              size={22}
              color={c.silentActive}
            />
            <Text style={styles.silentText}>
              {silentStatus.active
                ? `${t.silentNow}: ${silentStatus.active.label} — ${t.silentUntil} ${formatTime(new Date(silentStatus.active.end), lang)}`
                : silentStatus.next
                ? `${t.silentNext}: ${silentStatus.next.label} · ${formatTime(new Date(silentStatus.next.start), lang)}`
                : t.autoSilent}
            </Text>
          </Card>
        </TouchableOpacity>
      ) : null}

      <SectionTitle>{t.todayPrayers}</SectionTitle>
      <Card style={{ paddingVertical: 6 }}>
        {['fajr', 'sunrise', ...PRAYERS.slice(1)].map((key) => {
          const isNext = state?.next?.key === key;
          const isCurrent = state?.current === key;
          const silentOn = silent.enabled && silent.prayers[key]?.enabled;
          return (
            <View key={key} style={[styles.prayerRow, isNext && styles.prayerNext]}>
              <Text style={[styles.prayerName, isCurrent && { color: c.primary }]}>
                {t[key]}
                {isCurrent ? ' •' : ''}
              </Text>
              {silentOn ? <Ionicons name="volume-mute-outline" size={15} color={c.silentActive} style={{ marginRight: 8 }} /> : null}
              <Text style={[styles.prayerTime, isNext && { color: c.primary }]}>
                {formatTime(state?.today?.[key], lang)}
              </Text>
            </View>
          );
        })}
        {state?.today?.lastThird ? (
          <View style={styles.prayerRow}>
            <Text style={[styles.prayerName, styles.minor]}>{t.lastThird}</Text>
            <Text style={[styles.prayerTime, styles.minor]}>{formatTime(state.today.lastThird, lang)}</Text>
          </View>
        ) : null}
      </Card>

      <View style={styles.quickRow}>
        {[
          ['compass-outline', t.qibla, '/qibla'],
          ['ellipse-outline', t.tasbih, '/tasbih'],
          ['volume-mute-outline', t.autoSilent, '/silent'],
        ].map(([icon, label, href]) => (
          <TouchableOpacity key={href} style={styles.quick} onPress={() => router.push(href)}>
            <Ionicons name={icon} size={24} color={c.primary} />
            <Text style={styles.quickText} numberOfLines={1}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {hadith ? (
        <>
          <SectionTitle>{t.hadithOfDay}</SectionTitle>
          <Card>
            <Text style={styles.hadith} numberOfLines={10}>{hadith.text}</Text>
            <Text style={styles.hadithRef}>— An-Nawawi 40, #{toLocalDigits(hadith.hadithnumber, lang)}</Text>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: c.primary, borderRadius: 20, padding: 20, marginBottom: 14, alignItems: 'center', ...theme.shadows.activeCard },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  loc: { color: c.goldLight, fontSize: 13, fontWeight: '600' },
  date: { color: '#fff', fontSize: 15, marginTop: 6 },
  hijri: { color: c.gold, fontSize: 14, marginTop: 2, fontWeight: '600' },
  divider: { height: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 14 },
  heroLabel: { color: c.goldLight, fontSize: 13 },
  nextName: { color: '#fff', fontSize: 17, fontWeight: '700', marginTop: 6 },
  countdown: { color: '#fff', fontSize: 40, fontWeight: '800', marginTop: 4, fontVariant: ['tabular-nums'] },
  silentCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F3EEFF' },
  silentText: { flex: 1, color: c.textPrimary, fontSize: 14, fontWeight: '600' },
  prayerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 10 },
  prayerNext: { backgroundColor: '#E8F5E9' },
  prayerName: { flex: 1, fontSize: 16, fontWeight: '600', color: c.textPrimary },
  prayerTime: { fontSize: 16, fontWeight: '700', color: c.textPrimary },
  minor: { fontSize: 13, color: c.textSecondary, fontWeight: '500' },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  quick: { flex: 1, backgroundColor: c.cardBg, borderRadius: 14, paddingVertical: 14, alignItems: 'center', gap: 6, ...theme.shadows.card },
  quickText: { fontSize: 12, fontWeight: '600', color: c.textPrimary },
  hadith: { fontSize: 15, lineHeight: 24, color: c.textPrimary },
  hadithRef: { fontSize: 12, color: c.textSecondary, marginTop: 8, textAlign: 'right' },
});
