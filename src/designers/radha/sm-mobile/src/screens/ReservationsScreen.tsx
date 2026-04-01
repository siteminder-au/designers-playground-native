import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Reservations'>;

// ─── Types ────────────────────────────────────────────────────────────────────

type ChannelKey  = 'booking' | 'airbnb' | 'agoda' | 'direct';
type CategoryKey = 'arrival' | 'departure' | 'stay' | 'cancellation' | 'new_booking';

interface Booking {
  id: string;
  guestName: string;
  dateRange: string;
  roomType: string;
  channel: ChannelKey;
  category: CategoryKey;
  image: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const DATES = [
  { day: 'SUN', date: 27, isToday: false },
  { day: 'MON', date: 28, isToday: false },
  { day: 'TUE', date: 29, isToday: false },
  { day: 'WED', date: 30, isToday: false },
  { day: 'THU', date: 30, isToday: true  },
  { day: 'FRI', date: 1,  isToday: false },
  { day: 'SAT', date: 2,  isToday: false },
  { day: 'SUN', date: 3,  isToday: false },
];

const ALL_BOOKINGS: Booking[] = [
  // Arrivals
  { id:'a1', category:'arrival',      guestName:'James Peter Stanbury-Cooper', dateRange:'Today → 18 Apr, 2020 (3 nights)',       roomType:'2 x Family room', channel:'booking', image:'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=200&q=80' },
  { id:'a2', category:'arrival',      guestName:'Rachelle dc Lim',             dateRange:'18 Apr 2020 → 21 Apr 2020 (3 nights)', roomType:'2 x Family room', channel:'airbnb',  image:'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=200&q=80' },
  { id:'a3', category:'arrival',      guestName:'Rhodora Mhae Zaragoza',       dateRange:'18 Apr 2020 → 21 Apr 2020 (3 nights)', roomType:'2 x Family room', channel:'agoda',   image:'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=200&q=80' },
  // Departures
  { id:'d1', category:'departure',    guestName:'Mark Edison Cua',             dateRange:'15 Apr 2020 → 18 Apr 2020 (3 nights)', roomType:'2 x Family room', channel:'direct',  image:'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&q=80' },
  { id:'d2', category:'departure',    guestName:'Sofia Reyes Torres',          dateRange:'16 Apr 2020 → 18 Apr 2020 (2 nights)', roomType:'1 x Double room', channel:'booking', image:'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=200&q=80' },
  { id:'d3', category:'departure',    guestName:'Liam Chen',                   dateRange:'17 Apr 2020 → 18 Apr 2020 (1 night)',  roomType:'1 x Suite',       channel:'airbnb',  image:'https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=200&q=80' },
  // Stays
  { id:'s1', category:'stay',         guestName:'Anna Kowalski',               dateRange:'14 Apr 2020 → 20 Apr 2020 (6 nights)', roomType:'1 x Deluxe room', channel:'booking', image:'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=200&q=80' },
  { id:'s2', category:'stay',         guestName:'Marco Rossi',                 dateRange:'16 Apr 2020 → 22 Apr 2020 (6 nights)', roomType:'2 x Twin room',   channel:'agoda',   image:'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=200&q=80' },
  { id:'s3', category:'stay',         guestName:'Yuki Tanaka',                 dateRange:'12 Apr 2020 → 19 Apr 2020 (7 nights)', roomType:'1 x Suite',       channel:'direct',  image:'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=200&q=80' },
  // Cancellations
  { id:'c1', category:'cancellation', guestName:'David Okafor',                dateRange:'18 Apr 2020 → 21 Apr 2020 (3 nights)', roomType:'1 x Single room', channel:'airbnb',  image:'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=200&q=80' },
  // New Bookings
  { id:'n1', category:'new_booking',  guestName:'Priya Sharma',                dateRange:'25 Apr 2020 → 28 Apr 2020 (3 nights)', roomType:'1 x Double room', channel:'booking', image:'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&q=80' },
  { id:'n2', category:'new_booking',  guestName:'Carlos Mendes',               dateRange:'30 Apr 2020 → 2 May 2020 (2 nights)',  roomType:'1 x Family room', channel:'agoda',   image:'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=200&q=80' },
  { id:'n3', category:'new_booking',  guestName:'Emma Wilson',                 dateRange:'1 May 2020 → 5 May 2020 (4 nights)',   roomType:'2 x Twin room',   channel:'direct',  image:'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=200&q=80' },
];

const FILTERS: { key: CategoryKey; label: string }[] = [
  { key: 'arrival',      label: 'Arrivals'      },
  { key: 'departure',    label: 'Departures'    },
  { key: 'stay',         label: 'Stays'         },
  { key: 'cancellation', label: 'Cancellations' },
  { key: 'new_booking',  label: 'New Bookings'  },
];

const SECTION_TITLES: Record<CategoryKey, string> = {
  arrival:      'Arrivals',
  departure:    'Departures',
  stay:         'Stays',
  cancellation: 'Cancellations',
  new_booking:  'New Bookings',
};

// ─── Channel Badge ─────────────────────────────────────────────────────────────

const CHANNEL_CONFIG: Record<ChannelKey, { label: string; bg: string }> = {
  booking: { label: 'B.', bg: '#003580' },
  airbnb:  { label: 'A',  bg: '#FF5A5F' },
  agoda:   { label: 'AG', bg: '#5392FF' },
  direct:  { label: 'D',  bg: '#16A34A' },
};

function ChannelBadge({ channel }: { channel: ChannelKey }) {
  const cfg = CHANNEL_CONFIG[channel];
  return (
    <View style={[styles.channelBadge, { backgroundColor: cfg.bg }]}>
      <Text style={styles.channelBadgeText}>{cfg.label}</Text>
    </View>
  );
}

// ─── Booking Card ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<CategoryKey, string> = {
  arrival:      '#16A34A',
  departure:    '#1D4ED8',
  stay:         '#7C3AED',
  cancellation: '#EF4444',
  new_booking:  '#D97706',
};

