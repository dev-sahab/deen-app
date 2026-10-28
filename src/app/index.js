import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../store/useAppStore';
import { translations } from '../constants/translations';
import { theme } from '../constants/theme';
import { detectUserLocationAndLanguage } from '../services/locationService';
import { Ionicons } from '@expo/vector-icons';

export default function LanguageSetupScreen() {
  const router = useRouter();
  const { language, setLanguage, hasCompletedOnboarding, completeOnboarding, setLocation } = useAppStore();
  const [loading, setLoading] = useState(true);
  const t = translations[language];

  useEffect(() => {
    // Check if onboarding is already completed
    if (hasCompletedOnboarding) {
      router.replace('/(tabs)');
      return;
    }

    // Auto-detect location & suggest language
    const initApp = async () => {
      setLoading(true);
      const res = await detectUserLocationAndLanguage();
      if (res.success) {
        setLanguage(res.suggestedLang);
        setLocation({
          latitude: res.coords.latitude,
          longitude: res.coords.longitude,
          city: res.address.city,
          country: res.address.country,
          countryCode: res.address.countryCode,
        });
      }
      setLoading(false);
    };

    initApp();
  }, [hasCompletedOnboarding]);

  const handleContinue = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoBadge}>
          <Ionicons name="moon" size={48} color={theme.colors.gold} />
        </View>
        <Text style={styles.loadingTitle}>দ্বীন অ্যাপ / Deen App</Text>
        <ActivityIndicator size="large" color={theme.colors.gold} style={{ marginTop: 20 }} />
        <Text style={styles.loadingText}>অবস্থান ও ভাষা নির্ধারণ করা হচ্ছে...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.logoBadgeLarge}>
          <Ionicons name="moon" size={64} color={theme.colors.gold} />
        </View>
        <Text style={styles.appTitle}>দ্বীন অ্যাপ</Text>
        <Text style={styles.appSubtitle}>Deen App - Islamic Companion</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>ভাষা নির্বাচন করুন / Select Language</Text>
        <Text style={styles.sectionDesc}>
          আপনার সুবিধার্থে ভাষা নির্বাচন করুন। (Default is set based on your region).
        </Text>

        <TouchableOpacity
          style={[styles.langOption, language === 'bn' && styles.selectedLang]}
          onPress={() => setLanguage('bn')}
        >
          <View style={styles.langRow}>
            <Text style={[styles.langText, language === 'bn' && styles.selectedLangText]}>বাংলা (Bangladesh)</Text>
            {language === 'bn' && <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.langOption, language === 'en' && styles.selectedLang]}
          onPress={() => setLanguage('en')}
        >
          <View style={styles.langRow}>
            <Text style={[styles.langText, language === 'en' && styles.selectedLangText]}>English (International)</Text>
            {language === 'en' && <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>{t.continue}</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    padding: 24,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: theme.colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.gold,
    marginBottom: 16,
  },
  logoBadgeLarge: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: theme.colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.gold,
    marginBottom: 16,
    alignSelf: 'center',
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.goldLight,
    marginTop: 10,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 14,
    color: theme.colors.goldLight,
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: 20,
    padding: 24,
    ...theme.shadows.card,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  sectionDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  langOption: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  selectedLang: {
    borderColor: theme.colors.primary,
    backgroundColor: '#E8F5E9',
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  langText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  selectedLangText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
