import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Share, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import books from '../../../data/hadithBooks.json';
import { Screen, Loading, ErrorView } from '../../../components/ui';
import { useT } from '../../../hooks/useT';
import { getHadithSection } from '../../../services/contentService';
import { toLocalDigits } from '../../../services/prayerService';
import { BOOK_NAMES_BN } from '../../../data/hadithNames';
import { theme } from '../../../constants/theme';

const c = theme.colors;

export default function HadithList() {
  const { book, section } = useLocalSearchParams();
  const { t, lang } = useT();
  const info = books.find((b) => b.id === book);
  const sec = info?.sections.find((s) => String(s.n) === String(section));
  const bookName = lang === 'bn' ? BOOK_NAMES_BN[book] : info?.name;
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    setItems(null);
    getHadithSection(book, section, lang).then(setItems).catch(() => setError(true));
  }, [book, section, lang]);
  useEffect(load, [load]);

  return (
    <Screen title={sec?.t || bookName} back scroll={false}>
      {error ? (
        <ErrorView text={t.offlineError} onRetry={load} retryLabel={t.retry} />
      ) : !items ? (
        <Loading text={t.loading} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(h) => String(h.hadithnumber)}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          initialNumToRender={8}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.top}>
                <Text style={styles.num}>{t.hadithNo} {toLocalDigits(item.hadithnumber, lang)}</Text>
                <TouchableOpacity
                  hitSlop={10}
                  onPress={() => Share.share({ message: `${item.text}\n\n— ${bookName}, ${item.hadithnumber}` })}
                >
                  <Ionicons name="share-social-outline" size={18} color={c.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.text} selectable>{item.text}</Text>
              {item.grades?.length ? (
                <Text style={styles.grade}>{item.grades.map((g) => `${g.grade} (${g.name})`).join(' · ')}</Text>
              ) : null}
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  num: { color: c.primary, fontWeight: '700' },
  text: { fontSize: 15, lineHeight: 25, color: c.textPrimary },
  grade: { fontSize: 12, color: c.textSecondary, marginTop: 8 },
});
