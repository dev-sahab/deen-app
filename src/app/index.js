import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import { translations } from '../constants/translations';
import { theme } from '../constants/theme';
import { detectLocation } from '../services/locationService';
import { requestNotificationPermission } from '../services/syncService';

/** First launch: detect location → suggest language → continue. */
export default function Onboarding() {
  const router = useRouter();
  const done = useAppStore((s) => s.hasCompletedOnboarding);
  const language = useAppStore((s) => s.language);
  const { setLanguage, setLocation, completeOnboarding } = useAppStore.getState();
  const [loading, setLoading] = useState(!done);
  const t = translations[language];

  useEffect(() => {
    if (done) return;
    (async () => {
      const res = await detectLocation();
      if (res.success) {
        setLocation(res.location);
        setLanguage(res.suggestedLang);
      }
      setLoading(false);
    })();
  }, []);

  if (done) return <Redirect href="/(tabs)" />;

  const finish = async () => {
    await requestNotificationPermission().catch(() => {});
    completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Ionicons name="moon" size={56} color={theme.colors.gold} />
      </View>
      <Text style={styles.title}>দ্বীন অ্যাপ</Text>
      <Text style={styles.subtitle}>Deen App · {t.tagline}</Text>

      <View style={styles.card}>
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.desc}>অবস্থান নির্ধারণ করা হচ্ছে... / Detecting location...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.cardTitle}>ভাষা নির্বাচন করুন / Select Language</Text>
            {[
              ['bn', 'বাংলা'],
              ['en', 'English'],
            ].map(([code, label]) => (
              <TouchableOpacity
                key={code}
                style={[styles.option, language === code && styles.optionActive]}
                onPress={() => setLanguage(code)}
              >
                <Text style={[styles.optionText, language === code && { color: theme.colors.primary }]}>{label}</Text>
                {language === code && <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.button} onPress={finish}>
              <Text style={styles.buttonText}>{t.continue}</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.primary, padding: 24, justifyContent: 'center' },
  badge: {
    width: 104, height: 104, borderRadius: 52, alignSelf: 'center', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primaryDark, borderWidth: 3, borderColor: theme.colors.gold, marginBottom: 14,
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 14, color: theme.colors.goldLight, textAlign: 'center', marginTop: 4, marginBottom: 28 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 22, ...theme.shadows.card },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: theme.colors.textPrimary, textAlign: 'center', marginBottom: 16 },
  desc: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 12, textAlign: 'center' },
  option: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 12, padding: 16, marginBottom: 10,
  },
  optionActive: { borderColor: theme.colors.primary, backgroundColor: '#E8F5E9' },
  optionText: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary },
  button: {
    backgroundColor: theme.colors.primary, borderRadius: 12, padding: 16, marginTop: 10,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
