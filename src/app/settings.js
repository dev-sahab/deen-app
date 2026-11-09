import React, { useState } from 'react';
import { Text, Alert, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Row, Toggle, Segmented, Stepper, SectionTitle } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { useT } from '../hooks/useT';
import { CALC_METHODS, PRAYERS } from '../services/prayerService';
import { ARABIC_EDITIONS } from '../services/contentService';
import { detectLocation } from '../services/locationService';
import { requestNotificationPermission } from '../services/syncService';
import { theme } from '../constants/theme';

const c = theme.colors;

export default function Settings() {
  const { t, lang } = useT();
  const s = useAppStore();
  const [locating, setLocating] = useState(false);
  const [showMethods, setShowMethods] = useState(false);

  const updateLocation = async () => {
    setLocating(true);
    const res = await detectLocation();
    setLocating(false);
    if (res.success) {
      s.setLocation(res.location);
      Alert.alert(t.locationUpdated, `${res.location.city}, ${res.location.country}`);
    } else {
      Alert.alert(t.location, t.locationFailed);
    }
  };

  const toggleAthan = async (on) => {
    if (on && !(await requestNotificationPermission())) return;
    s.setAthan({ enabled: on });
  };

  return (
    <Screen title={t.settings} back>
      <SectionTitle>{t.language}</SectionTitle>
      <Card>
        <Segmented value={lang} onChange={s.setLanguage} options={[{ value: 'bn', label: 'বাংলা' }, { value: 'en', label: 'English' }]} />
      </Card>

      <SectionTitle>{t.location}</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <Row
          icon="location-outline"
          title={`${s.location.city}${s.location.country ? `, ${s.location.country}` : ''}`}
          subtitle={`${s.location.latitude.toFixed(4)}, ${s.location.longitude.toFixed(4)}`}
          onPress={updateLocation}
          right={<Ionicons name={locating ? 'hourglass-outline' : 'refresh'} size={20} color={c.primary} />}
        />
      </Card>

      <SectionTitle>{t.athan}</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <Row icon="notifications-outline" title={t.athan} right={<Toggle value={s.athan.enabled} onValueChange={toggleAthan} />} />
        {s.athan.enabled
          ? PRAYERS.map((k) => (
              <Row key={k} title={t[k]} right={<Toggle value={s.athan.prayers[k]} onValueChange={(v) => s.setAthanPrayer(k, v)} />} />
            ))
          : null}
        {s.athan.enabled ? (
          <Row
            title={t.reminderBefore}
            subtitle={s.athan.reminderMinutes ? `${s.athan.reminderMinutes} min` : t.off}
            right={<Stepper value={s.athan.reminderMinutes} min={0} max={30} step={5} onChange={(v) => s.setAthan({ reminderMinutes: v })} />}
          />
        ) : null}
      </Card>

      <SectionTitle>{t.calcMethod}</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <Row title={t.calcMethod} subtitle={CALC_METHODS[s.calc.method]} onPress={() => setShowMethods(!showMethods)} />
        {showMethods
          ? Object.entries(CALC_METHODS).map(([key, label]) => (
              <Row
                key={key}
                title={label}
                onPress={() => { s.setCalc({ method: key }); setShowMethods(false); }}
                right={<Ionicons name={s.calc.method === key ? 'radio-button-on' : 'radio-button-off'} size={20} color={c.primary} />}
              />
            ))
          : null}
        <Text style={styles.label}>{t.madhab}</Text>
        <Segmented value={s.calc.madhab} onChange={(madhab) => s.setCalc({ madhab })} options={[{ value: 'hanafi', label: t.hanafi }, { value: 'shafi', label: t.shafi }]} />
        <View style={styles.line}>
          <Text style={styles.label}>{t.hijriAdjust}</Text>
          <Stepper value={s.calc.hijriOffset} min={-2} max={2} onChange={(v) => s.setCalc({ hijriOffset: v })} />
        </View>
      </Card>

      <SectionTitle>{t.quran}</SectionTitle>
      <Card>
        <Text style={[styles.label, { marginTop: 0 }]}>{t.arabicScript}</Text>
        <Segmented
          value={s.quran.arabicEdition}
          onChange={(arabicEdition) => s.setQuran({ arabicEdition })}
          options={Object.entries(ARABIC_EDITIONS).map(([value, label]) => ({ value, label }))}
        />
        <Row title={t.showTranslation} right={<Toggle value={s.quran.showTranslation} onValueChange={(v) => s.setQuran({ showTranslation: v })} />} />
      </Card>

      <Text style={styles.about}>{t.about}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, color: c.textSecondary, marginTop: 10, marginBottom: 6 },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  about: { textAlign: 'center', color: c.textSecondary, fontSize: 12, marginTop: 10 },
});
