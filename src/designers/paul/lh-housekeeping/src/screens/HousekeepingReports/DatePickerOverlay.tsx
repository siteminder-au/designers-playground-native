import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { ORANGE, WINDOW_HEIGHT } from './types';
import { addDays, formatLong } from './utils';
import { styles } from './styles';

export function DatePickerOverlay({
  visible,
  today,
  onApply,
  onClose,
}: {
  visible: boolean;
  today: string;
  onApply: (start: string, end: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(WINDOW_HEIGHT)).current;
  const [expandedField, setExpandedField] = useState<'start' | 'end' | null>('start');
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const [pendingEnd, setPendingEnd] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setPendingStart(null);
      setPendingEnd(null);
      setExpandedField('start');
      anim.setValue(WINDOW_HEIGHT);
      Animated.spring(anim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 28,
        stiffness: 300,
      }).start();
    }
  }, [visible]);

  function close() {
    Animated.timing(anim, {
      toValue: WINDOW_HEIGHT,
      duration: 280,
      useNativeDriver: true,
    }).start(() => onClose());
  }

  function apply() {
    if (!pendingStart || !pendingEnd) return;
    onApply(pendingStart, pendingEnd);
    close();
  }

  if (!visible) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#fff', paddingTop: insets.top, transform: [{ translateY: anim }] }]}>

      {/* Header */}
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={close}>
          <Ionicons name="close" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Select dates</Text>
        <View style={{ width: 24 }} />
      </View>
      <Text style={styles.dateModalHelper}>Start date is within 28 days of today. End date is within 28 days of start.</Text>

      <View style={{ flex: 1 }}>
        {/* Start date field */}
        <TouchableOpacity
          style={[styles.dateField, expandedField === 'start' && styles.dateFieldActive]}
          onPress={() => setExpandedField(expandedField === 'start' ? null : 'start')}
        >
          <View style={styles.dateFieldLeft}>
            <Text style={styles.dateFieldLabel}>Start date</Text>
            <Text style={[styles.dateFieldValue, !pendingStart && styles.dateFieldPlaceholder]}>
              {pendingStart ? formatLong(pendingStart) : 'Select a date'}
            </Text>
          </View>
          <Ionicons name={expandedField === 'start' ? 'chevron-up' : 'chevron-down'} size={18} color="#9ca3af" />
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
            theme={{ selectedDayBackgroundColor: ORANGE, todayTextColor: ORANGE, arrowColor: ORANGE }}
          />
        )}

        <View style={styles.fieldDivider} />

        {/* End date field */}
        <TouchableOpacity
          style={[styles.dateField, expandedField === 'end' && styles.dateFieldActive]}
          onPress={() => setExpandedField(expandedField === 'end' ? null : 'end')}
        >
          <View style={styles.dateFieldLeft}>
            <Text style={styles.dateFieldLabel}>End date</Text>
            <Text style={[styles.dateFieldValue, !pendingEnd && styles.dateFieldPlaceholder]}>
              {pendingEnd ? formatLong(pendingEnd) : 'Select a date'}
            </Text>
          </View>
          <Ionicons name={expandedField === 'end' ? 'chevron-up' : 'chevron-down'} size={18} color="#9ca3af" />
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
            theme={{ selectedDayBackgroundColor: ORANGE, todayTextColor: ORANGE, arrowColor: ORANGE }}
          />
        )}
      </View>

      {/* Apply button */}
      <View style={styles.modalFooter}>
        <TouchableOpacity
          style={[styles.applyBtn, (!pendingStart || !pendingEnd) && styles.applyBtnDisabled]}
          onPress={apply}
          disabled={!pendingStart || !pendingEnd}
        >
          <Text style={styles.applyBtnText}>Apply</Text>
        </TouchableOpacity>
      </View>

    </Animated.View>
  );
}
