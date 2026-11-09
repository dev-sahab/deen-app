import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import surahs from '../../data/surahs.json';
import { useT } from '../../hooks/useT';
import { useAppStore } from '../../store/useAppStore';
import { toLocalDigits } from '../../services/prayerService';
import { theme } from '../../constants/theme';

const c = theme.colors;

export default function QuranList() {
  const router = useRouter();
  const { t, lang } = useT();
  const lastRead = useAppStore((s) => s.quran.lastRead);
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return surahs;
    return surahs.filter((x) => String(x.n) === s || x.name.toLowerCase().includes(s) || x.en.toLowerCase().includes(s) || x.ar.includes(s));
  }, [q]);

  const last = lastRead ? surahs[lastRead.surah - 1] : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>{t.quran}</Text>
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={c.textSecondary} />
        <TextInput value={q} onChangeText={setQ} placeholder={`${t.surah}…`} style={styles.input} placeholderTextColor={c.textSecondary} />
      </View>
      {last ? (
        <TouchableOpacity style={styles.last} onPress={() => router.push({ pathname: '/quran/[surah]', params: { surah: last.n, verse: lastRead.verse } })}>
          <Ionicons name="bookmark" size={18} color={c.gold} />
          <Text style={styles.lastText}>
            {last.name} · {t.verses} {toLocalDigits(lastRead.verse, lang)}
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>
      ) : null}
      <FlatList
        data={list}
        keyExtractor={(x) => String(x.n)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        initialNumToRender={20}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => router.push({ pathname: '/quran/[surah]', params: { surah: item.n } })}>
            <View style={styles.num}><Text style={styles.numText}>{toLocalDigits(item.n, lang)}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>
                {item.en} · {item.rev === 'M' ? t.meccan : t.medinan} · {toLocalDigits(item.v, lang)} {t.verses}
              </Text>
            </View>
            <Text style={styles.ar}>{item.ar}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  title: { fontSize: 22, fontWeight: '700', color: c.textPrimary, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 12, marginBottom: 10, borderWidth: 1, borderColor: c.border },
  input: { flex: 1, paddingVertical: 10, fontSize: 15, color: c.textPrimary },
  last: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.primary, marginHorizontal: 16, borderRadius: 12, padding: 12, marginBottom: 10 },
  lastText: { flex: 1, color: '#fff', fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8 },
  num: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: c.gold, alignItems: 'center', justifyContent: 'center' },
  numText: { fontWeight: '700', color: c.primary, fontSize: 13 },
  name: { fontSize: 16, fontWeight: '700', color: c.textPrimary },
  sub: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
  ar: { fontSize: 18, color: c.primary },
});
