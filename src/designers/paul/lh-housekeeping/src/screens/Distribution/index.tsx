import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

// ── Tokens ────────────────────────────────────────────────────────────────────

const ORANGE      = '#ff6842';
const RED_WEEKEND = '#d83f00';
const GROUP_BG    = '#e6ebf2';
const WEEKEND_BG  = '#ffede3';
const AVAIL_TEXT  = '#6d7272';

const LEFT_COL_W  = 144;
const DATE_COL_W  = 49;
const HEADER_H    = 57;
const ROW_H       = 56;

// ── Placeholder data ──────────────────────────────────────────────────────────

interface RatePlan {
  name: string;
  price: number;
}

interface RoomSection {
  type: string;
  availability: number;
  rates: RatePlan[];
}

const ROOM_SECTIONS: RoomSection[] = [
  {
    type: 'Double Room',
    availability: 5,
    rates: [
      { name: 'Standard Rate',   price: 240 },
      { name: 'Bed & Breakfast', price: 280 },
      { name: 'Non Refundable',  price: 200 },
    ],
  },
  {
    type: 'Standard Twin',
    availability: 3,
    rates: [
      { name: 'Standard Rate',   price: 180 },
      { name: 'Bed & Breakfast', price: 210 },
      { name: 'Non Refundable',  price: 155 },
    ],
  },
  {
    type: 'Budget Studio',
    availability: 2,
    rates: [
      { name: 'Standard Rate',   price: 320 },
      { name: 'Bed & Breakfast', price: 365 },
      { name: 'Non Refundable',  price: 290 },
    ],
  },
  {
    type: 'Bed in 10-Bed Dorm',
    availability: 4,
    rates: [
      { name: 'Standard Rate',   price: 55 },
      { name: 'Non Refundable',  price: 45 },
    ],
  },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface CalDay {
  date: number;
  dayName: string;
  isWeekend: boolean;
  isToday: boolean;
  fullDate: Date;
}

function buildDays(start: Date, count: number): CalDay[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      date:      d.getDate(),
      dayName:   DAY_NAMES[d.getDay()].toUpperCase(),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      isToday:   i === 0,
      fullDate:  d,
    };
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DateCell({ day, isSelected }: { day: CalDay; isSelected: boolean }) {
  const nameColor   = day.isWeekend ? RED_WEEKEND : '#484b4b';
  const nameWeight  = day.isWeekend ? '700' : '400';
  const numWeight   = isSelected ? '700' : '400';
  return (
    <View style={[styles.dateCell, isSelected && styles.dateCellSelected]}>
      <Text style={[styles.dateDayName, { color: nameColor, fontWeight: nameWeight }]}>
        {day.dayName}
      </Text>
      <Text style={[styles.dateDayNum, { fontWeight: numWeight }]}>{day.date}</Text>
      {isSelected && <View style={styles.dateUnderline} />}
    </View>
  );
}

function AvailCell({ count, isFirst }: { count: number; isFirst: boolean }) {
  return (
    <View style={[styles.dataCell, styles.availCell, !isFirst && styles.cellBorderLeft]}>
      <Text style={styles.availText}>{count}</Text>
    </View>
  );
}

function RateCell({
  price,
  isWeekend,
  isFirst,
}: {
  price: number;
  isWeekend: boolean;
  isFirst: boolean;
}) {
  return (
    <View style={[
      styles.dataCell,
      !isFirst && styles.cellBorderLeft,
      isWeekend && { backgroundColor: WEEKEND_BG },
    ]}>
      <Text style={styles.rateText}>{price}</Text>
    </View>
  );
}

function FilterChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <TouchableOpacity style={styles.filterChip} activeOpacity={0.7}>
      {icon}
      <Text style={styles.filterChipText}>{label}</Text>
      <Ionicons name="chevron-down" size={11} color="#333" style={{ marginLeft: 2 }} />
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function DistributionScreen() {
  const today   = new Date();
  const days    = buildDays(today, 14);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const headerDate = `${today.getDate()} ${MONTH_LONG[today.getMonth()]}, ${today.getFullYear()}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.datePicker} activeOpacity={0.7}>
            <Text style={styles.headerDate}>{headerDate}</Text>
            <Ionicons name="chevron-down" size={16} color="#333" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="calendar-outline" size={22} color="#484b4b" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="help-circle-outline" size={22} color="#484b4b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Controls row ── */}
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.ratesDropdown} activeOpacity={0.7}>
            <Text style={styles.ratesDropdownText} numberOfLines={1}>
              All rates &amp; availabilities
            </Text>
            <Ionicons name="chevron-down" size={12} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bulkBtn} activeOpacity={0.8}>
            <Ionicons name="flash" size={14} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.bulkBtnText}>Bulk update</Text>
          </TouchableOpacity>
        </View>

        {/* ── Filter chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
          style={styles.chipsScroll}
        >
          <FilterChip
            icon={<MaterialIcons name="bed" size={14} color="#333" style={{ marginRight: 6 }} />}
            label="Room types"
          />
          <FilterChip
            icon={<Ionicons name="pricetag-outline" size={14} color="#333" style={{ marginRight: 6 }} />}
            label="Rate plans"
          />
          <FilterChip
            icon={<MaterialCommunityIcons name="television-play" size={14} color="#333" style={{ marginRight: 6 }} />}
            label="Channels"
          />
        </ScrollView>

        {/* ── Grid ── */}
        <View style={styles.grid}>

          {/* Left frozen column */}
          <View style={styles.leftCol}>
            {/* Top-left header cell */}
            <View style={[styles.leftHeaderCell, { height: HEADER_H }]}>
              <Text style={styles.channelLabel}>Channel</Text>
            </View>

            {/* Room type sections */}
            {ROOM_SECTIONS.map((section, si) => (
              <View key={si}>
                {/* Group header row */}
                <View style={[styles.leftGroupRow, { height: ROW_H }]}>
                  <Text style={styles.groupLabel} numberOfLines={1}>{section.type}</Text>
                </View>
                {/* Rate plan label rows */}
                {section.rates.map((rate, ri) => (
                  <View key={ri} style={[styles.leftRateRow, { height: ROW_H }]}>
                    <Text style={styles.rateLabel} numberOfLines={2}>
                      {section.type} – {rate.name}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* Scrollable date columns */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
            bounces={false}
          >
            <View>
              {/* Date header row */}
              <View style={[styles.dateHeaderRow, { height: HEADER_H }]}>
                {days.map((day, i) => (
                  <TouchableOpacity key={i} onPress={() => setSelectedIdx(i)} activeOpacity={0.7}>
                    <DateCell day={day} isSelected={i === selectedIdx} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Room type sections */}
              {ROOM_SECTIONS.map((section, si) => (
                <View key={si}>
                  {/* Group availability row */}
                  <View style={[styles.dataRow, { backgroundColor: GROUP_BG, height: ROW_H }]}>
                    {days.map((_, i) => (
                      <AvailCell key={i} count={section.availability} isFirst={i === 0} />
                    ))}
                  </View>
                  {/* Rate price rows */}
                  {section.rates.map((rate, ri) => (
                    <View key={ri} style={[styles.dataRow, { height: ROW_H }]}>
                      {days.map((day, i) => (
                        <RateCell
                          key={i}
                          price={rate.price}
                          isWeekend={day.isWeekend}
                          isFirst={i === 0}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>

        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  scroll:   { flex: 1, backgroundColor: '#fff' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerDate: {
    fontSize: 20,
    fontFamily: 'ValueSerifTrial-Medium',
    color: '#333',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Controls row
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  ratesDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#c6ceda',
    borderRadius: 4,
    height: 32,
    paddingHorizontal: 8,
    width: 208,
  },
  ratesDropdownText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginRight: 4,
    letterSpacing: -0.2,
  },
  bulkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ORANGE,
    borderRadius: 4,
    height: 32,
    paddingHorizontal: 14,
  },
  bulkBtnText: {
    fontSize: 14,
    color: '#fff',
    letterSpacing: -0.2,
  },

  // Filter chips
  chipsScroll:  { flexGrow: 0, marginBottom: 4 },
  chipsContent: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccd1d1',
    backgroundColor: '#fff',
  },
  filterChipText: {
    fontSize: 14,
    color: '#333',
  },

  // Grid wrapper
  grid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e8e8',
  },

  // Left frozen column
  leftCol: {
    width: LEFT_COL_W,
    borderRightWidth: 1,
    borderRightColor: '#e5e8e8',
  },
  leftHeaderCell: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e8e8',
  },
  channelLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  leftGroupRow: {
    backgroundColor: GROUP_BG,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d8dde6',
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  leftRateRow: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e8e8',
  },
  rateLabel: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },

  // Date header row
  dateHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e8e8',
  },

  // Date cell
  dateCell: {
    width: DATE_COL_W,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 6,
    borderLeftWidth: 1,
    borderLeftColor: '#e5e8e8',
    position: 'relative',
  },
  dateCellSelected: {
    // no bg change, just underline
  },
  dateDayName: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: '#484b4b',
    marginBottom: 2,
  },
  dateDayNum: {
    fontSize: 16,
    color: '#484b4b',
    lineHeight: 22,
  },
  dateUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: ORANGE,
  },

  // Data rows
  dataRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e8e8',
  },
  dataCell: {
    width: DATE_COL_W,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: '#e5e8e8',
  },

  // Availability cell
  availCell: {
    backgroundColor: 'transparent',
  },
  availText: {
    fontSize: 14,
    fontWeight: '700',
    color: AVAIL_TEXT,
  },

  // Rate cell
  rateText: {
    fontSize: 14,
    color: '#333',
  },
});
