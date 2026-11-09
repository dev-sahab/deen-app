import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen, Card, Row, Toggle, Notice, Stepper, Segmented, SectionTitle } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { useT } from '../hooks/useT';
import { formatTime, getPrayerTimes, parseClock, PRAYERS } from '../services/prayerService';
import * as DeenGuard from '../../modules/deen-guard';
import { theme } from '../constants/theme';

const c = theme.colors;

function readPermissions() {
  return {
    dnd: DeenGuard.hasDndAccess(),
    exact: DeenGuard.canScheduleExactAlarms(),
    battery: DeenGuard.isIgnoringBatteryOptimizations(),
  };
}

function PrayerConfig({ id, cfg, baseTime, t, lang, onChange }) {
  const [jamaat, setJamaat] = useState(cfg.jamaatTime || '');
  const anchor = parseClock(cfg.jamaatTime, baseTime || new Date()) || baseTime;
  const range = anchor
    ? `${formatTime(new Date(anchor.getTime() - cfg.before * 60_000), lang)} – ${formatTime(new Date(anchor.getTime() + cfg.after * 60_000), lang)}`
    : '';
  return (
    <Card>
      <Row title={t[id]} subtitle={cfg.enabled ? range : t.off} right={<Toggle value={cfg.enabled} onValueChange={(v) => onChange({ enabled: v })} />} />
      {cfg.enabled ? (
        <>
          <View style={styles.line}>
            <Text style={styles.label}>{t.before}</Text>
            <Stepper value={cfg.before} min={0} max={60} onChange={(v) => onChange({ before: v })} />
          </View>
          <View style={styles.line}>
            <Text style={styles.label}>{t.after}</Text>
            <Stepper value={cfg.after} min={5} max={120} step={5} onChange={(v) => onChange({ after: v })} />
          </View>
          <Text style={[styles.label, { marginTop: 8 }]}>{t.jamaatTime}</Text>
          <TextInput
            value={jamaat}
            onChangeText={setJamaat}
            onEndEditing={() => {
              const v = jamaat.trim();
              if (!v || parseClock(v, new Date())) onChange({ jamaatTime: v });
              else setJamaat(cfg.jamaatTime || '');
            }}
            placeholder={t.jamaatHint}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            style={styles.input}
            placeholderTextColor={c.textSecondary}
          />
        </>
      ) : null}
    </Card>
  );
}

export default function SilentSettings() {
  const { t, lang } = useT();
  const silent = useAppStore((s) => s.silent);
  const location = useAppStore((s) => s.location);
  const calc = useAppStore((s) => s.calc);
  const { setSilent, setSilentPrayer } = useAppStore.getState();
  const support = DeenGuard.getSupport();
  const [perm, setPerm] = useState(readPermissions);
  const times = getPrayerTimes(location, calc, new Date());

  useFocusEffect(
    useCallback(() => {
      setPerm(readPermissions());
      const id = setInterval(() => setPerm(readPermissions()), 2000);
      return () => clearInterval(id);
    }, [])
  );

  if (!support.silent) {
    return (
      <Screen title={t.autoSilent} back>
        <Notice tone="info" text={Platform.OS === 'ios' ? t.iosSilentNote : `${t.notSupported}. ${t.devBuildNote}`} />
      </Screen>
    );
  }

  const toggleMaster = (on) => {
    if (on && !perm.dnd) {
      DeenGuard.openDndSettings();
      return;
    }
    setSilent({ enabled: on });
  };

  return (
    <Screen title={t.autoSilent} back>
      <Card>
        <Row title={t.autoSilent} subtitle={t.autoSilentDesc} right={<Toggle value={silent.enabled && perm.dnd} onValueChange={toggleMaster} />} />
        <Text style={[styles.label, { marginTop: 6, marginBottom: 6 }]}>{t.silentMode}</Text>
        <Segmented
          value={silent.mode}
          onChange={(mode) => setSilent({ mode })}
          options={[
            { value: 'silent', label: t.modeSilent },
            { value: 'vibrate', label: t.modeVibrate },
          ]}
        />
      </Card>

      {!perm.dnd ? <Notice text={t.needDnd} action={t.grant} onPress={DeenGuard.openDndSettings} /> : null}
      {!perm.exact ? <Notice text={t.needExactAlarm} action={t.grant} onPress={DeenGuard.openExactAlarmSettings} /> : null}
      {!perm.battery ? <Notice tone="info" text={t.needBattery} action={t.grant} onPress={DeenGuard.openBatterySettings} /> : null}

      {silent.enabled ? (
        <>
          <SectionTitle>{t.silentScheduled}</SectionTitle>
          {PRAYERS.map((key) => (
            <PrayerConfig
              key={key}
              id={key}
              cfg={silent.prayers[key]}
              baseTime={times?.[key]}
              t={t}
              lang={lang}
              onChange={(patch) => setSilentPrayer(key, patch)}
            />
          ))}
          <PrayerConfig
            id="jumuah"
            cfg={silent.jumuah}
            baseTime={times?.dhuhr}
            t={t}
            lang={lang}
            onChange={(patch) => setSilentPrayer('jumuah', patch)}
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  label: { fontSize: 14, color: c.textSecondary },
  input: { borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 6, color: c.textPrimary },
});
