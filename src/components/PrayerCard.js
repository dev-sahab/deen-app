import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../store/useAppStore';
import { translations } from '../constants/translations';
import { theme } from '../constants/theme';
import { formatPrayerTime } from '../services/prayerService';

export default function PrayerCard({
  prayerName,
  displayName,
  time,
  silentStatus,
  silentEnabled,
  silentRange,
  onToggleSilent,
}) {
  const language = useAppStore((state) => state.language);
  const silentSettings = useAppStore((state) => state.silentSettings);
  const updateSilentSetting = useAppStore((state) => state.updateSilentSetting);
  const t = translations[language];

  const isSilentActive = silentStatus === 'active';

  const handleToggle = async (enabled) => {
    await updateSilentSetting(prayerName, { enabled });
    if (onToggleSilent) onToggleSilent(enabled);
  };

  const getSilentTimeLabel = () => {
    const setting = silentSettings[prayerName];
    if (!setting?.enabled) return '';
    const silentEnd = setting.duration * 60000; // Duration in minutes
    const silentStart = setting.offsetBefore * 60000;
    const endTime = new Date();
    // For display, we'll use the base time stored; simplified
    return `${formatSilentTimeLabel(silentStart)} - ${formatSilentTimeLabel(silentEnd)}`;
  };

  const formatSilentTimeLabel = (minutes) => {
    const date = new Date(Date.now() + minutes * 60000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getStatusColor = () => {
    if (!silentEnabled) return theme.colors.textSecondary;
    return theme.colors.success;
  };

  const getStatusText = () => {
    if (!silentEnabled) return t.silentInactive;
    return isSilentActive ? t.silentActive : t.silentInactive;
  };

  const getStatusBg = () => {
    if (!silentEnabled) return '#F1F5F9';
    return '#D1FAE5';
  };

  const getStatusTextColor = () => {
    if (!silentEnabled) return theme.colors.textSecondary;
    return theme.colors.success;
  };

  return (
    <TouchableOpacity
      style={[styles.card, isSilentActive && styles.silentCard]}
      onPress={() => {
        // Navigate to silent settings for this prayer
        // This would be handled via router push, simplified here
      }}
    >
      <View style={styles.prayerInfo}>
        <Text style={styles.prayerName}>{displayName}</Text>
        <Text style={styles.prayerTime}>{time}</Text>
      </View>
      <View style={styles.silentInfo}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBg(), borderColor: getStatusColor() }]}>
          <Text style={[styles.statusText, { color: getStatusTextColor() }]}>{getStatusText()}</Text>
        </View>
      </View>
      <Switch
        value={silentEnabled}
        onValueChange={handleToggle}
        thumbColor={theme.colors.primary}
        trackColor={{ false: '#CBD5E1', true: theme.colors.primary }}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.card,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  silentCard: {
    borderWidth: 2,
    borderColor: theme.colors.success,
  },
  prayerInfo: {
    flex: 1,
  },
  prayerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  prayerTime: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: 4,
  },
  silentInfo: {
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
