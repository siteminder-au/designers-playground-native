import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, PanResponder, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  type FilterState,
  ROOM_TYPE_OPTIONS, ROOM_STATUS_OPTIONS, GUEST_DETAIL_OPTIONS,
  DEFAULT_FILTERS,
} from '../../utils/filters';
import { WINDOW_HEIGHT, ORANGE } from '../../constants';
import styles from '../../styles';

function FilterChip({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={[styles.filterChip, isActive ? styles.filterChipActive : styles.filterChipInactive]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, { color: isActive ? ORANGE : '#333', fontWeight: isActive ? '600' : '400' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function FilterSectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.filterSectionCard}>
      <Text style={styles.filterSectionHeaderText}>{title}</Text>
      <View style={styles.filterChipRow}>{children}</View>
    </View>
  );
}

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
  function toggleArrayFilter(key: 'roomStatuses' | 'roomTypes' | 'guestDetails', value: string) {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value],
    }));
  }

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View style={[styles.sortSheetOverlay, { opacity: sheetAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sortSheet, { height: WINDOW_HEIGHT * 0.85, paddingBottom: 0, transform: [{ translateY }] }]}>
          <View style={styles.sheetHandleArea} {...panResponder.panHandlers}>
            <View style={styles.sortSheetHandle} />
          </View>
          <View style={styles.sortSheetHeader}>
            <Text style={styles.sortSheetTitle}>Filters</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.filterSectionsContainer}>
            <FilterSectionCard title="Reservation Status">
              {ROOM_STATUS_OPTIONS.map(status => (
                <FilterChip
                  key={status}
                  label={status}
                  isActive={filters.roomStatuses.includes(status)}
                  onPress={() => toggleArrayFilter('roomStatuses', status)}
                />
              ))}
            </FilterSectionCard>

            <FilterSectionCard title="Additional details">
              <FilterChip
                label="Room notes"
                isActive={filters.hasRoomNotes}
                onPress={() => setFilters(prev => ({ ...prev, hasRoomNotes: !prev.hasRoomNotes }))}
              />
            </FilterSectionCard>

            <FilterSectionCard title="Room type">
              {ROOM_TYPE_OPTIONS.map(type => (
                <FilterChip
                  key={type}
                  label={type}
                  isActive={filters.roomTypes.includes(type)}
                  onPress={() => toggleArrayFilter('roomTypes', type)}
                />
              ))}
            </FilterSectionCard>

            <FilterSectionCard title="Guest details">
              {GUEST_DETAIL_OPTIONS.map(detail => (
                <FilterChip
                  key={detail}
                  label={detail}
                  isActive={filters.guestDetails.includes(detail)}
                  onPress={() => toggleArrayFilter('guestDetails', detail)}
                />
              ))}
            </FilterSectionCard>
          </ScrollView>

          {/* Clear filters + Save — pinned footer */}
          <View style={[styles.filterFooterRow, { paddingBottom: insetsBottom + 24 }]}>
            <TouchableOpacity style={styles.filterClearBtn} onPress={() => setFilters(DEFAULT_FILTERS)} activeOpacity={0.7}>
              <Ionicons name="refresh-outline" size={18} color={ORANGE} />
              <Text style={styles.filterClearBtnText}>Clear filters</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterSaveBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.filterSaveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
