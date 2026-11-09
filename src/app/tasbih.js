import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Screen, Button, Segmented } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { useT } from '../hooks/useT';
import { toLocalDigits } from '../services/prayerService';
import { theme } from '../constants/theme';

const c = theme.colors;
const DHIKR = ['سُبْحَانَ ٱللَّٰهِ', 'ٱلْحَمْدُ لِلَّٰهِ', 'ٱللَّٰهُ أَكْبَرُ', 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ'];

export default function Tasbih() {
  const { t, lang } = useT();
  const { count, target, total, dhikr = 0 } = useAppStore((s) => s.tasbih);
  const setTasbih = useAppStore((s) => s.setTasbih);

  const tap = () => {
    const next = count + 1;
    if (target && next % target === 0) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    else Haptics.selectionAsync().catch(() => {});
    setTasbih({ count: next, total: total + 1 });
  };

  return (
    <Screen title={t.tasbih} back scroll={false}>
      <View style={{ padding: 16, flex: 1 }}>
        <Text style={styles.dhikr} onPress={() => setTasbih({ dhikr: (dhikr + 1) % DHIKR.length })}>{DHIKR[dhikr]}</Text>
        <Segmented
          value={target}
          onChange={(v) => setTasbih({ target: v })}
          options={[33, 100, 0].map((v) => ({ value: v, label: v ? toLocalDigits(v, lang) : '∞' }))}
        />
        <Pressable onPress={tap} style={({ pressed }) => [styles.circle, pressed && { transform: [{ scale: 0.97 }] }]}>
          <Text style={styles.count}>{toLocalDigits(count, lang)}</Text>
          {target ? <Text style={styles.sub}>{toLocalDigits(count % target, lang)} / {toLocalDigits(target, lang)}</Text> : null}
          <Text style={styles.sub}>{t.tap}</Text>
        </Pressable>
        <Text style={styles.total}>{t.total}: {toLocalDigits(total, lang)}</Text>
        <Button title={t.reset} variant="outline" icon="refresh" onPress={() => setTasbih({ count: 0 })} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dhikr: { fontSize: 34, textAlign: 'center', color: c.primary, marginVertical: 14 },
  circle: { alignSelf: 'center', marginVertical: 28, width: 240, height: 240, borderRadius: 120, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 6, borderColor: c.gold, ...theme.shadows.activeCard },
  count: { fontSize: 64, fontWeight: '800', color: '#fff' },
  sub: { color: c.goldLight, fontSize: 14, marginTop: 2 },
  total: { textAlign: 'center', color: c.textSecondary, marginBottom: 14 },
});
