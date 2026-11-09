import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Alert, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Row, Toggle, Notice, Button, SectionTitle } from '../../components/ui';
import { useAppStore, FILTER_PRESETS } from '../../store/useAppStore';
import { useT } from '../../hooks/useT';
import { toLocalDigits } from '../../services/prayerService';
import { syncContentFilter } from '../../services/syncService';
import * as DeenGuard from '../../../modules/deen-guard';
import { theme } from '../../constants/theme';

const c = theme.colors;

const confirmDisclosure = (title, message, agree, cancel) =>
  new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: cancel, style: 'cancel', onPress: () => resolve(false) },
      { text: agree, onPress: () => resolve(true) },
    ])
  );

export default function GuardScreen() {
  const router = useRouter();
  const { t, lang } = useT();
  const guard = useAppStore((s) => s.guard);
  const setGuard = useAppStore((s) => s.setGuard);
  const support = DeenGuard.getSupport();
  const [status, setStatus] = useState(DeenGuard.getContentFilterStatus());
  const [blockerOn, setBlockerOn] = useState(DeenGuard.isAppBlockerEnabled());
  const [domain, setDomain] = useState('');
  const [pendingStart, setPendingStart] = useState(false);

  const refresh = useCallback(() => {
    setStatus(DeenGuard.getContentFilterStatus());
    setBlockerOn(DeenGuard.isAppBlockerEnabled());
  }, []);

  // Coming back from the VPN consent dialog / accessibility settings.
  useFocusEffect(
    useCallback(() => {
      refresh();
      const id = setInterval(() => {
        if (pendingStart && DeenGuard.isContentFilterPrepared()) {
          setPendingStart(false);
          syncContentFilter();
          DeenGuard.startContentFilter();
        }
        refresh();
      }, 1500);
      return () => clearInterval(id);
    }, [pendingStart])
  );

  const toggleFilter = async (on) => {
    if (!on) {
      DeenGuard.stopContentFilter();
      setTimeout(refresh, 500);
      return;
    }
    const ok = await confirmDisclosure(t.disclosureTitle, t.vpnDisclosure, t.agree, t.cancel);
    if (!ok) return;
    syncContentFilter();
    if (DeenGuard.prepareContentFilter()) {
      DeenGuard.startContentFilter();
      setTimeout(refresh, 800);
    } else {
      setPendingStart(true); // system consent dialog is showing
    }
  };

  const openBlockerSettings = async () => {
    const ok = await confirmDisclosure(t.disclosureTitle, t.accessibilityDisclosure, t.agree, t.cancel);
    if (ok) DeenGuard.openAccessibilitySettings();
  };

  const addDomain = () => {
    const d = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d)) return;
    if (!guard.customDomains.includes(d)) setGuard({ customDomains: [...guard.customDomains, d] });
    setDomain('');
  };

  if (!support.contentFilter) {
    return (
      <Screen title={t.guardTitle}>
        <Card>
          <Text style={styles.desc}>{t.guardDesc}</Text>
        </Card>
        <Notice tone="info" text={Platform.OS === 'ios' ? t.iosGuardNote : `${t.notSupported}. ${t.devBuildNote}`} />
      </Screen>
    );
  }

  return (
    <Screen title={t.guardTitle}>
      <Card style={styles.hero}>
        <Ionicons name={status.running ? 'shield-checkmark' : 'shield-outline'} size={48} color={status.running ? c.gold : '#fff'} />
        <Text style={styles.heroTitle}>{status.running ? t.filterOn : t.filterOff}</Text>
        <Text style={styles.heroSub}>
          {t.blockedSoFar}: {toLocalDigits(status.blockedCount || 0, lang)}
        </Text>
      </Card>

      <Card>
        <Row
          icon="globe-outline"
          title={t.contentFilter}
          subtitle={t.contentFilterDesc}
          right={<Toggle value={status.running} onValueChange={toggleFilter} />}
        />
        {status.running ? <Notice tone="info" text={t.alwaysOn} action={t.openVpnSettings} onPress={DeenGuard.openVpnSettings} /> : null}
      </Card>

      <SectionTitle>{t.filterProvider}</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        {Object.entries(FILTER_PRESETS).map(([key, p]) => (
          <Row
            key={key}
            title={p.label}
            subtitle={p.servers.join(' · ')}
            onPress={() => setGuard({ filterPreset: key })}
            right={<Ionicons name={guard.filterPreset === key ? 'radio-button-on' : 'radio-button-off'} size={22} color={c.primary} />}
          />
        ))}
      </Card>

      <SectionTitle>{t.customDomains}</SectionTitle>
      <Card>
        <View style={styles.addRow}>
          <TextInput
            value={domain}
            onChangeText={setDomain}
            placeholder={t.addDomain}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            onSubmitEditing={addDomain}
            style={styles.input}
            placeholderTextColor={c.textSecondary}
          />
          <Button title="+" onPress={addDomain} small />
        </View>
        {guard.customDomains.map((d) => (
          <View key={d} style={styles.chip}>
            <Text style={styles.chipText}>{d}</Text>
            <TouchableOpacity onPress={() => setGuard({ customDomains: guard.customDomains.filter((x) => x !== d) })} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={c.textSecondary} />
            </TouchableOpacity>
          </View>
        ))}
      </Card>

      <SectionTitle>{t.appBlocker}</SectionTitle>
      <Card>
        <Row icon="apps-outline" title={t.appBlocker} subtitle={t.appBlockerDesc} right={<Toggle value={blockerOn} onValueChange={openBlockerSettings} />} />
        {!blockerOn ? <Notice text={t.enableAccessibility} action={t.grant} onPress={openBlockerSettings} /> : null}
        <Row
          icon="ban-outline"
          title={t.chooseApps}
          subtitle={`${t.blockedApps}: ${toLocalDigits(guard.blockedApps.length, lang)}`}
          onPress={() => router.push('/blocked-apps')}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  desc: { fontSize: 14, color: c.textSecondary, lineHeight: 20 },
  hero: { backgroundColor: c.primary, alignItems: 'center', paddingVertical: 22 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 8 },
  heroSub: { color: c.goldLight, marginTop: 4 },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, color: c.textPrimary },
  chip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.border },
  chipText: { color: c.textPrimary },
});
