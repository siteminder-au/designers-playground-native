import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, PanResponder, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { COLORS } from '../../../../config/colors';
import { ORANGE } from '../../constants';
import { addDays, formatLong } from '../../utils/dateFormat';
import styles from '../../styles';

export function DateRangeSheet({
  visible,
  onClose,
  sheetAnim,
  translateY,
  panResponder,
  today,
  pendingStart,
  setPendingStart,
  pendingEnd,
  setPendingEnd,
  expandedField,
  setExpandedField,
  resetDateSheet,
  applyRange,
}: {
  visible: boolean;
  onClose: () => void;
  sheetAnim: Animated.Value;
  translateY: Animated.Value;
  panResponder: ReturnType<typeof PanResponder.create>;
  today: string;
  pendingStart: string | null;
  setPendingStart: React.Dispatch<React.SetStateAction<string | null>>;
  pendingEnd: string | null;
  setPendingEnd: React.Dispatch<React.SetStateAction<string | null>>;
  expandedField: 'start' | 'end' | null;
  setExpandedField: React.Dispatch<React.SetStateAction<'start' | 'end' | null>>;
  resetDateSheet: () => void;
  applyRange: () => void;
}) {
  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.sortSheetOverlay, { opacity: sheetAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.dateSheet, { transform: [{ translateY }] }]}>
          <View style={styles.sheetHandleArea} {...panResponder.panHandlers}>
            <View style={styles.dateSheetHandle} />
          </View>
          <View style={styles.dateSheetHeader}>
            <Text style={styles.dateSheetTitle}>Select dates</Text>
            <TouchableOpacity onPress={onClose} style={styles.dateSheetCloseBtn}>
              <Ionicons name="close" size={20} color={COLORS.Black[200]} />
            </TouchableOpacity>
          </View>
          <Text style={styles.dateSheetHelper}>Start date is within 28 days of today. End date is within 28 days of start.</Text>

          <ScrollView style={styles.dateSheetScroll} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            {/* Start date panel */}
            <View style={styles.dateSheetPanel}>
              <TouchableOpacity
                style={styles.dateSheetFieldRow}
                onPress={() => setExpandedField(expandedField === 'start' ? null : 'start')}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.dateSheetFieldLabel}>Start date</Text>
                  <Text style={[styles.dateSheetFieldValue, !pendingStart && styles.dateSheetFieldPlaceholder]}>
                    {pendingStart ? formatLong(pendingStart) : 'Select a date'}
                  </Text>
                </View>
                <Ionicons
                  name={expandedField === 'start' ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.Black[500]}
                />
              </TouchableOpacity>
              {expandedField === 'start' && (
                <Calendar
                  minDate={addDays(today, -28)}
                  maxDate={addDays(today, 28)}
                  onDayPress={(day: { dateString: string }) => {
                    setPendingStart(day.dateString);
                    setPendingEnd(null);
                    setExpandedField('end');
                  }}
                  markedDates={pendingStart ? { [pendingStart]: { selected: true, selectedColor: ORANGE } } : {}}
                  theme={{ selectedDayBackgroundColor: ORANGE, todayTextColor: ORANGE, arrowColor: ORANGE, calendarBackground: 'transparent' }}
                  style={{ backgroundColor: 'transparent' }}
                />
              )}
            </View>

            {/* End date panel */}
            <View style={styles.dateSheetPanel}>
              <TouchableOpacity
                style={styles.dateSheetFieldRow}
                onPress={() => setExpandedField(expandedField === 'end' ? null : 'end')}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.dateSheetFieldLabel}>End date</Text>
                  <Text style={[styles.dateSheetFieldValue, !pendingEnd && styles.dateSheetFieldPlaceholder]}>
                    {pendingEnd ? formatLong(pendingEnd) : 'Select a date'}
                  </Text>
                </View>
                <Ionicons
                  name={expandedField === 'end' ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.Black[500]}
                />
              </TouchableOpacity>
              {expandedField === 'end' && (
                <Calendar
                  minDate={pendingStart ?? undefined}
                  maxDate={pendingStart ? addDays(pendingStart, 28) : addDays(today, 28)}
                  onDayPress={(day: { dateString: string }) => {
                    setPendingEnd(day.dateString);
                    setExpandedField(null);
                  }}
                  markedDates={pendingEnd ? { [pendingEnd]: { selected: true, selectedColor: ORANGE } } : {}}
                  theme={{ selectedDayBackgroundColor: ORANGE, todayTextColor: ORANGE, arrowColor: ORANGE, calendarBackground: 'transparent' }}
                  style={{ backgroundColor: 'transparent' }}
                />
              )}
            </View>
          </ScrollView>

          {/* Sticky footer toolbar: Reset (left) + Apply pill (right) */}
          <View style={styles.dateSheetFooter}>
            <TouchableOpacity
              style={styles.dateSheetResetBtn}
              onPress={resetDateSheet}
              disabled={!pendingStart && !pendingEnd}
            >
              <Ionicons name="refresh" size={20} color={(!pendingStart && !pendingEnd) ? COLORS.Black[500] : ORANGE} />
              <Text style={[styles.dateSheetResetText, (!pendingStart && !pendingEnd) && { color: COLORS.Black[500] }]}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateSheetApplyPill, (!pendingStart || !pendingEnd) && styles.dateSheetApplyPillDisabled]}
              onPress={applyRange}
              disabled={!pendingStart || !pendingEnd}
            >
              <Ionicons name="arrow-forward" size={16} color="#fff" />
              <Text style={styles.dateSheetApplyPillText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