const STATUS_LABELS: Record<CategoryKey, string> = {
  arrival:      'BOOKED',
  departure:    'BOOKED',
  stay:         'IN-HOUSE',
  cancellation: 'CANCELLED',
  new_booking:  'NEW',
};

function BookingCard({ item }: { item: Booking }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={styles.cardTopRow}>
          <Text style={[styles.cardStatus, { color: STATUS_COLORS[item.category] }]}>
            {STATUS_LABELS[item.category]}
          </Text>
          <ChannelBadge channel={item.channel} />
        </View>
        <Text style={styles.cardName} numberOfLines={1}>{item.guestName}</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="calendar-outline" size={12} color="#6B7280" />
          <Text style={styles.cardMetaText}>{item.dateRange}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Ionicons name="bed-outline" size={12} color="#6B7280" />
          <Text style={styles.cardMetaText}>{item.roomType}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReservationsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [selectedFilters, setSelectedFilters] = useState<Set<CategoryKey>>(new Set());

  function toggleFilter(key: CategoryKey) {
    setSelectedFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  }

  // Count per category
  const counts = useMemo(() => {
    const map: Record<CategoryKey, number> = {
      arrival: 0, departure: 0, stay: 0, cancellation: 0, new_booking: 0,
    };
    ALL_BOOKINGS.forEach((b) => { map[b.category]++; });
    return map;
  }, []);

  // Sections to display: if no filter selected show all, else only selected
  const activeSections = useMemo<CategoryKey[]>(() => {
    const order: CategoryKey[] = ['arrival', 'departure', 'stay', 'cancellation', 'new_booking'];
    if (selectedFilters.size === 0) return order;
    return order.filter((k) => selectedFilters.has(k));
  }, [selectedFilters]);

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
            <Ionicons name="options-outline" size={22} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="calendar-outline" size={22} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="search-outline" size={22} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Date strip ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateStripWrap} contentContainerStyle={styles.dateStrip}>
        {DATES.map((d, i) => (
          <TouchableOpacity key={i} style={[styles.dateItem, d.isToday && styles.dateItemToday]} activeOpacity={0.7}>
            <Text style={[styles.dateDayLabel, d.isToday && styles.dateTodayText]}>{d.day}</Text>
            <Text style={[styles.dateDateLabel, d.isToday && styles.dateTodayText]}>{d.date}</Text>
            {d.isToday && <View style={styles.todayUnderline} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Filter chips ── */}
      <View style={styles.filterRow}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map((f) => {
          const active = selectedFilters.has(f.key);
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              activeOpacity={0.7}
              onPress={() => toggleFilter(f.key)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {counts[f.key]} {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      </View>

      {/* ── Content ── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {activeSections.map((cat) => {
          const items = ALL_BOOKINGS.filter((b) => b.category === cat);
          if (items.length === 0) return null;
          return (
            <View key={cat}>
              <Text style={styles.sectionTitle}>{SECTION_TITLES[cat]}</Text>
              {items.map((item) => <BookingCard key={item.id} item={item} />)}
            </View>
          );
        })}
      </ScrollView>

      {/* ── Bottom Tab Bar ── */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom || 12 }]}>
        {[
          { key:'home',  label:'Home',          icon:'home-outline',          active:false },
          { key:'dist',  label:'Distribution',  icon:'grid-outline',          active:false },
          { key:'res',   label:'Reservations',  icon:'bookmark',              active:true  },
          { key:'notif', label:'Notifications', icon:'notifications-outline', active:false },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key} style={styles.tabItem} activeOpacity={0.7}
            onPress={() => {
              if (tab.key === 'home') navigation.popToTop();
              if (tab.key === 'dist') navigation.navigate('Distribution');
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'white',
  },
  dateRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText:    { fontSize: 18, fontWeight: '700', color: '#111827' },
  topBarIcons: { flexDirection: 'row', gap: 2 },
  iconBtn:     { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },

  dateStripWrap: { flexGrow: 0, backgroundColor: 'white' },
  dateStrip:     { paddingHorizontal: 8, paddingVertical: 8, gap: 0 },
  dateItem:      { width: 52, alignItems: 'center', paddingVertical: 6, borderRadius: 10 },
  dateItemToday: { backgroundColor: '#EFF6FF' },
  dateDayLabel:  { fontSize: 11, fontWeight: '500', color: '#6B7280' },
  dateDateLabel: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 2 },
  dateTodayText: { color: '#1D4ED8' },
  todayUnderline:{ width: 20, height: 2.5, backgroundColor: '#1D4ED8', borderRadius: 2, marginTop: 3 },

  filterRow:    { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', height: 52 },
  filterContent:{ paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row', alignItems: 'center' },
  filterChip: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 4,
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: 'white',
  },
  filterChipActive:    { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  filterChipText:      { fontSize: 13, color: '#374151', fontWeight: '500' },
  filterChipTextActive:{ color: 'white' },

  scroll: { padding: 16 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 8, marginBottom: 8 },

  card: {
    flexDirection: 'row', backgroundColor: 'white', borderRadius: 12,
    marginBottom: 10, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  cardImage:    { width: 88, alignSelf: 'stretch' },
  cardContent:  { flex: 1, padding: 12, gap: 4 },
  cardTopRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardStatus:   { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  cardName:     { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardMeta:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMetaText: { fontSize: 12, color: '#6B7280', flexShrink: 1 },

  channelBadge:     { width: 28, height: 28, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  channelBadgeText: { fontSize: 11, fontWeight: '800', color: 'white' },

  tabBar:        { flexDirection: 'row', backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8 },
  tabItem:       { flex: 1, alignItems: 'center', gap: 2 },
  tabLabel:      { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
  tabLabelActive:{ color: '#1D4ED8' },
});
