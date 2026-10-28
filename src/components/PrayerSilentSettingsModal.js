import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Switch, Alert, Keyboard } from 'react-native';
import { translations } from '../constants/translations';
import { theme } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';

export function PrayerSilentSettingsModal({ visible, onClose, prayerName, initialSettings, onSave }) {
  const language = useAppStore((state) => state.language);
  const t = translations[language];

  const [enabled, setEnabled] = useState(initialSettings?.enabled || true);
  const [offsetBefore, setOffsetBefore] = useState(String(initialSettings?.offsetBefore || 5));
  const [duration, setDuration] = useState(String(initialSettings?.duration || 20));
  const [customJamaatTime, setCustomJamaatTime] = useState(initialSettings?.customJamaatTime || '');

  const handleSave = () => {
    const offsetNum = parseInt(offsetBefore, 10);
    const durationNum = parseInt(duration, 10);

    if (isNaN(offsetNum) || offsetNum < 0 || offsetNum > 60) {
      Alert.alert('Invalid offset', 'Please enter a number between 0 and 60 minutes before prayer.');
      return;
    }

    if (isNaN(durationNum) || durationNum < 1 || durationNum > 120) {
      Alert.alert('Invalid duration', 'Please enter a number between 1 and 120 minutes for silent duration.');
      return;
    }

    const settings = {
      enabled,
      offsetBefore: offsetNum,
      duration: durationNum,
      customJamaatTime: customJamaatTime || null,
    };

    onSave(prayerName, settings);
    Keyboard.dismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{prayerName} - {t.customSilentWindow}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Enable Toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{t.autoSilent} {t.enableAllSilent}</Text>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              thumbColor={theme.colors.primary}
              trackColor={{ false: '#CBD5E1', true: theme.colors.primary }}
            />
          </View>

          {enabled && (
            <>
              {/* Time Range Inputs */}
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>{t.minutesBefore}</Text>
                <TextInput
                  style={styles.input}
                  value={offsetBefore}
                  onChangeText={setOffsetBefore}
                  keyboardType="numeric"
                  placeholder="5"
                  placeholderTextColor="#94A3B8"
                />
                <Text style={styles.inputUnit}>{t.minutes}</Text>
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>{t.duration}</Text>
                <TextInput
                  style={styles.input}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                  placeholder="20"
                  placeholderTextColor="#94A3B8"
                />
                <Text style={styles.inputUnit}>{t.minutes}</Text>
              </View>

              {/* Optional Custom Jamaat Time */}
              <View style={styles.customJamaat}>
                <Text style={styles.inputLabel}>Custom Jamaat Time (Optional)</Text>
                <TextInput
                  style={styles.jamaatInput}
                  value={customJamaatTime}
                  onChangeText={setCustomJamaatTime}
                  placeholder="e.g. 4:15 PM"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Summary */}
              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Silent Time Range</Text>
                <Text style={styles.summaryText}>
                  Your phone will go silent {offsetBefore} minutes before prayer and remain silent for {duration} minutes.
                </Text>
                <Text style={styles.summaryExample}>
                  Example: If prayer is 4:00 PM, silent will be from 3:{60 - parseInt(offsetBefore)} PM to 4:{duration} PM
                </Text>
              </View>
            </>
          )}

          {/* Actions */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    width: 60,
    textAlign: 'center',
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  inputUnit: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    width: 60,
  },
  customJamaat: {
    marginTop: 20,
    marginBottom: 20,
  },
  jamaatInput: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginTop: 8,
  },
  summaryBox: {
    backgroundColor: theme.colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  summaryExample: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
