import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, PanResponder, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RES_FLAGS from '../../../config/reservationsFeatureFlags';

const ORANGE = '#ff6842';

type FlagsState = typeof RES_FLAGS;

export function DemoFlagsSheet({
  visible,
  onClose,
  sheetAnim,
  translateY,
  panResponder,
  flags,
  setFlags,
  insetsBottom,
}: {
  visible: boolean;
  onClose: () => void;
  sheetAnim: Animated.Value;
  translateY: Animated.Value;
  panResponder: ReturnType<typeof PanResponder.create>;
  flags: FlagsState;
  setFlags: React.Dispatch<React.SetStateAction<FlagsState>>;
  insetsBottom: number;
}) {
  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: sheetAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.handleArea} {...panResponder.panHandlers}><View style={styles.handle} /></View>
          <View style={styles.header}>
            <Text style={styles.title}>Demo flags</Text>
            <TouchableOpacity onPress={() => setFlags({ ...RES_FLAGS })}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: insetsBottom + 16 }}>
            <View style={styles.variantRow}>
              <Text style={styles.flagLabel}>Tap to Pay entry point</Text>
              <View style={styles.optionList}>
                {([
                  { value: 'banner', label: 'Inline banner', hint: 'Dismissible, below the filter chips' },
                  { value: 'hero', label: 'Full-screen hero', hint: 'One-time takeover on entry' },
                  { value: 'chip', label: 'Persistent chip', hint: 'Thin, non-dismissible row' },
                  { value: 'contextual', label: 'On payment cards', hint: 'Tag next to "Take payment"' },
                ] as { value: FlagsState['tapToPayEntryVariant']; label: string; hint: string }[]).map((opt, i) => {
                  const isActive = flags.tapToPayEntryVariant === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.optionRow, i > 0 && styles.optionRowDivider]}
                      onPress={() => setFlags(prev => ({ ...prev, tapToPayEntryVariant: opt.value }))}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>{opt.label}</Text>
                        <Text style={styles.optionHint}>{opt.hint}</Text>
                      </View>
                      {isActive && <Ionicons name="checkmark-circle" size={20} color={ORANGE} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
  },
  handleArea: { alignItems: 'center', paddingVertical: 8 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ddd' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#212323' },
  resetText: { fontSize: 14, color: ORANGE, fontWeight: '600' },
  variantRow: { paddingHorizontal: 20, paddingTop: 8 },
  flagLabel: { fontSize: 13, color: '#484b4b', fontWeight: '600', marginBottom: 8 },
  optionList: {
    backgroundColor: '#f2f3f3',
    borderRadius: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  optionRowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#e5e8e8',
  },
  optionLabel: { fontSize: 14, color: '#333', fontWeight: '600', marginBottom: 2 },
  optionLabelActive: { color: ORANGE },
  optionHint: { fontSize: 12, color: '#6d7272' },
});
