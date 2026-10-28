import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { translations } from '../../constants/translations';
import { theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { detectUserLocationAndLanguage } from '../../services/locationService';

export default function SettingsScreen() {
  const language = useAppStore((state) => state.language);
  const location = useAppStore((state) => state.location);
  const setLocation = useAppStore((state) => state.setLocation);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const t = translations[language];

  const [refreshingLocation, setRefreshingLocation] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleRefreshLocation = async () => {
    setRefreshingLocation(true);
    const result = await detectUserLocationAndLanguage();
    if (result.success) {
      setLocation({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        city: result.address.city,
        country: result.address.country,
        countryCode: result.address.countryCode,
      });
      Alert.alert('Location Updated', `Detected ${result.address.city}, ${result.address.country}`);
    } else {
      Alert.alert('Location Error', result.error || 'Could not update location');
    }
    setRefreshingLocation(false);
  };

  const toggleLanguage = async () => {
    const newLang = language === 'bn' ? 'en' : 'bn';
    await setLanguage(newLang);
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure? This will reset all silent mode settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.settings}</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.profileCard}>
        <Ionicons name="person-circle-outline" size={48} color={theme.colors.primary} style={{ marginRight: 16 }} />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Muslim Brother</Text>
          <Text style={styles.profileLocation}>
            <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
            {location.city}, {location.country}
          </Text>
        </View>
      </View>

      {/* Settings Sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language &amp; Region</Text>
        <View style={styles.settingsList}>
          <TouchableOpacity style={styles.settingRow} onPress={toggleLanguage}>
            <View style={styles.settingLeft}>
              <Ionicons name="language-outline" size={22} color={theme.colors.primary} />
              <View>
                <Text style={styles.settingLabel}>Language</Text>
                <Text style={styles.settingDesc}>Select your preferred language</Text>
              </View>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>{language === 'bn' ? 'Bengali' : 'English'}</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={handleRefreshLocation} disabled={refreshingLocation}>
            <View style={styles.settingLeft}>
              <Ionicons name="navigate-outline" size={22} color={theme.colors.primary} />
              <View>
                <Text style={styles.settingLabel}>Location</Text>
                <Text style={styles.settingDesc}>Auto-detect location for prayer times</Text>
              </View>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>{refreshingLocation ? 'Detecting...' : location.city}</Text>
              <Ionicons name="refresh-outline" size={20} color={refreshingLocation ? theme.colors.textSecondary : theme.colors.primary} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingsList}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={22} color={theme.colors.primary} />
              <View>
                <Text style={styles.settingLabel}>Silent Mode Notifications</Text>
                <Text style={styles.settingDesc}>Alert before silent mode starts</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              thumbColor={theme.colors.primary}
            />
          </View>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        <View style={styles.settingsList}>
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={22} color={theme.colors.primary} />
              <View>
                <Text style={styles.settingLabel}>Version</Text>
                <Text style={styles.settingDesc}>App version and build number</Text>
              </View>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark-outline" size={22} color={theme.colors.primary} />
              <View>
                <Text style={styles.settingLabel}>Privacy Policy</Text>
                <Text style={styles.settingDesc}>Read our privacy statement</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={handleResetSettings}>
            <View style={styles.settingLeft}>
              <Ionicons name="refresh-circle-outline" size={22} color={theme.colors.danger} />
              <View>
                <Text style={[styles.settingLabel, { color: theme.colors.danger }]}>Reset Settings</Text>
                <Text style={styles.settingDesc}>Reset all app preferences</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Deen App - Islamic Companion</Text>
        <Text style={styles.footerSubtext}>Version 1.0.0 (Made with heart for Muslims)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  profileCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: 16,
    padding: 20,
    ...theme.shadows.card,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  profileLocation: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  settingsList: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: 16,
    ...theme.shadows.card,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  settingDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  settingValue: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  footerSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
});
