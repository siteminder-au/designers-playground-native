import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, PanResponder, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from './styles';

export function AutomationsSheet({
  visible,
  onClose,
  deepCleanDays,
  onDeepCleanDaysChange,
  nightlyResetOccupied,
  onNightlyResetChange,
  resetAfterCheckout,
  onResetAfterCheckoutChange,
  resetAfterClosure,
  onResetAfterClosureChange,
}: {
  visible: boolean;
  onClose: () => void;
  deepCleanDays: string;
  onDeepCleanDaysChange: (v: string) => void;
  nightlyResetOccupied: boolean;
  onNightlyResetChange: (v: boolean) => void;
  resetAfterCheckout: boolean;
  onResetAfterCheckoutChange: (v: boolean) => void;
  resetAfterClosure: boolean;
  onResetAfterClosureChange: (v: boolean) => void;
}) {
  const insets = useSafeAreaInsets();
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(500);
      sheetAnim.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }),
        Animated.spring(sheetAnim,  { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 220 }),
      ]).start();
    }
  }, [visible]);

  function close() {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 500, duration: 200, useNativeDriver: true }),
      Animated.timing(sheetAnim,  { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  }

  function reset() {
    onDeepCleanDaysChange('3');
    onNightlyResetChange(false);
    onResetAfterCheckoutChange(true);
    onResetAfterClosureChange(true);
  }

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderMove:   (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
    onPanResponderRelease:(_, g) => {
      if (g.dy > 80) close();
      else Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
    },
  })).current;

  const checkRows = [
    { label: 'Nightly reset for occupied rooms',          desc: 'Resets all occupied rooms to Need Cleaning each day.',               value: nightlyResetOccupied,  set: onNightlyResetChange       },
    { label: 'Reset to Need Cleaning after check-out',    desc: 'Sets departing rooms to Need Cleaning on check-out day.',            value: resetAfterCheckout,    set: onResetAfterCheckoutChange },
    { label: 'Reset to Need Cleaning after room closure ends', desc: 'Clears rooms returning from maintenance or renovation closures.', value: resetAfterClosure,     set: onResetAfterClosureChange  },
  ] as const;

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={close}>
      <Animated.View style={[styles.sortSheetOverlay, { opacity: sheetAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={close} />
        <Animated.View style={[styles.sortSheet, { paddingBottom: 0, transform: [{ translateY }] }]}>
          <View style={styles.sheetHandleArea} {...panResponder.panHandlers}>
            <View style={styles.sortSheetHandle} />
          </View>
          <View style={styles.sortSheetHeader}>
            <Text style={styles.sortSheetTitle}>Automations</Text>
            <TouchableOpacity onPress={reset}>
              <Text style={styles.sortResetText}>Reset</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.autoSheetSubtitle}>Rules that run on page load to keep cleaning statuses up to date.</Text>

          {/* Deep clean section */}
          <View style={styles.autoSection}>
            <Text style={styles.autoSectionTitle}>Deep clean after N days of occupancy</Text>
            <Text style={styles.autoSectionDesc}>Flags rooms occupied for N or more consecutive days as Need Deep Cleaning.</Text>
            <View style={styles.autoInputRow}>
              <TextInput
                style={styles.autoInput}
                value={deepCleanDays}
                onChangeText={onDeepCleanDaysChange}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.autoInputSuffix}>days</Text>
            </View>
          </View>

          <View style={styles.autoSeparator} />

          {checkRows.map(({ label, desc, value, set }) => (
            <TouchableOpacity key={label} style={styles.autoCheckRow} onPress={() => set(!value)} activeOpacity={0.7}>
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

          <View style={[styles.autoFooter, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity style={styles.autoDoneBtn} onPress={close}>
              <Text style={styles.autoDoneBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
