import React, { useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Distribution'>;

// ─── Constants ────────────────────────────────────────────────────────────────

const LEFT_COL = 114;
const CELL_W   = 62;

// ─── Data ─────────────────────────────────────────────────────────────────────

const DATES = [
  { day: 'THU', date: 30, isToday: true,  isWeekend: false },
  { day: 'FRI', date: 1,  isToday: false, isWeekend: false },
  { day: 'SAT', date: 2,  isToday: false, isWeekend: true  },
  { day: 'SUN', date: 3,  isToday: false, isWeekend: true  },
  { day: 'MON', date: 4,  isToday: false, isWeekend: false },
  { day: 'TUE', date: 5,  isToday: false, isWeekend: false },
  { day: 'WED', date: 6,  isToday: false, isWeekend: false },
];

type RowKind = 'room' | 'rate' | 'price' | 'channel';

interface Row {
  id: string; kind: RowKind; label: string;
  values: number[]; h: number; hasInfo?: boolean;
}

const ROWS: Row[] = [
  { id:'r1',  kind:'room',    label:'Single Room',   values:[12,0,12,12,0,12,12], h:52 },
  { id:'r2',  kind:'rate',    label:'Standard Rate', values:[12,0,12,12,0,12,12], h:44 },
  { id:'r3',  kind:'price',   label:'',              values:[240,240,240,240,240,240,240], h:36 },
  { id:'r4',  kind:'channel', label:'Booking.com',   values:[240,240,240,240,240,240,240], h:44, hasInfo:true },
  { id:'r5',  kind:'channel', label:'Expedia',       values:[240,240,240,240,240,240,240], h:44 },
  { id:'r6',  kind:'channel', label:'Agoda',         values:[240,240,240,240,240,240,240], h:44 },
  { id:'r7',  kind:'room',    label:'Double Room',   values:[8,0,8,8,0,8,8], h:52 },
  { id:'r8',  kind:'rate',    label:'Standard Rate', values:[8,0,8,8,0,8,8], h:44 },
  { id:'r9',  kind:'price',   label:'',              values:[320,320,320,320,320,320,320], h:36 },
  { id:'r10', kind:'channel', label:'Booking.com',   values:[320,320,320,320,320,320,320], h:44, hasInfo:true },
  { id:'r11', kind:'channel', label:'Expedia',       values:[320,320,320,320,320,320,320], h:44 },
  { id:'r12', kind:'channel', label:'Agoda',         values:[320,320,320,320,320,320,320], h:44 },
  { id:'r13', kind:'room',    label:'Suite',         values:[4,4,0,4,4,0,4], h:52 },
  { id:'r14', kind:'rate',    label:'Premium Rate',  values:[4,4,0,4,4,0,4], h:44 },
  { id:'r15', kind:'price',   label:'',              values:[580,580,580,580,580,580,580], h:36 },
  { id:'r16', kind:'channel', label:'Booking.com',   values:[580,580,580,580,580,580,580], h:44 },
  { id:'r17', kind:'channel', label:'Direct',        values:[580,580,580,580,580,580,580], h:44 },
];

const TOTAL_H = ROWS.reduce((s, r) => s + r.h, 0);

// ─── Component ───────────────────────────────────────────────────────────────

export default function DistributionScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const headerScrollRef = useRef<ScrollView>(null);
  const bodyScrollRef   = useRef<ScrollView>(null);
  const isSyncing       = useRef(false);

  const onHeaderScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    if (!isSyncing.current) {
      isSyncing.current = true;
      bodyScrollRef.current?.scrollTo({ x, animated: false });
      requestAnimationFrame(() => { isSyncing.current = false; });
    }
  }, []);

  const onBodyScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    if (!isSyncing.current) {
      isSyncing.current = true;
      headerScrollRef.current?.scrollTo({ x, animated: false });
      requestAnimationFrame(() => { isSyncing.current = false; });
    }
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.dateRow} activeOpacity={0.7}>
          <Text style={styles.dateText}>30 April, 2021</Text>
          <Ionicons name="chevron-down" size={16} color="#111827" />
        </TouchableOpacity>
        <View style={styles.topBarIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="calendar-outline" size={22} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="help-circle-outline" size={22} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Filter bar ── */}
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.ratesDropdown} activeOpacity={0.8}>
          <Text style={styles.ratesDropdownText}>All rates &amp; availabilities</Text>
          <Ionicons name="chevron-down" size={14} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.bulkEditBtn} activeOpacity={0.8}>
          <Ionicons name="flash" size={14} color="white" />
          <Text style={styles.bulkEditText}>Bulk Edit</Text>
        </TouchableOpacity>
      </View>

      {/* ── Chips ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={styles.chips}>
        {[
          { label: 'Room types', icon: 'bed-outline'         },
          { label: 'Rate plans', icon: 'pricetag-outline'    },
          { label: 'Channels',   icon: 'git-network-outline' },
        ].map((chip) => (
          <TouchableOpacity key={chip.label} style={styles.chip} activeOpacity={0.8}>
            <Ionicons name={chip.icon as any} size={11} color="#374151" />
            <Text style={styles.chipText}>{chip.label}</Text>
            <Ionicons name="chevron-down" size={11} color="#374151" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Grid ── */}
      <View style={styles.grid}>
        {/* Date header row — left spacer + synced horizontal scroll */}
        <View style={styles.dateHeaderRow}>
          <View style={{ width: LEFT_COL, borderRightWidth: 1, borderRightColor: '#E5E7EB' }} />
          <ScrollView
            ref={headerScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={onHeaderScroll}
            style={{ flex: 1 }}
          >
            {DATES.map((d) => (
              <View key={d.date} style={[styles.dateCell, { width: CELL_W }]}>
                <Text style={[styles.dateDayLabel, d.isWeekend && styles.weekendText]}>{d.day}</Text>
                <Text style={[styles.dateDateLabel, d.isWeekend && styles.weekendText, d.isToday && styles.todayDateText]}>
                  {d.date}
                </Text>
                {d.isToday && <View style={styles.todayBar} />}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Rows: sticky left labels + synced horizontal data */}
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row' }}>

            {/* Left label column (not horizontally scrollable) */}
            <View style={{ width: LEFT_COL, borderRightWidth: 1, borderRightColor: '#E5E7EB' }}>
              {ROWS.map((row) => (
                <View
                  key={row.id}
                  style={[
                    styles.labelCell,
                    { height: row.h },
                    row.kind === 'room' && styles.labelCellRoom,
                  ]}
                >
                  {row.kind === 'room' && (
                    <Text style={styles.labelRoom} numberOfLines={1}>{row.label}</Text>
                  )}
                  {row.kind === 'rate' && (
                    <View style={styles.rateLabelRow}>
                      <Text style={styles.labelRate} numberOfLines={1}>{row.label}</Text>
                      <Ionicons name="chevron-up" size={12} color="#6B7280" />
                    </View>
                  )}
                  {row.kind === 'price' && (
                    <Text style={styles.labelPrice}>{row.label}</Text>
                  )}
                  {row.kind === 'channel' && (
                    <View style={styles.channelLabelRow}>
                      <Text style={styles.labelChannel} numberOfLines={1}>{row.label}</Text>
                      {row.hasInfo && (
                        <Ionicons name="information-circle-outline" size={13} color="#F59E0B" />
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Horizontal data columns (synced with header) */}
            <ScrollView
              ref={bodyScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={onBodyScroll}
              style={{ height: TOTAL_H }}
            >
              {DATES.map((date, colIdx) => (
                <View key={date.date} style={{ width: CELL_W }}>
                  {ROWS.map((row) => (
                    <View
                      key={row.id}
                      style={[
                        styles.dataCell,
                        { height: row.h, width: CELL_W },
                        date.isToday && styles.dataCellToday,
                        row.kind === 'room' && styles.dataCellRoom,
                      ]}
                    >
                      <DataCell value={row.values[colIdx]} kind={row.kind} />
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>

          </View>
        </ScrollView>
      </View>

      {/* ── Bottom Tab Bar ── */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom || 12 }]}>
        {[
          { key:'home',  label:'Home',          icon:'home-outline',          active:false },
          { key:'dist',  label:'Distribution',  icon:'grid',                  active:true  },
          { key:'res',   label:'Reservations',  icon:'bookmark-outline',      active:false },
          { key:'notif', label:'Notifications', icon:'notifications-outline', active:false },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key} style={styles.tabItem} activeOpacity={0.7}
            onPress={() => {
              if (tab.key === 'home') navigation.popToTop();
              if (tab.key === 'res')  navigation.navigate('Reservations');
            }}
          >
            <Ionicons name={tab.icon as any} size={24} color={tab.active ? '#1D4ED8' : '#9CA3AF'} />
            <Text style={[styles.tabLabel, tab.active && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── DataCell ─────────────────────────────────────────────────────────────────

function DataCell({ value, kind }: { value: number; kind: RowKind }) {
  if (kind === 'room' || kind === 'rate') {
    if (value === 0) {
      return (
        <View style={styles.orangeCircle}>
          <Text style={styles.orangeCircleText}>0</Text>
        </View>
      );
    }
    return (
      <View style={styles.countBox}>
        <Text style={styles.countBoxText}>{value}</Text>
      </View>
    );
  }
  return <Text style={styles.plainValue}>{value}</Text>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 18, fontWeight: '700', color: '#111827' },
  topBarIcons: { flexDirection: 'row', gap: 4 },
  iconBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },

  filterBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 6,
  },
  ratesDropdown: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  ratesDropdownText: { fontSize: 13, color: '#374151' },
  bulkEditBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#1D4ED8', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  bulkEditText: { fontSize: 13, fontWeight: '600', color: 'white' },

  chipsRow: { flexGrow: 0 },
  chips: { paddingHorizontal: 16, paddingBottom: 6, gap: 6, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 12,
  },
  chipText: { fontSize: 12, color: '#374151' },

  grid: { flex: 1, borderTopWidth: 1, borderTopColor: '#E5E7EB' },

  dateHeaderRow: {
    flexDirection: 'row', backgroundColor: 'white',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  dateCell: { alignItems: 'center', paddingVertical: 8 },
  dateDayLabel: { fontSize: 11, fontWeight: '500', color: '#6B7280' },
  dateDateLabel: { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 2 },
  weekendText: { color: '#EF4444' },
  todayDateText: { color: '#1D4ED8' },
  todayBar: { width: 20, height: 2.5, backgroundColor: '#1D4ED8', borderRadius: 2, marginTop: 3 },

  labelCell: {
    justifyContent: 'center', paddingHorizontal: 10,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    backgroundColor: 'white',
  },
  labelCellRoom: { backgroundColor: '#FAFAFA' },
  labelRoom: { fontSize: 13, fontWeight: '700', color: '#111827' },
  rateLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  labelRate: { fontSize: 12, fontWeight: '500', color: '#374151', flex: 1 },
  labelPrice: { fontSize: 12, color: '#9CA3AF' },
  channelLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  labelChannel: { fontSize: 12, color: '#1D4ED8', fontWeight: '500', flex: 1 },

  dataCell: {
    justifyContent: 'center', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    borderRightWidth: 1, borderRightColor: '#F3F4F6',
  },
  dataCellToday: { backgroundColor: '#EFF6FF' },
  dataCellRoom: { backgroundColor: '#FAFAFA' },

  orangeCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center',
  },
  orangeCircleText: { fontSize: 13, fontWeight: '700', color: 'white' },
  countBox: {
    width: 32, height: 32, borderRadius: 6,
    borderWidth: 1.5, borderColor: '#D1D5DB',
    justifyContent: 'center', alignItems: 'center',
  },
  countBoxText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  plainValue: { fontSize: 13, color: '#374151' },

  tabBar: {
    flexDirection: 'row', backgroundColor: 'white',
    borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 2 },
  tabLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
  tabLabelActive: { color: '#1D4ED8' },
});
