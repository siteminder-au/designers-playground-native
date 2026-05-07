import React, { useState } from 'react';
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

const ORANGE       = '#ff6842';
const ORANGE_MED   = '#ffa078'; // LHPrimary/500
const ORANGE_DARK  = '#f87850'; // LHPrimary/300
const ORANGE_LIGHT = '#ffe2d7'; // LHPrimary/800
const RED_WEEKEND  = '#b81919';
const AMBER        = '#ffb74a';

// ── Placeholder data ──────────────────────────────────────────────────────────

type Demand = 'none' | 'low' | 'medium' | 'high';

const DEMAND_BG: Record<Demand, string> = {
  none:   '#fff',
  low:    ORANGE_LIGHT,
  medium: ORANGE_MED,
  high:   ORANGE_DARK,
};

const DEMAND_TEXT: Record<Demand, string> = {
  none:   '#484b4b',
  low:    '#333',
  medium: '#333',
  high:   '#fff',
};

interface PricingDay {
  date: number;
  day: string;
  isWeekend: boolean;
  demand: Demand;
  promoCount?: number;
}

const PRICING_DAYS: PricingDay[] = [
  { date: 15, day: 'FRI', isWeekend: false, demand: 'medium', promoCount: 2 },
  { date: 16, day: 'SAT', isWeekend: true,  demand: 'none' },
  { date: 17, day: 'SUN', isWeekend: true,  demand: 'none' },
  { date: 18, day: 'MON', isWeekend: false, demand: 'none' },
  { date: 19, day: 'TUE', isWeekend: false, demand: 'low',  promoCount: 2 },
  { date: 20, day: 'WED', isWeekend: false, demand: 'high', promoCount: 2 },
  { date: 21, day: 'THU', isWeekend: false, demand: 'high', promoCount: 2 },
  { date: 22, day: 'FRI', isWeekend: false, demand: 'none' },
  { date: 23, day: 'SAT', isWeekend: true,  demand: 'none' },
  { date: 24, day: 'SUN', isWeekend: true,  demand: 'none' },
  { date: 25, day: 'MON', isWeekend: false, demand: 'none' },
  { date: 26, day: 'TUE', isWeekend: false, demand: 'none' },
  { date: 27, day: 'WED', isWeekend: false, demand: 'none' },
  { date: 28, day: 'THU', isWeekend: false, demand: 'none' },
  { date: 29, day: 'FRI', isWeekend: false, demand: 'none' },
];

interface AvailDay {
  date: number;
  day: string;
  isWeekend: boolean;
  available: number;
}

const AVAIL_DAYS: AvailDay[] = [
  { date: 15, day: 'FRI', isWeekend: false, available: 0  },
  { date: 16, day: 'SAT', isWeekend: true,  available: 2  },
  { date: 17, day: 'SUN', isWeekend: true,  available: 4  },
  { date: 18, day: 'MON', isWeekend: false, available: 0  },
  { date: 19, day: 'TUE', isWeekend: false, available: 4  },
  { date: 20, day: 'WED', isWeekend: false, available: 0  },
  { date: 21, day: 'THU', isWeekend: false, available: 2  },
  { date: 22, day: 'FRI', isWeekend: false, available: 0  },
  { date: 23, day: 'SAT', isWeekend: true,  available: 0  },
  { date: 24, day: 'SUN', isWeekend: true,  available: 14 },
  { date: 25, day: 'MON', isWeekend: false, available: 12 },
  { date: 26, day: 'TUE', isWeekend: false, available: 11 },
  { date: 27, day: 'WED', isWeekend: false, available: 2  },
];

const BAR_DATA = [
  { label: '27', h: 23  },
  { label: '28', h: 71  },
  { label: '29', h: 105 },
  { label: '30', h: 55  },
  { label: '01', h: 93  },
  { label: '02', h: 37  },
  { label: '03', h: 78  },
];
const BAR_MAX_H = 105; // tallest bar in data

