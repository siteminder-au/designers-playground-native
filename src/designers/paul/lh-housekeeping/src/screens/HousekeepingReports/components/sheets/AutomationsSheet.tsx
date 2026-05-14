import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, PanResponder, ScrollView, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import styles from '../../styles';

export function AutomationsSheet({
  visible,
  onClose,
  sheetAnim,
  translateY,
  panResponder,
  deepCleanDays,
  setDeepCleanDays,
  nightlyResetOccupied,
  setNightlyResetOccupied,
  resetAfterCheckout,
  setResetAfterCheckout,
  resetAfterClosure,
  setResetAfterClosure,
  insetsBottom,
}: {
  visible: boolean;
  onClose: () => void;
  sheetAnim: Animated.Value;
  translateY: Animated.Value;
  panResponder: ReturnType<typeof PanResponder.create>;
  deepCleanDays: string;
  setDeepCleanDays: React.Dispatch<React.SetStateAction<string>>;
  nightlyResetOccupied: boolean;
  setNightlyResetOccupied: React.Dispatch<React.SetStateAction<boolean>>;
  resetAfterCheckout: boolean;
  setResetAfterCheckout: React.Dispatch<React.SetStateAction<boolean>>;
  resetAfterClosure: boolean;
  setResetAfterClosure: React.Dispatch<React.SetStateAction<boolean>>;
  insetsBottom: number;
}) {
  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View style={[styles.sortSheetOverlay, { opacity: sheetAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sortSheet, { paddingBottom: 0, transform: [{ translateY }] }]}>
          <View style={styles.sheetHandleArea} {...panResponder.panHandlers}><View style={styles.sortSheetHandle} /></View>
          <View style={styles.sortSheetHeader}>
            <Text style={styles.sortSheetTitle}>Automations</Text>
            <TouchableOpacity onPress={() => { setDeepCleanDays('3'); setNightlyResetOccupied(false); setResetAfterCheckout(true); setResetAfterClosure(true); }}>
              <Text style={styles.sortResetText}>Reset</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            <Text style={styles.autoSheetSubtitle}>Rules that run on page load to keep cleaning statuses up to date.</Text>

            {/* Deep clean section */}
            <View style={styles.autoSection}>
              <Text style={styles.autoSectionTitle}>Deep clean after N days of occupancy</Text>
              <Text style={styles.autoSectionDesc}>Flags rooms occupied for N or more consecutive days as Need Deep Cleaning.</Text>
              <View style={styles.autoInputRow}>
                <TextInput
                  style={styles.autoInput}
                  value={deepCleanDays}
                  onChangeText={setDeepCleanDays}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.autoInputSuffix}>days</Text>
              </View>
            </View>

            <View style={styles.autoSeparator} />

            {/* Checkbox rows */}
            {([
              { key: 'nightlyResetOccupied',  label: 'Nightly reset for occupied rooms',         desc: 'Resets all occupied rooms to Need Cleaning each day.',                            value: nightlyResetOccupied, set: setNightlyResetOccupied },
              { key: 'resetAfterCheckout',    label: 'Reset to Need Cleaning after check-out',   desc: 'Sets departing rooms to Need Cleaning on check-out day.',                        value: resetAfterCheckout,   set: setResetAfterCheckout },
              { key: 'resetAfterClosure',     label: 'Reset to Need Cleaning after room closure ends', desc: 'Clears rooms returning from maintenance or renovation closures.',           value: resetAfterClosure,    set: setResetAfterClosure },
            ] as const).map(({ key, label, desc, value, set }) => (
              <TouchableOpacity key={key} style={styles.autoCheckRow} onPress={() => (set as (v: boolean) => void)(!value)} activeOpacity={0.7}>
                <MaterialIcons
                  name={value ? 'check-box' : 'check-box-outline-blank'}
                  size={22}
                  color={value ? '#e8722a' : '#9ca3af'}
                  style={{ marginTop: 1 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.autoCheckLabel}>{label}</Text>
                  <Text style={styles.autoCheckDesc}>{desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Done button */}
          <View style={[styles.autoFooter, { paddingBottom: insetsBottom + 16 }]}>
            <TouchableOpacity style={styles.autoDoneBtn} onPress={onClose}>
              <Text style={styles.autoDoneBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
