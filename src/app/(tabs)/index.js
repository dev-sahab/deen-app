import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../constants/translations';
import { theme } from '../../constants/theme';
import { getPrayerTimesForLocation, formatPrayerTime } from '../../services/prayerService';
import { Ionicons } from '@expo/vector-icons';
import { PrayerCard } from '../../components/PrayerCard';

export default function PrayerTimesScreen() {
  const router = useRouter();
  const language = useAppStore((state) => state.language);
  const location = useAppStore((state) => state.location);
  const silentSettings = useAppStore((state) => state.silentSettings);
  const isLoadingLocation = useAppStore((state) => state.isLoadingLocation);
  const setLocation = useAppStore((state) => state.setLocation);
  const setLoadingLocation = useAppStore((state) => state.setLoadingLocation);
  const t = translations[language];

  const [prayerTimes, setPrayerTimes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshed, setRefreshed] = useState(false);

  const loadPrayerTimes = async (coords) => {
    if (!coords) return;
    setLoading(true);
    const times = await getPrayerTimesForLocation(coords.latitude, coords.longitude);
    setPrayerTimes(times);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      if (location.latitude && location.longitude) {
        setLoadingLocation(true);
        await loadPrayerTimes(location);
        setLoadingLocation(false);
      }
    };
    init();
  }, [location]);

  const onRefresh = async () => {
    setRefreshed(true);
    await loadPrayerTimes(location);
    setTimeout(() => setRefreshed(false), 2000);
  };

  const handleSilentToggle = (prayer, enabled) => {
    // This would update silent settings; for now just navigate to settings
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.gold} />
        <Text style={styles.loadingText}>অবস্থান নির্ধারণ করা হচ্ছে... / Calculating Prayer Times...</Text>
      </View>
    );
  }

  const getSilentStatus = (prayerName) => {
    const setting = silentSettings[prayerName];
    if (!setting?.enabled) return 'inactive';
    const prayerTime = prayerTimes?.[prayerName];
    if (!prayerTime) return 'inactive';
    return 'active';
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshed} onRefresh={onRefresh} />}
    >
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={20} color={theme.colors.gold} />
          <Text style={styles.locationText}>
            {location.city}, {location.country}
          </Text>
        </View>
        <Text style={styles.currentStatus}>
          {prayerTimes ? prayerTimes.currentPrayer.name : '--'}
        </Text>
        <Text style={styles.nextPrayerText}>
          {prayerTimes ? prayerTimes.nextPrayer.name : '--'} - {formatPrayerTime(prayerTimes?.nextPrayer.time)}
        </Text>
      </View>

      {/* Auto Silent Status Card */}
      <View style={styles.autoSilentCard}>
        <View style={styles.autoSilentRow}>
          <View>
            <Text style={styles.autoSilentTitle}>{t.autoSilent}</Text>
            <Text style={styles.autoSilentDesc}>{t.autoSilentDesc}</Text>
          </View>
          <Switch
            value={Object.values(silentSettings).some(s => s.enabled)}
            onValueChange={handleSilentToggle}
            thumbColor={theme.colors.primary}
          />
        </View>
      </View>

      {/* Prayer Cards */}
      <Text style={styles.sectionTitle}>{t.todayPrayers}</Text>
      <View>
        {Object.keys(silentSettings).map((prayerKey) => {
          const prayerLabel = t[prayerKey];
          const silentStatus = getSilentStatus(prayerKey);
          return (
            <PrayerCard
              key={prayerKey}
              prayerName={prayerKey}
              displayName={prayerLabel}
              time={prayerTimes ? formatPrayerTime(prayerTimes[prayerKey]) : '--:--'}
              silentStatus={silentStatus}
              silentEnabled={silentSettings[prayerKey].enabled}
              silentRange={silentSettings[prayerKey].enabled ? `${formatSilentTime(prayerTimes?.[prayerKey] - silentSettings[prayerKey].offsetBefore * 60000)} - ${formatSilentTime(prayerTimes?.[prayerKey] + silentSettings[prayerKey].duration * 60000)}` : null}
              onToggleSilent={(enabled) => handleSilentToggle(prayerKey, enabled)}
            />
          );
        })}
      </View>
    </ScrollView>
  );
};

function formatSilentTime(date) {
  if (!date) return '';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  container: {
    padding: 16,
    paddingBottom: 80,
  },
  headerCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    padding: 24,
    ...theme.shadows.card,
    marginBottom: 16,
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    color: theme.colors.goldLight,
    fontSize: 14,
    fontWeight: '600',
  },
  currentStatus: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  nextPrayerText: {
    fontSize: 16,
    color: theme.colors.goldLight,
    marginTop: 4,
  },
  autoSilentCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.card,
    marginBottom: 20,
  },
  autoSilentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autoSilentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  autoSilentDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    maxWidth: 180,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
});
