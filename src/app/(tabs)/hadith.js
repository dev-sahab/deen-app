import React from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import books from '../../data/hadithBooks.json';
import { BOOK_NAMES_BN } from '../../data/hadithNames';
import { Screen, Card, Row } from '../../components/ui';
import { useT } from '../../hooks/useT';
import { toLocalDigits } from '../../services/prayerService';
import { theme } from '../../constants/theme';

export default function HadithBooks() {
  const router = useRouter();
  const { t, lang } = useT();
  return (
    <Screen title={t.hadith}>
      <Card style={{ paddingVertical: 4 }}>
        {books.map((b) => (
          <Row
            key={b.id}
            icon="book-outline"
            title={lang === 'bn' ? BOOK_NAMES_BN[b.id] : b.name}
            subtitle={`${toLocalDigits(b.sections.length, lang)} ${t.chapters} · ${toLocalDigits(b.sections[b.sections.length - 1]?.l || 0, lang)} ${t.hadith}`}
            onPress={() =>
              b.sections.length === 1
                ? router.push({ pathname: '/hadith/[book]/[section]', params: { book: b.id, section: b.sections[0].n } })
                : router.push({ pathname: '/hadith/[book]', params: { book: b.id } })
            }
          />
        ))}
      </Card>
      <Text style={{ fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center' }}>
        Source: fawazahmed0/hadith-api
      </Text>
    </Screen>
  );
}
