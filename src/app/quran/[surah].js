import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import surahs from '../../data/surahs.json';
import { Screen, Loading, ErrorView } from '../../components/ui';
import { useT } from '../../hooks/useT';
import { useAppStore } from '../../store/useAppStore';
import { getSurah } from '../../services/contentService';
import { toLocalDigits } from '../../services/prayerService';
import { theme } from '../../constants/theme';

const c = theme.colors;
const BISMILLAH = 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ';

export default function SurahReader() {
  const { surah, verse } = useLocalSearchParams();
  const n = Number(surah);
  const info = surahs[n - 1];
  const { t, lang } = useT();
  const quran = useAppStore((s) => s.quran);
  const setQuran = useAppStore((s) => s.setQuran);
  const [verses, setVerses] = useState(null);
  const [error, setError] = useState(false);
  const listRef = useRef(null);

  const load = useCallback(() => {
    setError(false);
    setVerses(null);
    getSurah(n, { arabicEdition: quran.arabicEdition, lang, withTranslation: quran.showTranslation })
      .then(setVerses)
      .catch(() => setError(true));
  }, [n, quran.arabicEdition, quran.showTranslation, lang]);

  useEffect(load, [load]);

  useEffect(() => {
    const v = Number(verse);
    if (verses && v > 1) {
      setTimeout(() => listRef.current?.scrollToIndex({ index: Math.min(v - 1, verses.length - 1), animated: false }), 50);
    }
  }, [verses]);

  if (!info) return <Screen title={t.quran} back><ErrorView text="Surah not found" /></Screen>;

  return (
    <Screen title={`${toLocalDigits(info.n, lang)}. ${info.name}`} back scroll={false}>
      {error ? (
        <ErrorView text={t.offlineError} onRetry={load} retryLabel={t.retry} />
      ) : !verses ? (
        <Loading text={t.loading} />
      ) : (
        <FlatList
          ref={listRef}
          data={verses}
          keyExtractor={(v) => String(v.verse)}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          onScrollToIndexFailed={() => {}}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.headerAr}>{info.ar}</Text>
              <Text style={styles.headerSub}>{info.en} · {toLocalDigits(info.v, lang)} {t.verses}</Text>
              {n !== 1 && n !== 9 ? <Text style={styles.bismillah}>{BISMILLAH}</Text> : null}
            </View>
          }
          renderItem={({ item }) => {
            const marked = quran.lastRead?.surah === n && quran.lastRead?.verse === item.verse;
            return (
              <View style={styles.verse}>
                <View style={styles.verseTop}>
                  <View style={styles.badge}><Text style={styles.badgeText}>{toLocalDigits(item.verse, lang)}</Text></View>
                  <TouchableOpacity onPress={() => setQuran({ lastRead: { surah: n, verse: item.verse } })} hitSlop={10}>
                    <Ionicons name={marked ? 'bookmark' : 'bookmark-outline'} size={20} color={marked ? c.gold : c.textSecondary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.arabic}>{item.arabic}</Text>
                {item.translation ? <Text style={styles.translation}>{item.translation}</Text> : null}
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: c.primary, borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 14 },
  headerAr: { fontSize: 28, color: '#fff' },
  headerSub: { color: c.goldLight, marginTop: 4 },
  bismillah: { fontSize: 24, color: c.gold, marginTop: 14 },
  verse: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
  verseTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { minWidth: 30, height: 30, paddingHorizontal: 6, borderRadius: 15, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: c.primary, fontWeight: '700', fontSize: 12 },
  arabic: { fontSize: 26, lineHeight: 50, color: c.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  translation: { fontSize: 15, lineHeight: 24, color: c.textSecondary, marginTop: 8 },
});
