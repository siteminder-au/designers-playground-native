import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, PanResponder, ScrollView, Switch } from 'react-native';
import FLAGS from '../../../../config/featureFlags';
import type { ViewMode } from '../../../../context/HousekeepingStatus';
import { ORANGE } from '../../constants';
import styles from '../../styles';

type FlagsState = typeof FLAGS;

export function DemoFlagsSheet({
  visible,
  onClose,
  sheetAnim,
  translateY,
  panResponder,
  flags,
  setFlags,
  viewMode,
  setViewMode,
  cleaningStatusAsLabel,
  setCleaningStatusAsLabel,
  reviewCaptureFabEnabled,
  setReviewCaptureFabEnabled,
  reviewOverlayEnabled,
  setReviewOverlayEnabled,
  insetsBottom,
}: {
  visible: boolean;
  onClose: () => void;
  sheetAnim: Animated.Value;
  translateY: Animated.Value;
  panResponder: ReturnType<typeof PanResponder.create>;
  flags: FlagsState;
  setFlags: React.Dispatch<React.SetStateAction<FlagsState>>;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  cleaningStatusAsLabel: boolean;
  setCleaningStatusAsLabel: (value: boolean) => void;
  reviewCaptureFabEnabled: boolean;
  setReviewCaptureFabEnabled: (value: boolean) => void;
  reviewOverlayEnabled: boolean;
  setReviewOverlayEnabled: (value: boolean) => void;
  insetsBottom: number;
}) {
  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View style={[styles.sortSheetOverlay, { opacity: sheetAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sortSheet, { transform: [{ translateY }] }]}>
          <View style={styles.sheetHandleArea} {...panResponder.panHandlers}><View style={styles.sortSheetHandle} /></View>
          <View style={styles.sortSheetHeader}>
            <Text style={styles.sortSheetTitle}>Demo flags</Text>
            <TouchableOpacity onPress={() => { setFlags({ ...FLAGS }); setViewMode('full'); setCleaningStatusAsLabel(false); setReviewCaptureFabEnabled(false); setReviewOverlayEnabled(false); }}>
              <Text style={styles.sortResetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: insetsBottom + 16 }}>
            {/* View mode — segmented control (Browser view is a placeholder). */}
            <View style={styles.demoVariantRow}>
              <Text style={[styles.demoFlagLabel, { flex: 0, marginRight: 0 }]}>View</Text>
              <View style={styles.segmentedControl}>
                {([
                  { value: 'full',    label: 'Full access' },
                  { value: 'limited', label: 'Limited' },
                  { value: 'browser', label: 'Browser view' },
                ] as { value: ViewMode; label: string }[]).map(opt => {
                  const isActive = viewMode === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.segmentedBtn, isActive && styles.segmentedBtnActive]}
                      onPress={() => setViewMode(opt.value)}
                    >
                      <Text style={[styles.segmentedBtnText, isActive && styles.segmentedBtnTextActive]} numberOfLines={1}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={styles.dropdownDivider} />
            <View style={[styles.dropdownDivider, { marginBottom: 8 }]} />

            {/* Date selector variant — segmented control (3 options) */}
            <View style={styles.demoVariantRow}>
              <Text style={[styles.demoFlagLabel, { flex: 0, marginRight: 0 }]}>Date picker</Text>
              <View style={styles.segmentedControl}>
                {([
                  { value: 'range',      label: 'Date range sheet' },
                  { value: 'strip',      label: 'Date strip' },
                  { value: 'monthSheet', label: 'Date sheet' },
                ] as { value: typeof FLAGS.dateSelectorVariant; label: string }[]).map(opt => {
                  const isActive = flags.dateSelectorVariant === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.segmentedBtn, isActive && styles.segmentedBtnActive]}
                      onPress={() => setFlags(prev => ({ ...prev, dateSelectorVariant: opt.value }))}
                    >
                      <Text style={[styles.segmentedBtnText, isActive && styles.segmentedBtnTextActive]} numberOfLines={1}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={styles.dropdownDivider} />

            {([
              { key: 'showGuestName',         label: 'Guest name' },
              { key: 'showGuestPax',          label: 'Pax counts' },
              { key: 'showBedConfig',         label: 'Bed configuration' },
              { key: 'showLateCheckout',      label: 'Early check-in & late check-out badge' },
              { key: 'showReservationId',    label: 'Reservation ID' },
              { key: 'showStatusIcon',       label: 'Cleaning status icon' },
              { key: 'roomStatsChips',       label: 'Room stats as tappable chips' },
              { key: 'compactCard',          label: 'Compact room card (details in notes sheet)' },
              { key: 'showPrint',            label: 'Print button' },
              { key: 'showSort',             label: 'Sort control' },
            ] as { key: 'showGuestName' | 'showGuestPax' | 'showBedConfig' | 'showLateCheckout' | 'showReservationId' | 'showStatusIcon' | 'roomStatsChips' | 'compactCard' | 'showPrint' | 'showSort'; label: string }[]).map((item, i) => (
              <React.Fragment key={item.key}>
                {i > 0 && <View style={styles.dropdownDivider} />}
                <View style={styles.demoFlagRow}>
                  <Text style={styles.demoFlagLabel}>{item.label}</Text>
                  <Switch
                    value={flags[item.key] as boolean}
                    onValueChange={val => setFlags(prev => ({ ...prev, [item.key]: val }))}
                    trackColor={{ false: '#e5e7eb', true: ORANGE }}
                    thumbColor="#fff"
                  />
                </View>
              </React.Fragment>
            ))}
            <View style={styles.dropdownDivider} />
            <View style={styles.demoFlagRow}>
              <Text style={styles.demoFlagLabel}>Cleaning status as text label</Text>
              <Switch
                value={cleaningStatusAsLabel}
                onValueChange={setCleaningStatusAsLabel}
                trackColor={{ false: '#e5e7eb', true: ORANGE }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.dropdownDivider} />
            <View style={styles.demoFlagRow}>
              <Text style={styles.demoFlagLabel}>Floating design-review button</Text>
              <Switch
                value={reviewCaptureFabEnabled}
                onValueChange={setReviewCaptureFabEnabled}
                trackColor={{ false: '#e5e7eb', true: ORANGE }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.dropdownDivider} />
            <View style={styles.demoFlagRow}>
              <Text style={styles.demoFlagLabel}>Annotation overlay (Home screen)</Text>
              <Switch
                value={reviewOverlayEnabled}
                onValueChange={setReviewOverlayEnabled}
                trackColor={{ false: '#e5e7eb', true: ORANGE }}
                thumbColor="#fff"
              />
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
