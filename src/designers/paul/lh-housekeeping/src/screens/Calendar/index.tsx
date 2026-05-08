import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';
import { GET_CALENDAR_DATA } from '../../apollo/queries';
import { useHousekeepingStatus, RoomStatus } from '../../context/HousekeepingStatus';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { STATUS_VARIANT, SYMBOL_CONTAINER } from '../../config/statusVariant';
import { COLORS } from '../../config/colors';
import CleanSvg from '../../../assets/Clean.svg';
import DirtySvg from '../../../assets/Dirty.svg';
import InspectionSvg from '../../../assets/Inspection.svg';
import SnoozeSvg from '../../../assets/Snooze.svg';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ROOM_COL_WIDTH = 90;
const RIGHT_ARROW_WIDTH = 28;
const NUM_DAYS = 5;
const DAY_WIDTH = (SCREEN_WIDTH - ROOM_COL_WIDTH - RIGHT_ARROW_WIDTH) / NUM_DAYS;
const ROW_HEIGHT = 58;
const GROUP_HEADER_HEIGHT = 36;

const ORANGE = '#ff6842';
const CONFIRMED_BG = '#d9ebc7';
const CONFIRMED_BORDER = '#5b9361';
const TENTATIVE_BG = '#ffe0bc';

type ReservationStatus = 'CONFIRMED' | 'TENTATIVE';

interface CalendarReservation {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  reservationStatus: ReservationStatus;
}

interface CalendarRoom {
  id: string;
  number: string;
  status: RoomStatus;
  reservations: CalendarReservation[];
}

const STATUS_ICON: Record<RoomStatus, { name: React.ComponentProps<typeof Ionicons>['name']; color: string; bg: string }> = {
  CLEANED:             { name: 'checkmark-circle', color: '#2d7d46',        bg: '#9AE0BD'        },
  UNCLEANED:           { name: 'alert-circle',     color: '#b91c1c',        bg: '#f1bfbf'        },
  DEEP_CLEAN:          { name: 'alert-circle',     color: '#b91c1c',        bg: '#f1bfbf'        },
  SKIP_CLEANING:       { name: 'remove-circle',    color: '#a16207',        bg: '#fef9c3'        },
  AWAITING_INSPECTION: { name: 'help-circle',      color: COLORS.Blue[200], bg: COLORS.Blue[600] },
};

// 'symbol' variant — MaterialCommunityIcons with housekeeping-semantic meaning
// shimmer = sparkling clean · water = stain/spill (dirty) · do-not-disturb = skip service
type SymbolEntry =
  | { set: 'MI';  name: React.ComponentProps<typeof MaterialIcons>['name'];          color: string; tint: string }
  | { set: 'MCI'; name: React.ComponentProps<typeof MaterialCommunityIcons>['name']; color: string; tint: string };

const STATUS_SYMBOL: Record<RoomStatus, SymbolEntry> = {
  CLEANED:             { set: 'MI',  name: 'auto-awesome',      color: '#2d7d46',        tint: '#dcfce7'        },
  UNCLEANED:           { set: 'MI',  name: 'cleaning-services', color: '#b91c1c',        tint: '#fee2e2'        },
  DEEP_CLEAN:          { set: 'MCI', name: 'broom',             color: '#b91c1c',        tint: '#fee2e2'        },
  SKIP_CLEANING:       { set: 'MCI', name: 'sleep',             color: '#d97706',        tint: '#fef9c3'        },
  AWAITING_INSPECTION: { set: 'MI',  name: 'auto-fix-high',     color: COLORS.Blue[200], tint: COLORS.Blue[600] },
};

function SymbolIcon({ entry, size }: { entry: SymbolEntry; size: number }) {
  if (entry.set === 'MCI') {
    return <MaterialCommunityIcons name={entry.name as any} size={size} color={entry.color} />;
  }
  return <MaterialIcons name={entry.name as any} size={size} color={entry.color} />;
}

