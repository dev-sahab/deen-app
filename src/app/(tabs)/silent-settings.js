import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../constants/translations';
import { theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getPrayerTimesForLocation } from '../../services/prayerService';
import { PrayerSilentSettingsModal } from '../../components/PrayerSilentSettingsModal';

export default function SilentSettingsScreen() {
  const router = useRouter();
  const language = useAppStore((state) => state.language);
  const location = useAppStore((state) => state.location);
  const silentSettings = useAppStore((state) => state.silentSettings);
  const updateSilentSetting = useAppStore((state) => state.updateSilentSetting);
  const toggleAllSilent = useAppStore((state) => state.toggleAllSilent);
  const t = translations[language];

  const [prayerTimes, setPrayerTimes] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState(null);

  useEffect(() => {
    loadPrayerTimes();
  }, [location]);

  const loadPrayerTimes = async () => {
    const times = await getPrayerTimesForLocation(location.latitude, location.longitude);
    setPrayerTimes(times);
  };

  const openModal = (prayerName) => {
    setSelectedPrayer(prayerName);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPrayer(null);
  };

  const handleUpdateSilentSetting = async (prayer, settings) => {
    await updateSilentSetting(prayer, settings);
    closeModal();
  };

  const allEnabled = Object.values(silentSettings).every((s) => s.enabled);

  const prayerCards = Object.keys(silentSettings).map((prayerKey) => {
    const setting = silentSettings[prayerKey];
    const prayerTime = prayerTimes?.[prayerKey];
    const startTime = prayerTime ? new Date(prayerTime.getTime() - setting.offsetBefore * 60000) : null;
    const endTime = prayerTime ? new Date(prayerTime.getTime() + setting.duration * 60000) : null;
    const formatRange = (time) => time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--';

    return {
      key: prayerKey,
      name: t[prayerKey],
      enabled: setting.enabled,
      range: `${formatRange(startTime)} - ${formatRange(endTime)}`,
      offsetBefore: setting.offsetBefore,
      duration: setting.duration,
    };
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.autoSilent}</Text>
      </View>

      {/* Enable All Switch */}
      <View style={styles.enableAllCard}>
        <View>
          <Text style={styles.enableAllTitle}>{t.enableAllSilent}</Text>
          <Text style={styles.enableAllDesc}>
            {allEnabled ? t.silentActive : t.silentInactive}
          </Text>
        </View>
        <Switch
          value={allEnabled}
          onValueChange={(val) => toggleAllSilent(val)}
          thumbColor={theme.colors.primary}
          trackColor={{ false: '#CBD5E1', true: theme.colors.primary }}
        />
      </View>

      {/* Per-Prayer Silent Settings */}
      <Text style={styles.sectionTitle}>{t.customSilentWindow}</Text>
      <View style={styles.prayerSettingsContainer}>
        {prayerCards.map((prayer) => (
          <View key={prayer.key} style={styles.prayerSettingRow}>
            <View style={styles.prayerSettingInfo}>
              <Text style={styles.prayerSettingName}>{prayer.name}</Text>
              <Text style={styles.prayerSettingRange}>{prayer.range}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={styles.prayerDuration}>সময়কাল {prayer.duration} মিনি, আগে {prayer.offsetBefore} মিনি</Text>
              <TouchableOpacity onPress={() => openModal(prayer.key)} style={styles.editButton}>
                <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Silent Settings Modal */}
      <PrayerSilentSettingsModal
        visible={modalVisible}
        onClose={closeModal}
        prayerName={selectedPrayer ? t[selectedPrayer] : ''}
        initialSettings={selectedPrayer ? silentSettings[selectedPrayer] : null}
        onSave={handleUpdateSilentSetting}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  enableAllCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: 16,
    padding: 20,
    ...theme.shadows.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  enableAllTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  enableAllDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  prayerSettingsContainer: {
    gap: 12,
  },
  prayerSettingRow: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayerSettingInfo: {
    flex: 1,
  },
  prayerSettingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  prayerSettingRange: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  prayerDuration: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  editButton: {
    padding: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
  },
});
