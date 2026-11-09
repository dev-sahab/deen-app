import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Loading } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { useT } from '../hooks/useT';
import * as DeenGuard from '../../modules/deen-guard';
import { theme } from '../constants/theme';

const c = theme.colors;

export default function BlockedApps() {
  const { t } = useT();
  const blocked = useAppStore((s) => s.guard.blockedApps);
  const setGuard = useAppStore((s) => s.setGuard);
  const [apps, setApps] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    DeenGuard.getInstalledApps().then(setApps);
  }, []);

  const list = useMemo(() => {
    if (!apps) return [];
    const s = q.trim().toLowerCase();
    const filtered = s ? apps.filter((a) => a.label.toLowerCase().includes(s) || a.packageName.includes(s)) : apps;
    // Blocked apps first
    return [...filtered].sort((a, b) => blocked.includes(b.packageName) - blocked.includes(a.packageName));
  }, [apps, q, blocked]);

  const toggle = (pkg) =>
    setGuard({ blockedApps: blocked.includes(pkg) ? blocked.filter((p) => p !== pkg) : [...blocked, pkg] });

  return (
    <Screen title={t.blockedApps} back scroll={false}>
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={c.textSecondary} />
        <TextInput value={q} onChangeText={setQ} placeholder={t.searchApps} style={styles.input} placeholderTextColor={c.textSecondary} />
      </View>
      {!apps ? (
        <Loading />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(a) => a.packageName}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          renderItem={({ item }) => {
            const on = blocked.includes(item.packageName);
            return (
              <TouchableOpacity style={styles.row} onPress={() => toggle(item.packageName)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{item.label}</Text>
                  <Text style={styles.pkg}>{item.packageName}</Text>
                </View>
                <Ionicons name={on ? 'ban' : 'ellipse-outline'} size={22} color={on ? c.danger : c.textSecondary} />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', margin: 16, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: c.border },
  input: { flex: 1, paddingVertical: 10, color: c.textPrimary },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8 },
  label: { fontSize: 15, fontWeight: '600', color: c.textPrimary },
  pkg: { fontSize: 11, color: c.textSecondary, marginTop: 2 },
});
