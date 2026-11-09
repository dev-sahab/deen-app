import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import books from '../../../data/hadithBooks.json';
import { Screen } from '../../../components/ui';
import { useT } from '../../../hooks/useT';
import { toLocalDigits } from '../../../services/prayerService';
import { BOOK_NAMES_BN } from '../../../data/hadithNames';
import { theme } from '../../../constants/theme';

const c = theme.colors;

export default function HadithSections() {
  const { book } = useLocalSearchParams();
  const router = useRouter();
  const { lang } = useT();
  const info = books.find((b) => b.id === book);
  if (!info) return <Screen title="Hadith" back />;
  return (
    <Screen title={lang === 'bn' ? BOOK_NAMES_BN[info.id] : info.name} back scroll={false}>
      <FlatList
        data={info.sections}
        keyExtractor={(s) => String(s.n)}
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push({ pathname: '/hadith/[book]/[section]', params: { book: info.id, section: item.n } })}
          >
            <Text style={styles.num}>{toLocalDigits(item.n, lang)}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.t}</Text>
              <Text style={styles.sub}>#{toLocalDigits(item.f, lang)} – {toLocalDigits(item.l, lang)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, alignItems: 'center' },
  num: { width: 32, textAlign: 'center', fontWeight: '700', color: c.primary },
  title: { fontSize: 15, fontWeight: '600', color: c.textPrimary },
  sub: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
});
