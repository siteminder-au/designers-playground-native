import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../../config/colors';
import { ORANGE } from '../../constants';
import styles from '../../styles';

const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function MonthSheet({
  visible,
  onClose,
  sheetAnim,
  translateY,
  panResponder,
  monthSheetCursor,
  setMonthSheetCursor,
  today,
  selectedDate,
  setSelectedDate,
  setWeekStart,
  insetsBottom,
}: {
  visible: boolean;
  onClose: () => void;
  sheetAnim: Animated.Value;
  translateY: Animated.Value;
  panResponder: ReturnType<typeof PanResponder.create>;
  monthSheetCursor: string;
  setMonthSheetCursor: React.Dispatch<React.SetStateAction<string>>;
  today: string;
  selectedDate: string;
  setSelectedDate: React.Dispatch<React.SetStateAction<string>>;
  setWeekStart: React.Dispatch<React.SetStateAction<string>>;
  insetsBottom: number;
}) {
  const cursorDate = new Date(monthSheetCursor + 'T12:00:00');
  const year = cursorDate.getFullYear();
  const month = cursorDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startDow = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length < 42) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < 6; i++) rows.push(cells.slice(i * 7, i * 7 + 7));

  const goPrev = () => {
    const d = new Date(year, month - 1, 1);
    setMonthSheetCursor(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
  };
  const goNext = () => {
    const d = new Date(year, month + 1, 1);
    setMonthSheetCursor(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
  };
  const todayDate = new Date(today + 'T12:00:00');
  const isToday = (day: number) => day === todayDate.getDate() && month === todayDate.getMonth() && year === todayDate.getFullYear();
  const selDate = new Date(selectedDate + 'T12:00:00');
  const isSelected = (day: number) => day === selDate.getDate() && month === selDate.getMonth() && year === selDate.getFullYear();
  const pickDay = (day: number) => {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(iso);
    setWeekStart(iso);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.sortSheetOverlay, { opacity: sheetAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.monthSheet, { transform: [{ translateY }] }]}>
          <View style={styles.sheetHandleArea} {...panResponder.panHandlers}>
            <View style={styles.dateSheetHandle} />
          </View>
          <View style={styles.monthSheetHeader}>
            <Text style={styles.monthSheetMonthYear}>{MONTH_LONG[month]} {year}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
              <TouchableOpacity onPress={goPrev}>
                <Ionicons name="chevron-back" size={22} color={ORANGE} />
              </TouchableOpacity>
              <TouchableOpacity onPress={goNext}>
                <Ionicons name="chevron-forward" size={22} color={ORANGE} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.monthSheetDayRow}>
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
              <Text key={d} style={styles.monthSheetDayLabel}>{d}</Text>
            ))}
          </View>
          <View style={styles.monthSheetGrid}>
            {rows.map((row, ri) => (
              <View key={ri} style={styles.monthSheetGridRow}>
                {row.map((day, ci) => {
                  if (day === null) return <View key={ci} style={styles.monthSheetCell} />;
                  const sel = isSelected(day);
                  const td = isToday(day);
                  return (
                    <TouchableOpacity
                      key={ci}
                      style={[styles.monthSheetCell, sel && styles.monthSheetCellSelected]}
                      onPress={() => pickDay(day)}
                      activeOpacity={0.6}
                    >
                      <Text style={[
                        styles.monthSheetDayNum,
                        td && !sel && { color: ORANGE },
                        sel && styles.monthSheetDayNumSelected,
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
          <View style={{ height: insetsBottom + 16 }} />
          <TouchableOpacity onPress={onClose} style={styles.monthSheetCloseBtn}>
            <Ionicons name="close" size={20} color={COLORS.Black[200]} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
