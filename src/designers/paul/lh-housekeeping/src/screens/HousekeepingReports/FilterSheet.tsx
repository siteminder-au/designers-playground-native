import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, PanResponder, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FilterState,
  ROOM_TYPE_OPTIONS, ROOM_STATUS_OPTIONS, CLEANING_STATUS_OPTIONS, DEFAULT_FILTERS, WINDOW_HEIGHT,
} from './types';
import { styles } from './styles';

export function FilterSheet({
  visible,
  filters,
  onFiltersChange,
  onClose,
}: {
  visible: boolean;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClose: () => void;
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

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderMove:   (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
    onPanResponderRelease:(_, g) => {
      if (g.dy > 80) close();
      else Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
    },
  })).current;

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={close}>
      <Animated.View style={[styles.sortSheetOverlay, { opacity: sheetAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={close} />
        <Animated.View style={[styles.sortSheet, { height: WINDOW_HEIGHT * 0.85, paddingBottom: 0, transform: [{ translateY }] }]}>
          <View style={styles.sheetHandleArea} {...panResponder.panHandlers}>
            <View style={styles.sortSheetHandle} />
          </View>
          <View style={styles.sortSheetHeader}>
            <Text style={styles.sortSheetTitle}>Filter</Text>
            <TouchableOpacity onPress={() => onFiltersChange(DEFAULT_FILTERS)}>
              <Text style={styles.sortResetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            {/* Room type */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}>ROOM TYPE</Text>
              <View style={styles.filterChipRow}>
                {ROOM_TYPE_OPTIONS.map(type => {
                  const isActive = filters.roomTypes.includes(type);
                  return (
                    <TouchableOpacity
                      key={type}
                      activeOpacity={0.75}
                      style={[styles.filterChip, { borderColor: isActive ? '#ff6842' : '#d1d5db', backgroundColor: isActive ? '#fff5ee' : '#fff' }]}
                      onPress={() => onFiltersChange({
                        ...filters,
                        roomTypes: isActive ? filters.roomTypes.filter(x => x !== type) : [...filters.roomTypes, type],
                      })}
                    >
                      <Text style={[styles.filterChipText, { color: isActive ? '#ff6842' : '#333', fontWeight: isActive ? '600' : '400' }]}>{type}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Room status */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}>ROOM STATUS</Text>
              <View style={styles.filterChipRow}>
                {ROOM_STATUS_OPTIONS.map(status => {
                  const isActive = filters.roomStatuses.includes(status);
                  return (
                    <TouchableOpacity
                      key={status}
                      activeOpacity={0.75}
                      style={[styles.filterChip, { borderColor: isActive ? '#ff6842' : '#d1d5db', backgroundColor: isActive ? '#fff5ee' : '#fff' }]}
                      onPress={() => onFiltersChange({
                        ...filters,
                        roomStatuses: isActive ? filters.roomStatuses.filter(x => x !== status) : [...filters.roomStatuses, status],
                      })}
                    >
                      <Text style={[styles.filterChipText, { color: isActive ? '#ff6842' : '#333', fontWeight: isActive ? '600' : '400' }]}>{status}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Cleaning status */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}>CLEANING STATUS</Text>
              <View style={styles.filterChipRow}>
                {CLEANING_STATUS_OPTIONS.map(s => {
                  const isActive = filters.cleaningStatuses.includes(s);
                  return (
                    <TouchableOpacity
                      key={s}
                      activeOpacity={0.75}
                      style={[styles.filterChip, { borderColor: isActive ? '#ff6842' : '#d1d5db', backgroundColor: isActive ? '#fff5ee' : '#fff' }]}
                      onPress={() => onFiltersChange({
                        ...filters,
                        cleaningStatuses: isActive ? filters.cleaningStatuses.filter(x => x !== s) : [...filters.cleaningStatuses, s],
                      })}
                    >
                      <Text style={[styles.filterChipText, { color: isActive ? '#ff6842' : '#333', fontWeight: isActive ? '600' : '400' }]}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Checkouts */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}>CHECKOUTS</Text>
              <View style={styles.filterChipRow}>
                {([
                  { key: 'lateCheckout',  label: 'Late'  },
                  { key: 'earlyCheckout', label: 'Early' },
                ] as { key: 'lateCheckout' | 'earlyCheckout'; label: string }[]).map(item => {
                  const isActive = filters[item.key];
                  return (
                    <TouchableOpacity
                      key={item.key}
                      activeOpacity={0.75}
                      style={[styles.filterChip, isActive ? styles.filterChipActive : styles.filterChipInactive]}
                      onPress={() => onFiltersChange({ ...filters, [item.key]: !filters[item.key] })}
                    >
                      <Text style={[styles.filterChipText, { color: isActive ? '#ff6842' : '#333', fontWeight: isActive ? '600' : '400' }]}>{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}>NOTES</Text>
              <View style={styles.filterChipRow}>
                {([
                  { key: 'includeStaffNotes',    label: 'Staff notes'    },
                  { key: 'includeGuestComments', label: 'Guest comments' },
                  { key: 'includeExtras',        label: 'Extras'         },
                ] as { key: 'includeStaffNotes' | 'includeGuestComments' | 'includeExtras'; label: string }[]).map(opt => {
                  const isActive = filters[opt.key];
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      activeOpacity={0.75}
                      style={[styles.filterChip, isActive ? styles.filterChipActive : styles.filterChipInactive]}
                      onPress={() => onFiltersChange({ ...filters, [opt.key]: !filters[opt.key] })}
                    >
                      <Text style={[styles.filterChipText, { color: isActive ? '#ff6842' : '#333', fontWeight: isActive ? '600' : '400' }]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Save — pinned footer */}
          <View style={[styles.autoFooter, styles.filterSaveFooter, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity style={styles.autoDoneBtn} onPress={close}>
              <Text style={styles.autoDoneBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
