import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, PanResponder, ScrollView } from 'react-native';
import {
  type FilterState,
  ROOM_TYPE_OPTIONS, ROOM_STATUS_OPTIONS, CLEANING_STATUS_OPTIONS,
  DEFAULT_FILTERS,
} from '../../utils/filters';
import { WINDOW_HEIGHT } from '../../constants';
import styles from '../../styles';

export function FilterSheet({
  visible,
  onClose,
  sheetAnim,
  translateY,
  panResponder,
  filters,
  setFilters,
  insetsBottom,
}: {
  visible: boolean;
  onClose: () => void;
  sheetAnim: Animated.Value;
  translateY: Animated.Value;
  panResponder: ReturnType<typeof PanResponder.create>;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  insetsBottom: number;
}) {
  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View style={[styles.sortSheetOverlay, { opacity: sheetAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sortSheet, { height: WINDOW_HEIGHT * 0.85, paddingBottom: 0, transform: [{ translateY }] }]}>
          <View style={styles.sheetHandleArea} {...panResponder.panHandlers}>
            <View style={styles.sortSheetHandle} />
          </View>
          <View style={styles.sortSheetHeader}>
            <Text style={styles.sortSheetTitle}>Filter</Text>
            <TouchableOpacity onPress={() => setFilters(DEFAULT_FILTERS)}>
              <Text style={styles.sortResetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            {/* Room type — multi-select chips */}
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
                      onPress={() => setFilters(prev => ({
                        ...prev,
                        roomTypes: isActive ? prev.roomTypes.filter(x => x !== type) : [...prev.roomTypes, type],
                      }))}
                    >
                      <Text style={[styles.filterChipText, { color: isActive ? '#ff6842' : '#333', fontWeight: isActive ? '600' : '400' }]}>{type}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Room status — multi-select chips */}
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
                      onPress={() => setFilters(prev => ({
                        ...prev,
                        roomStatuses: isActive ? prev.roomStatuses.filter(x => x !== status) : [...prev.roomStatuses, status],
                      }))}
                    >
                      <Text style={[styles.filterChipText, { color: isActive ? '#ff6842' : '#333', fontWeight: isActive ? '600' : '400' }]}>{status}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Cleaning status — multi-select chips */}
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
                      onPress={() => setFilters(prev => ({
                        ...prev,
                        cleaningStatuses: isActive ? prev.cleaningStatuses.filter(x => x !== s) : [...prev.cleaningStatuses, s],
                      }))}
                    >
                      <Text style={[styles.filterChipText, { color: isActive ? '#ff6842' : '#333', fontWeight: isActive ? '600' : '400' }]}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Checkouts — chips */}
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
                      onPress={() => setFilters(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                    >
                      <Text style={[styles.filterChipText, { color: isActive ? '#ff6842' : '#333', fontWeight: isActive ? '600' : '400' }]}>{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Notes — chips */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}>NOTES</Text>
              <View style={styles.filterChipRow}>
                {([
                  { key: 'includeStaffNotes',    label: 'Staff notes'     },
                  { key: 'includeGuestComments', label: 'Guest comments'  },
                  { key: 'includeExtras',        label: 'Extras'          },
                ] as { key: 'includeStaffNotes' | 'includeGuestComments' | 'includeExtras'; label: string }[]).map(opt => {
                  const isActive = filters[opt.key];
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      activeOpacity={0.75}
                      style={[styles.filterChip, isActive ? styles.filterChipActive : styles.filterChipInactive]}
                      onPress={() => setFilters(prev => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                    >
                      <Text style={[styles.filterChipText, { color: isActive ? '#ff6842' : '#333', fontWeight: isActive ? '600' : '400' }]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Save — pinned footer */}
          <View style={[styles.autoFooter, styles.filterSaveFooter, { paddingBottom: insetsBottom + 16 }]}>
            <TouchableOpacity style={styles.autoDoneBtn} onPress={onClose}>
              <Text style={styles.autoDoneBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
