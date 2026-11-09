import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Notice } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { useT } from '../hooks/useT';
import { getQiblaDirection, toLocalDigits } from '../services/prayerService';
import { theme } from '../constants/theme';

const c = theme.colors;

export default function QiblaScreen() {
  const { t, lang } = useT();
  const location = useAppStore((s) => s.location);
  const qibla = getQiblaDirection(location);
  const [heading, setHeading] = useState(null);
  const [accuracy, setAccuracy] = useState(3);

  useEffect(() => {
    let sub;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      sub = await Location.watchHeadingAsync((h) => {
        setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading);
        setAccuracy(h.accuracy);
      });
    })().catch(() => {});
    return () => sub?.remove();
  }, []);

  const rotation = heading == null || qibla == null ? 0 : qibla - heading;
  const diff = Math.abs((((rotation % 360) + 540) % 360) - 180);
  const facing = heading != null && diff < 5;

  return (
    <Screen title={t.qibla} back>
      <Text style={styles.desc}>{t.qiblaDesc}</Text>
      <View style={styles.wrap}>
        <View style={[styles.dial, facing && { borderColor: c.success }]}>
          <View style={{ transform: [{ rotate: `${-(heading || 0)}deg` }], position: 'absolute', inset: 0, alignItems: 'center' }}>
            <Text style={styles.north}>N</Text>
          </View>
          <View style={{ transform: [{ rotate: `${rotation}deg` }], alignItems: 'center' }}>
            <Ionicons name="navigate" size={120} color={facing ? c.success : c.primary} style={{ transform: [{ rotate: '-45deg' }] }} />
          </View>
        </View>
      </View>
      <Text style={styles.deg}>
        {toLocalDigits(Math.round(qibla ?? 0), lang)}° {heading == null ? '' : `· ${toLocalDigits(Math.round(heading), lang)}°`}
      </Text>
      {facing ? <Text style={styles.facing}>{t.qiblaFacing} ✓</Text> : null}
      {accuracy < 2 ? <Notice text="Compass accuracy low — move the phone in a figure-8." /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  desc: { textAlign: 'center', color: c.textSecondary, marginBottom: 20 },
  wrap: { alignItems: 'center', marginVertical: 10 },
  dial: { width: 280, height: 280, borderRadius: 140, borderWidth: 6, borderColor: c.gold, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...theme.shadows.card },
  north: { marginTop: 8, fontWeight: '800', color: c.danger, fontSize: 18 },
  deg: { textAlign: 'center', fontSize: 20, fontWeight: '700', color: c.textPrimary, marginTop: 20 },
  facing: { textAlign: 'center', fontSize: 16, color: c.success, fontWeight: '700', marginTop: 8 },
});
