import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, PanResponder } from 'react-native';
import { type SortState, SORT_OPTIONS, DEFAULT_SORT } from '../../utils/priority';
import styles from '../../styles';

export function SortSheet({
  visible,
  onClose,
  sheetAnim,
  translateY,
  panResponder,
  sort,
  setSort,
}: {
  visible: boolean;
  onClose: () => void;
  sheetAnim: Animated.Value;
  translateY: Animated.Value;
  panResponder: ReturnType<typeof PanResponder.create>;
  sort: SortState;
  setSort: React.Dispatch<React.SetStateAction<SortState>>;
}) {
  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View style={[styles.sortSheetOverlay, { opacity: sheetAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sortSheet, { transform: [{ translateY }] }]}>
          <View style={styles.sheetHandleArea} {...panResponder.panHandlers}><View style={styles.sortSheetHandle} /></View>
          <View style={styles.sortSheetHeader}>
            <Text style={styles.sortSheetTitle}>Sort by</Text>
            <TouchableOpacity onPress={() => { setSort(DEFAULT_SORT); onClose(); }}>
              <Text style={styles.sortResetText}>Reset</Text>
            </TouchableOpacity>
          </View>
          {SORT_OPTIONS.map((option) => {
            const isSelected = sort.field === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.sortOptionRow, isSelected && styles.sortOptionRowActive]}
                onPress={() => { setSort(prev => ({ ...prev, field: option.value })); onClose(); }}
              >
                <View style={[styles.sortRadio, isSelected && styles.sortRadioActive]}>
                  {isSelected && <View style={styles.sortRadioDot} />}
                </View>
                <Text style={[styles.sortOptionLabel, isSelected && styles.sortOptionLabelActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