// 'abbr' variant — text label is primary, border colour is secondary
const STATUS_ABBR: Record<RoomStatus, { label: string; color: string }> = {
  CLEANED:             { label: 'CLN', color: '#2d7d46'        },
  UNCLEANED:           { label: 'UNC', color: '#b91c1c'        },
  DEEP_CLEAN:          { label: 'DPC', color: '#b91c1c'        },
  SKIP_CLEANING:       { label: 'SKP', color: '#d97706'        },
  AWAITING_INSPECTION: { label: 'AWI', color: COLORS.Blue[200] },
};

const STATUS_SVG_ICON: Partial<Record<RoomStatus, React.FC<{ width?: number; height?: number }>>> = {
  CLEANED:             CleanSvg,
  UNCLEANED:           DirtySvg,
  DEEP_CLEAN:          DirtySvg,
  AWAITING_INSPECTION: InspectionSvg,
  SKIP_CLEANING:       SnoozeSvg,
};

interface RoomGroup {
  type: string;
  unallocatedCount: number;
  rooms: CalendarRoom[];
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function formatDateHeader(dateStr: string): { day: string; date: number } {
  const d = new Date(dateStr + 'T12:00:00');
  return {
    day: d.toLocaleDateString('en-AU', { weekday: 'short' }).toUpperCase(),
    date: d.getDate(),
  };
}

function formatLongDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getNights(checkIn: string, checkOut: string): number {
  return daysBetween(checkIn, checkOut);
}

export default function CalendarScreen() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekStart, setWeekStart] = useState(today);
  const { statusOverrides } = useHousekeepingStatus();

  const queryStart = addDays(weekStart, -7);
  const queryEnd = addDays(weekStart, NUM_DAYS + 7);

  const { data, loading } = useQuery(GET_CALENDAR_DATA, {
    variables: { startDate: queryStart, endDate: queryEnd },
    pollInterval: 3000,
  });

  const visibleDates = Array.from({ length: NUM_DAYS }, (_, i) => addDays(weekStart, i));
  const groups: RoomGroup[] = data?.calendarData ?? [];

  function getBlockProps(res: CalendarReservation) {
    const startOffset = daysBetween(weekStart, res.checkIn);
    const endOffset = daysBetween(weekStart, res.checkOut);
    const clampedEnd = Math.min(endOffset, NUM_DAYS + 1);
    if (startOffset >= NUM_DAYS || clampedEnd <= 0) return null;
    return {
      left: startOffset * DAY_WIDTH + 3,
      width: (clampedEnd - startOffset) * DAY_WIDTH - 6,
      isConfirmed: res.reservationStatus === 'CONFIRMED',
      startsInView: startOffset >= 0,
    };
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>CALENDAR</Text>
          <Text style={styles.headerDate}>{formatLongDate(selectedDate)}</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.todayButton}
            onPress={() => { setSelectedDate(today); setWeekStart(today); }}
          >
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Week strip ── */}
      <View style={styles.weekStrip}>
        {/* Left arrow sits inside the room-label column */}
        <TouchableOpacity
          style={styles.weekArrowLeft}
          onPress={() => setWeekStart(d => addDays(d, -NUM_DAYS))}
        >
          <Text style={styles.weekArrowText}>‹</Text>
        </TouchableOpacity>
        {visibleDates.map(d => {
          const { day, date } = formatDateHeader(d);
          const isSelected = d === selectedDate;
          return (
            <TouchableOpacity
              key={d}
              style={styles.weekDay}
              onPress={() => setSelectedDate(d)}
            >
              <Text style={styles.weekDayLabel}>{day}</Text>
              <Text style={[styles.weekDayNum, isSelected && { fontWeight: '700' }]}>{date}</Text>
              {isSelected && <View style={styles.weekDayUnderline} />}
            </TouchableOpacity>
          );
        })}
        {/* Right arrow floats over the last column */}
        <TouchableOpacity
          style={styles.weekArrowRight}
          onPress={() => setWeekStart(d => addDays(d, NUM_DAYS))}
        >
          <Text style={styles.weekArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* ── Grid ── */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={ORANGE} />
      ) : (
        <ScrollView style={styles.grid}>
          {groups.map(group => (
            <View key={group.type}>
              {/* Group header */}
              <View style={styles.groupHeader}>
                <Text style={styles.groupHeaderText}>{group.type}</Text>
                {group.unallocatedCount > 0 && (
                  <TouchableOpacity style={styles.unallocatedLink}>
                    <Text style={styles.unallocatedText}>
                      Unallocated ({group.unallocatedCount}) ›
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Room rows */}
              {group.rooms.map(room => {
                const effectiveStatus = statusOverrides[room.id] ?? room.status;
                const isNumeric = /^\d+$/.test(room.number);
                return (
                <View key={room.id} style={styles.roomRow}>
                  {/* Room label */}
                  <View style={[styles.roomLabel, { width: ROOM_COL_WIDTH }]}>
                    <View style={styles.roomLabelRow}>
                      <Text
                        style={styles.roomLabelName}
                        numberOfLines={2}
                      >{isNumeric ? `Room ${room.number}` : room.number}</Text>
                      {STATUS_VARIANT === 'icon' && (() => {
                        const SvgIcon = STATUS_SVG_ICON[effectiveStatus];
                        const { bg, name, color } = STATUS_ICON[effectiveStatus];
                        return (
                          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
                            {SvgIcon
                              ? <SvgIcon width={16} height={16} />
                              : <Ionicons name={name} color={color} size={16} />}
                          </View>
                        );
                      })()}
                      {STATUS_VARIANT === 'symbol' && (() => {
                        const { tint } = STATUS_SYMBOL[effectiveStatus];
                        const containerStyle = SYMBOL_CONTAINER === 'circle'
                          ? styles.symbolCircle
                          : SYMBOL_CONTAINER === 'rounded-square'
                          ? styles.symbolSquare
                          : styles.symbolChip; // chip = circle fallback in Calendar
                        return (
                          <View style={[containerStyle, { backgroundColor: tint }]}>
                            <SymbolIcon entry={STATUS_SYMBOL[effectiveStatus]} size={13} />
                          </View>
                        );
                      })()}
                      {STATUS_VARIANT === 'abbr' && (
                        <View style={[styles.abbrPill, { borderColor: STATUS_ABBR[effectiveStatus].color }]}>
                          <Text style={[styles.abbrText, { color: STATUS_ABBR[effectiveStatus].color }]}>
                            {STATUS_ABBR[effectiveStatus].label}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Day cells + reservation blocks */}
                  <View style={{ flex: 1, height: ROW_HEIGHT, position: 'relative' }}>
                    {/* Cell grid lines */}
                    {visibleDates.map((d, i) => (
                      <View
                        key={d}
                        style={[
                          styles.dayCell,
                          {
                            left: i * DAY_WIDTH,
                            width: DAY_WIDTH,
                            backgroundColor: d === selectedDate ? '#fef9f5' : '#fff',
                          },
                        ]}
                      />
                    ))}
                    {/* Filler covers the gap right of last day cell, hiding row bottom borders */}
                    <View style={styles.dayCellFiller} />

                    {/* Reservation blocks */}
                    {room.reservations.map(res => {
                      const block = getBlockProps(res);
                      if (!block) return null;
                      const nights = getNights(res.checkIn, res.checkOut);
                      return (
                        <View
                          key={res.id}
                          style={[
                            styles.resBlock,
                            {
                              left: block.left,
                              width: block.width,
                              backgroundColor: block.isConfirmed ? CONFIRMED_BG : TENTATIVE_BG,
                              borderColor: block.isConfirmed ? CONFIRMED_BORDER : ORANGE,
                            },
                          ]}
                        >
                          {block.startsInView && (
                            <View style={[styles.resFlag, { backgroundColor: block.isConfirmed ? CONFIRMED_BORDER : ORANGE }]} />
                          )}
                          <View style={styles.resContent}>
                            <Text
                              style={styles.resName}
                              numberOfLines={1}
                            >
                              {res.guestName}
                            </Text>
                            <View style={styles.resMeta}>
                              <View style={styles.resMetaItem}>
                                <Ionicons name="person-outline" size={10} color="#555" />
                                <Text style={styles.resMetaText}>{res.adults}</Text>
                              </View>
                              <View style={[styles.resMetaItem, { marginLeft: 6 }]}>
                                <Ionicons name="moon-outline" size={10} color="#555" />
                                <Text style={styles.resMetaText}>{nights}</Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
                );
              })}
            </View>
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  headerLabel: { fontSize: 12, color: '#484b4b', fontWeight: '600', letterSpacing: 0.24, textTransform: 'uppercase' },
  headerDate: { fontSize: 20, fontFamily: 'ValueSerifTrial-Medium', color: '#000', marginTop: 2 },
  headerButtons: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  todayButton: {
    paddingHorizontal: 12,
    height: 32,
    backgroundColor: '#f4f4f4',
    borderRadius: 4,
    justifyContent: 'center',
  },
  todayButtonText: { fontSize: 14, color: '#333', fontWeight: '500' },
  addButton: {
    paddingHorizontal: 12,
    height: 32,
    backgroundColor: '#fff5ee',
    borderRadius: 4,
    justifyContent: 'center',
  },
  addButtonText: { fontSize: 14, color: '#ff6842', fontWeight: '600' },

  // Week strip
  weekStrip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  weekArrowLeft: { width: ROOM_COL_WIDTH, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 14 },
  weekArrowRight: { position: 'absolute', right: 0, width: 28, alignItems: 'center', top: 0, bottom: 0, justifyContent: 'center' },
  weekArrowText: { fontSize: 22, color: '#9ca3af', lineHeight: 26 },
  weekDay: { width: DAY_WIDTH, alignItems: 'center', justifyContent: 'center', paddingTop: 8, paddingBottom: 10, position: 'relative' },
  weekDayLabel: { fontSize: 12, color: '#484b4b', fontWeight: '400', letterSpacing: 0.5, textTransform: 'uppercase' },
  weekDayNum: { fontSize: 16, fontWeight: '400', color: '#484b4b', marginTop: 2 },
  weekDayUnderline: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: ORANGE },

  // Grid
  grid: { flex: 1 },

  // Group header
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    height: GROUP_HEADER_HEIGHT,
  },
  groupHeaderText: { fontSize: 14, fontWeight: '700', color: '#333' },
  unallocatedLink: {},
  unallocatedText: { fontSize: 14, color: '#c43100', fontWeight: '600' },

  // Room row
  roomRow: {
    flexDirection: 'row',
    height: ROW_HEIGHT,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  roomLabel: {
    justifyContent: 'center',
    paddingLeft: 8,
    paddingRight: 8,
    borderRightWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    zIndex: 1,
  },
  roomLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  roomLabelName: { fontSize: 14, fontWeight: '400', color: '#000', flex: 1, lineHeight: 18 },
  abbrPill: {
    borderWidth: 1.5,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  abbrText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },

  // symbol container styles — all 20×20 so every icon sits in the same footprint
  // (Calendar is space-constrained; Housekeeping uses its own larger sizes)
  symbolCircle: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  symbolSquare: {
    width: 20, height: 20, borderRadius: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  symbolChip: {
    // chip falls back to circle in Calendar (space-constrained)
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  // Day cells
  dayCellFiller: {
    position: 'absolute',
    top: 0,
    left: NUM_DAYS * DAY_WIDTH,
    width: RIGHT_ARROW_WIDTH,
    height: ROW_HEIGHT,
    backgroundColor: '#fff',
  },
  dayCell: {
    position: 'absolute',
    top: 0,
    height: ROW_HEIGHT,
    borderRightWidth: 1,
    borderColor: '#f0f0f0',
  },

  // Reservation block
  resBlock: {
    position: 'absolute',
    top: 7,
    height: ROW_HEIGHT - 14,
    borderRadius: 6,
    flexDirection: 'row',
    borderWidth: 1,
    overflow: 'hidden',
  },
  resFlag: {
    width: 4,
    height: '100%',
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  resContent: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  resName: { fontSize: 12, fontWeight: '700', color: '#333' },
  resMeta: { flexDirection: 'row', marginTop: 2 },
  resMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resMetaText: { fontSize: 11, color: '#484b4b' },

});
