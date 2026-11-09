import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';

const c = theme.colors;

export function Screen({ title, back, children, scroll = true, right }) {
  const router = useRouter();
  const Body = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {title ? (
        <View style={styles.header}>
          {back ? (
            <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={{ marginRight: 8 }}>
              <Ionicons name="arrow-back" size={24} color={c.textPrimary} />
            </TouchableOpacity>
          ) : null}
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          {right}
        </View>
      ) : null}
      <Body
        style={{ flex: 1 }}
        contentContainerStyle={scroll ? styles.content : undefined}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </Body>
    </SafeAreaView>
  );
}

export const Card = ({ children, style }) => <View style={[styles.card, style]}>{children}</View>;

export const SectionTitle = ({ children }) => <Text style={styles.sectionTitle}>{children}</Text>;

export function Row({ icon, title, subtitle, right, onPress, danger }) {
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {icon ? (
        <View style={[styles.rowIcon, danger && { backgroundColor: '#FDECEC' }]}>
          <Ionicons name={icon} size={20} color={danger ? c.danger : c.primary} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      {right !== undefined ? right : onPress ? <Ionicons name="chevron-forward" size={18} color={c.textSecondary} /> : null}
    </Wrap>
  );
}

export const Toggle = ({ value, onValueChange, disabled }) => (
  <Switch
    value={!!value}
    onValueChange={onValueChange}
    disabled={disabled}
    trackColor={{ true: c.primaryLight, false: '#CBD5E1' }}
    thumbColor={value ? c.primary : '#F1F5F9'}
  />
);

export function Button({ title, onPress, variant = 'primary', icon, small, disabled }) {
  const outline = variant === 'outline';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, outline && styles.btnOutline, small && styles.btnSmall, disabled && { opacity: 0.5 }]}
    >
      {icon ? <Ionicons name={icon} size={small ? 16 : 18} color={outline ? c.primary : '#fff'} style={{ marginRight: 6 }} /> : null}
      <Text style={[styles.btnText, outline && { color: c.primary }, small && { fontSize: 13 }]}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Notice({ text, action, onPress, tone = 'warning' }) {
  const color = tone === 'warning' ? c.warning : tone === 'danger' ? c.danger : c.primaryLight;
  return (
    <View style={[styles.notice, { borderLeftColor: color }]}>
      <Ionicons name={tone === 'info' ? 'information-circle' : 'alert-circle'} size={20} color={color} />
      <Text style={styles.noticeText}>{text}</Text>
      {action ? <Button title={action} onPress={onPress} small /> : null}
    </View>
  );
}

export function Stepper({ value, onChange, min = 0, max = 120, step = 1 }) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity onPress={() => onChange(Math.max(min, value - step))} style={styles.stepBtn} hitSlop={6}>
        <Ionicons name="remove" size={18} color={c.primary} />
      </TouchableOpacity>
      <Text style={styles.stepValue}>{value}</Text>
      <TouchableOpacity onPress={() => onChange(Math.min(max, value + step))} style={styles.stepBtn} hitSlop={6}>
        <Ionicons name="add" size={18} color={c.primary} />
      </TouchableOpacity>
    </View>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <View style={styles.segment}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.value}
          onPress={() => onChange(o.value)}
          style={[styles.segItem, value === o.value && styles.segActive]}
        >
          <Text style={[styles.segText, value === o.value && { color: '#fff' }]}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function Loading({ text }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={c.primary} />
      {text ? <Text style={[styles.rowSub, { marginTop: 12 }]}>{text}</Text> : null}
    </View>
  );
}

export function ErrorView({ text, onRetry, retryLabel }) {
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={40} color={c.textSecondary} />
      <Text style={[styles.rowSub, { textAlign: 'center', marginVertical: 12 }]}>{text}</Text>
      {onRetry ? <Button title={retryLabel || 'Retry'} onPress={onRetry} small /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: c.background,
  },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '700', color: c.textPrimary },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: c.cardBg, borderRadius: 16, padding: 16, marginBottom: 14, ...theme.shadows.card },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: c.textSecondary, marginTop: 6, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '600', color: c.textPrimary },
  rowSub: { fontSize: 13, color: c.textSecondary, marginTop: 2, lineHeight: 18 },
  btn: { backgroundColor: c.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: c.primary },
  btnSmall: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFBEB', borderLeftWidth: 4, borderRadius: 10, padding: 12, marginBottom: 12 },
  noticeText: { flex: 1, fontSize: 13, color: c.textPrimary, lineHeight: 18 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  stepValue: { minWidth: 28, textAlign: 'center', fontWeight: '700', fontSize: 15, color: c.textPrimary },
  segment: { flexDirection: 'row', backgroundColor: '#EEF2F6', borderRadius: 10, padding: 3 },
  segItem: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segActive: { backgroundColor: c.primary },
  segText: { fontWeight: '600', color: c.textPrimary, fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