const CHANNELS = [
  { name: 'Booking.com', count: 57, iconBg: '#003580', initial: 'B' },
  { name: 'Expedia.com', count: 48, iconBg: '#f8a100', initial: 'E' },
  { name: 'Agoda.com',   count: 36, iconBg: '#cc0d35', initial: 'A' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function PricingCell({ item }: { item: PricingDay }) {
  const bg        = DEMAND_BG[item.demand];
  const textColor = DEMAND_TEXT[item.demand];
  const dayColor  = item.isWeekend ? RED_WEEKEND : textColor;
  const dayWeight = item.isWeekend ? '700' : '400';

  return (
    <View style={[styles.pricingCell, { backgroundColor: bg }]}>
      <Text style={[styles.cellDayName, { color: dayColor, fontWeight: dayWeight }]}>
        {item.day}
      </Text>
      <Text style={[styles.cellDayNum, { color: textColor }]}>{item.date}</Text>
      {item.promoCount !== undefined && (
        <View style={styles.promoBadge}>
          <MaterialCommunityIcons name="bullhorn-outline" size={7} color="#484b4b" />
          <Text style={styles.promoBadgeText}>{item.promoCount}</Text>
        </View>
      )}
    </View>
  );
}

function AvailCell({ item }: { item: AvailDay }) {
  const dayColor  = item.isWeekend ? RED_WEEKEND : '#484b4b';
  const dayWeight = item.isWeekend ? '700' : '400';
  const badgeBg   = item.available === 0 ? AMBER : '#f6f6f6';

  return (
    <View style={styles.availCell}>
      <Text style={[styles.cellDayName, { color: dayColor, fontWeight: dayWeight }]}>
        {item.day}
      </Text>
      <Text style={[styles.cellDayNum, { color: '#484b4b' }]}>{item.date}</Text>
      <View style={[styles.availBadge, { backgroundColor: badgeBg }]}>
        <Text style={styles.availBadgeNum}>{item.available}</Text>
      </View>
    </View>
  );
}

function WidgetCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function CardHeader({
  title,
  linkLabel,
  onLink,
}: {
  title: string;
  linkLabel?: string;
  onLink?: () => void;
}) {
  return (
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>{title}</Text>
      {linkLabel && (
        <TouchableOpacity onPress={onLink}>
          <Text style={styles.cardLink}>{linkLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [perfTab, setPerfTab] = useState<'rooms' | 'revenue'>('rooms');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Gradient top section ── */}
        <View style={styles.topSection}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="settings-outline" size={22} color="#484b4b" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.hotelPill} activeOpacity={0.7}>
              <MaterialIcons name="hotel" size={14} color="#484b4b" style={{ marginRight: 6 }} />
              <Text style={styles.hotelName} numberOfLines={1}>The Eco Fern Ecotel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color="#484b4b" />
            </TouchableOpacity>
          </View>

          {/* "Today" title row */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Today</Text>
            <TouchableOpacity>
              <Text style={styles.sectionLink}>View reservations</Text>
            </TouchableOpacity>
          </View>

          {/* Today stats card */}
          <View style={styles.todayCard}>
            {/* Top row: Check Ins | Check Outs | Stay Throughs */}
            <View style={styles.todayTopRow}>
              <View style={styles.todayStat}>
                <Text style={styles.todayStatLabel}>Check Ins</Text>
                <Text style={styles.todayStatNum}>21</Text>
              </View>
              <View style={styles.todayStat}>
                <Text style={styles.todayStatLabel}>Check Outs</Text>
                <Text style={styles.todayStatNum}>14</Text>
              </View>
              <View style={styles.todayStat}>
                <Text style={styles.todayStatLabel}>Stay Throughs</Text>
                <Text style={styles.todayStatNum}>09</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.todayDivider} />

            {/* Bottom row: Cancellations | New Bookings */}
            <View style={styles.todayBottomRow}>
              <View style={styles.todayBottomHalf}>
                <Text style={styles.todayBottomNum}>0</Text>
                <Text style={styles.todayBottomLabel}>Cancellations</Text>
              </View>
              <View style={styles.todayVertDivider} />
              <View style={[styles.todayBottomHalf, { paddingLeft: 16 }]}>
                <Text style={styles.todayBottomNum}>4</Text>
                <Text style={styles.todayBottomLabel}>New Bookings</Text>
              </View>
            </View>
          </View>

        </View>

        {/* ── Widget cards ── */}
        <View style={styles.cardsSection}>

          {/* Dynamic Pricing */}
          <WidgetCard>
            <CardHeader title="Dynamic pricing" linkLabel="View calendar" />
            <Text style={styles.cardSubtitle}>15 Apr 2026 – 29 Apr 2026</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cellRow}
              style={{ marginTop: 12 }}
            >
              {PRICING_DAYS.map((item, i) => <PricingCell key={i} item={item} />)}
            </ScrollView>
          </WidgetCard>

          {/* Available Rooms */}
          <WidgetCard>
            <CardHeader title="Available rooms" linkLabel="View inventory" />
            <Text style={styles.cardSubtitle}>15 Apr 2026 – 29 Apr 2026</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cellRow}
              style={{ marginTop: 12 }}
            >
              {AVAIL_DAYS.map((item, i) => <AvailCell key={i} item={item} />)}
            </ScrollView>
          </WidgetCard>

          {/* Performance */}
          <WidgetCard>
            <CardHeader title="Performance" />

            {/* Segmented control */}
            <View style={styles.segmented}>
              <TouchableOpacity
                style={[styles.segBtn, perfTab === 'rooms' && styles.segBtnActive]}
                onPress={() => setPerfTab('rooms')}
              >
                <Text style={[styles.segBtnText, perfTab === 'rooms' && styles.segBtnTextActive]}>
                  Rooms Sold
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segBtn, perfTab === 'revenue' && styles.segBtnActive]}
                onPress={() => setPerfTab('revenue')}
              >
                <Text style={[styles.segBtnText, perfTab === 'revenue' && styles.segBtnTextActive]}>
                  Revenue
                </Text>
              </TouchableOpacity>
            </View>

            {/* Average stat */}
            <Text style={styles.perfAvgLabel}>AVERAGE</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 }}>
              <Text style={styles.perfAvgNum}>141</Text>
              <Text style={styles.perfAvgUnit}> rooms</Text>
            </View>
            <Text style={[styles.cardSubtitle, { marginBottom: 16 }]}>
              27 Mar 2026 – 03 Apr 2026
            </Text>

            {/* Bar chart */}
            <View style={styles.barChartWrap}>
              {/* Y-axis */}
              <View style={styles.barYAxis}>
                {['750', '500', '250', '0'].map(v => (
                  <Text key={v} style={styles.barYLabel}>{v}</Text>
                ))}
              </View>
              {/* Bars + x-labels */}
              <View style={{ flex: 1 }}>
                {/* Horizontal grid lines */}
                <View style={styles.barGrid} pointerEvents="none">
                  {[0, 1, 2, 3].map(i => (
                    <View key={i} style={[styles.barGridLine, { top: `${(i / 3) * 100}%` }]} />
                  ))}
                </View>
                {/* Bar columns */}
                <View style={styles.barsRow}>
                  {BAR_DATA.map((b, i) => (
                    <View key={i} style={styles.barCol}>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { height: Math.round((b.h / BAR_MAX_H) * 120) },
                          ]}
                        />
                      </View>
                      <Text style={styles.barXLabel}>{b.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Channel Breakdown */}
            <Text style={styles.channelSectionTitle}>Channel Breakdown</Text>
            {CHANNELS.map((ch, i) => (
              <View key={i}>
                <View style={styles.channelRow}>
                  <View style={[styles.channelIcon, { backgroundColor: ch.iconBg }]}>
                    <Text style={styles.channelInitial}>{ch.initial}</Text>
                  </View>
                  <Text style={styles.channelName}>{ch.name}</Text>
                  <Text style={styles.channelCount}>{ch.count}</Text>
                </View>
                <View style={styles.channelBarTrack}>
                  <View
                    style={[
                      styles.channelBarFill,
                      { width: `${Math.round((ch.count / 57) * 100)}%` },
                    ]}
                  />
                </View>
                {i < CHANNELS.length - 1 && <View style={styles.channelDivider} />}
              </View>
            ))}
          </WidgetCard>

          <View style={{ height: 32 }} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffccb7' },

  // ── Top gradient section
  topSection: {
    backgroundColor: '#ffd0ba',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 14,
    flex: 1,
    marginHorizontal: 8,
    justifyContent: 'center',
  },
  hotelName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },

  // "Today" title row
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'ValueSerifTrial-Medium',
    color: '#333',
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },

  // Today card
  todayCard: {
    backgroundColor: 'rgba(140, 50, 0, 0.14)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  todayTopRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  todayStat: { flex: 1 },
  todayStatLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
    marginBottom: 3,
  },
  todayStatNum: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    lineHeight: 34,
  },
  todayDivider: {
    height: 1,
    backgroundColor: 'rgba(140, 50, 0, 0.2)',
    marginBottom: 12,
  },
  todayBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayBottomHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todayBottomNum: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  todayBottomLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
  },
  todayVertDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(140, 50, 0, 0.2)',
    marginRight: 16,
  },

  // Cards section
  cardsSection: {
    backgroundColor: '#f2f3f3',
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Widget card
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#484b4b',
  },
  cardLink: {
    fontSize: 14,
    color: ORANGE,
    fontWeight: '500',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#9ba0a0',
    marginBottom: 4,
  },

  // Day cell row
  cellRow: {
    flexDirection: 'row',
    gap: 7,
    paddingRight: 4,
  },

  // Pricing cell
  pricingCell: {
    width: 46,
    height: 77,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e8e8',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
    gap: 2,
  },
  cellDayName: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '400',
  },
  cellDayNum: {
    fontSize: 16,
    lineHeight: 21,
  },
  promoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(176,178,182,0.36)',
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 2,
    marginTop: 4,
  },
  promoBadgeText: {
    fontSize: 10,
    color: '#484b4b',
  },

  // Available rooms cell
  availCell: {
    width: 46,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e8e8',
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    gap: 2,
  },
  availBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  availBadgeNum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },

  // Segmented control
  segmented: {
    flexDirection: 'row',
    backgroundColor: 'rgba(118,118,128,0.12)',
    borderRadius: 9,
    padding: 2,
    marginTop: 12,
    marginBottom: 16,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 7,
    alignItems: 'center',
  },
  segBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  segBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    letterSpacing: -0.08,
  },
  segBtnTextActive: {
    fontWeight: '600',
  },

  // Performance stats
  perfAvgLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ba0a0',
    letterSpacing: 0.5,
  },
  perfAvgNum: {
    fontSize: 28,
    fontWeight: '700',
    color: '#484b4b',
  },
  perfAvgUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ba0a0',
  },

  // Bar chart
  barChartWrap: {
    flexDirection: 'row',
    height: 156,
    marginBottom: 20,
    backgroundColor: '#f5f7fa',
    borderRadius: 4,
    paddingVertical: 8,
    paddingRight: 8,
  },
  barYAxis: {
    width: 36,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 6,
    paddingVertical: 2,
  },
  barYLabel: {
    fontSize: 11,
    color: '#ccd1d1',
  },
  barGrid: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 20,
  },
  barGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#e5e8e8',
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    flex: 1,
    width: '70%',
    justifyContent: 'flex-end',
  },
  barFill: {
    backgroundColor: ORANGE,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    width: '100%',
  },
  barXLabel: {
    fontSize: 10,
    color: '#ccd1d1',
    marginTop: 4,
    height: 14,
  },

  // Channel breakdown
  channelSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#484b4b',
    marginBottom: 14,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  channelIcon: {
    width: 30,
    height: 30,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#f2f3f3',
  },
  channelInitial: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  channelName: {
    flex: 1,
    fontSize: 16,
    color: '#484b4b',
    letterSpacing: -0.32,
  },
  channelCount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#484b4b',
  },
  channelBarTrack: {
    height: 5,
    backgroundColor: '#f2f3f3',
    borderRadius: 10,
    marginBottom: 8,
    marginLeft: 40,
  },
  channelBarFill: {
    height: '100%',
    backgroundColor: ORANGE,
    borderRadius: 10,
  },
  channelDivider: {
    height: 1,
    backgroundColor: '#e5e8e8',
    marginBottom: 8,
    marginLeft: 40,
  },
});
