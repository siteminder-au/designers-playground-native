import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@apollo/client';
import { GET_TODAY_RESERVATIONS } from '../../apollo/queries';
import CleaningServicesSvg from '../../../assets/CleaningServices.svg';

const ORANGE = '#ff6842';
const GREEN = '#1b7b3e';
const RED = '#d11d1d';

type GuestStatus = 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT';
type FilterKey = 'ALL' | 'CHECK_INS' | 'CHECK_OUTS' | 'STAY_THROUGHS';

interface Reservation {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  guestStatus: GuestStatus;
  isUnallocated?: boolean;
  outstandingBalance?: number | null;
  paymentExpired?: boolean;
  roomDisplayName?: string | null;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function getWeekDays(baseDate: Date): Date[] {
  const days: Date[] = [];
  const start = new Date(baseDate);
  // Start from 3 days before selected to show a 7-day window centred around today
  start.setDate(baseDate.getDate() - 3);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatCardDates(checkIn: string, checkOut: string): string {
  const ci = new Date(checkIn + 'T12:00:00');
  const co = new Date(checkOut + 'T12:00:00');
  const nights = Math.round((co.getTime() - ci.getTime()) / 86400000);
  return `${ci.getDate()} ${MONTH_NAMES[ci.getMonth()]} → ${co.getDate()} ${MONTH_NAMES[co.getMonth()]} · ${nights} night${nights !== 1 ? 's' : ''}`;
}

function formatHeaderDate(d: Date): string {
  return `${d.getDate()} ${MONTH_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Room photo placeholder ────────────────────────────────────────────────────
// Seed-based picsum images — same room type always shows the same photo.

const ROOM_PHOTO_SEEDS: Record<string, number> = {
  'double room deluxe': 1040,
  'double room shack':  1060,
  'standard twin':      1082,
  'budget studio':      1084,
  'dorm':               1070,
};

function getRoomPhotoSeed(roomDisplayName: string | null | undefined): number {
  if (!roomDisplayName) return 1011;
  const lower = roomDisplayName.toLowerCase();
  for (const [key, seed] of Object.entries(ROOM_PHOTO_SEEDS)) {
    if (lower.includes(key)) return seed;
  }
  return 1011;
}

function RoomPhoto({ roomDisplayName }: { roomDisplayName: string | null | undefined }) {
  const seed = getRoomPhotoSeed(roomDisplayName);
  return (
    <Image
      source={{ uri: `https://picsum.photos/seed/${seed}/164/164` }}
      style={styles.guestPhoto}
      resizeMode="cover"
    />
  );
}

// ── Status label ──────────────────────────────────────────────────────────────

function StatusLabel({ status, isUnallocated }: { status: GuestStatus; isUnallocated?: boolean }) {
  if (isUnallocated) {
    return <Text style={[styles.statusLabel, { color: RED }]}>UNALLOCATED</Text>;
  }
  const config: Record<GuestStatus, { label: string; color: string }> = {
    CONFIRMED:   { label: 'CONFIRMED',   color: GREEN },
    CHECKED_IN:  { label: 'CHECKED IN',  color: GREEN },
    CHECKED_OUT: { label: 'CHECKED OUT', color: '#484b4b' },
  };
  const c = config[status];
  return <Text style={[styles.statusLabel, { color: c.color }]}>{c.label}</Text>;
}

// ── Reservation card ──────────────────────────────────────────────────────────

interface CardProps {
  res: Reservation;
  variant: 'check-in' | 'check-out' | 'stay-through';
}

function ReservationCard({ res, variant }: CardProps) {
  const hasProblem = !!(res.outstandingBalance || res.paymentExpired);
  const isUnallocated = !!res.isUnallocated;
  const borderColor = (hasProblem || isUnallocated) ? RED : '#e5e8e8';

  const nights = Math.round(
    (new Date(res.checkOut + 'T12:00:00').getTime() - new Date(res.checkIn + 'T12:00:00').getTime()) / 86400000
  );

  return (
    <View style={[styles.card, { borderColor }]}>
      {/* Top row: photo + info */}
      <View style={styles.cardTop}>
        <RoomPhoto roomDisplayName={res.roomDisplayName} />
        <View style={styles.cardInfo}>
          <StatusLabel status={res.guestStatus} isUnallocated={isUnallocated} />
          <Text style={styles.guestName} numberOfLines={1}>{res.guestName}</Text>
          {/* Dates row */}
          <View style={styles.cardMeta}>
            <Ionicons name="calendar-outline" size={12} color="#6b7280" style={{ marginRight: 4 }} />
            <Text style={styles.cardMetaText}>{formatCardDates(res.checkIn, res.checkOut)}</Text>
          </View>
          {/* Room row */}
          {res.roomDisplayName ? (
            <View style={styles.cardMeta}>
              <MaterialCommunityIcons name="door-open" size={12} color="#6b7280" style={{ marginRight: 4 }} />
              <Text style={styles.cardMetaText} numberOfLines={1}>{res.roomDisplayName}</Text>
            </View>
          ) : (
            <View style={styles.cardMeta}>
              <MaterialCommunityIcons name="door-open" size={12} color={RED} style={{ marginRight: 4 }} />
              <Text style={[styles.cardMetaText, { color: RED }]}>No room assigned</Text>
            </View>
          )}
          {/* Outstanding balance warning */}
          {res.outstandingBalance ? (
            <View style={styles.cardMeta}>
              <Ionicons name="alert-circle-outline" size={12} color={RED} style={{ marginRight: 4 }} />
              <Text style={[styles.cardMetaText, { color: RED }]}>
                AUD {res.outstandingBalance.toLocaleString('en-AU', { minimumFractionDigits: 2 })} outstanding
              </Text>
            </View>
          ) : null}
          {/* Payment expired warning */}
          {res.paymentExpired ? (
            <View style={styles.cardMeta}>
              <Ionicons name="alert-circle-outline" size={12} color={RED} style={{ marginRight: 4 }} />
              <Text style={[styles.cardMetaText, { color: RED }]}>Payment request expired</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* CTA buttons */}
      {variant === 'check-in' && (
        <View style={styles.btnRow}>
          {isUnallocated ? (
            <TouchableOpacity style={[styles.btn, styles.btnOutlined, { flex: 1 }]}>
              <Text style={styles.btnOutlinedText}>Assign room</Text>
            </TouchableOpacity>
          ) : hasProblem ? (
            <>
              <TouchableOpacity style={[styles.btn, styles.btnOutlined, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.btnOutlinedText}>Take payment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnGreen, { flex: 1 }]}>
                <Text style={styles.btnGreenText}>Check in</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={[styles.btn, styles.btnGreen, { flex: 1 }]}>
              <Text style={styles.btnGreenText}>Check in · {nights} night{nights !== 1 ? 's' : ''}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {variant === 'check-out' && (
        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.btn, styles.btnDark, { flex: 1 }]}>
            <Text style={styles.btnDarkText}>Check-out</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ReservationsScreen({ navigation }: { navigation: any }) {
  const todayDate = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(todayDate);
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL');
  const [showUnallocatedOnly, setShowUnallocatedOnly] = useState(false);

  const today = toDateStr(todayDate);
  const queryDate = toDateStr(selectedDate);

  const { data, loading, error } = useQuery(GET_TODAY_RESERVATIONS, {
    variables: { date: queryDate },
  });

  const checkingOut: Reservation[] = data?.todayReservations?.checkingOut ?? [];
  const checkingIn: Reservation[]  = data?.todayReservations?.checkingIn  ?? [];
  const checkedOut: Reservation[]  = data?.todayReservations?.checkedOut  ?? [];
  const inhouse: Reservation[]     = data?.todayReservations?.inhouse     ?? [];

  const unallocatedCount = checkingIn.filter(r => r.isUnallocated).length;

  // Build 7-day strip
  const baseDate = new Date(todayDate);
  baseDate.setDate(todayDate.getDate() + weekOffset * 7);
  const weekDays = getWeekDays(baseDate);

  // Filter chips
  const filters: { key: FilterKey; label: string }[] = [
    { key: 'CHECK_INS',     label: 'Check-ins' },
    { key: 'CHECK_OUTS',    label: 'Check-outs' },
    { key: 'STAY_THROUGHS', label: 'Stay-throughs' },
  ];

  const filteredCheckingIn = showUnallocatedOnly
    ? checkingIn.filter(r => r.isUnallocated)
    : checkingIn;
  const filteredCheckingOut = checkingOut;
  const filteredStayThroughs = [...checkedOut, ...inhouse];

  const showCheckIns     = activeFilter === 'ALL' || activeFilter === 'CHECK_INS';
  const showCheckOuts    = activeFilter === 'ALL' || activeFilter === 'CHECK_OUTS';
  const showStayThroughs = activeFilter === 'ALL' || activeFilter === 'STAY_THROUGHS';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.headerDateRow} activeOpacity={0.7}>
              <Text style={styles.headerDate}>{formatHeaderDate(selectedDate)}</Text>
              <Ionicons name="chevron-down" size={18} color="#111" style={{ marginLeft: 4, marginTop: 2 }} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={[styles.headerIconBtn, styles.headerIconBtnOrange]} onPress={() => navigation.navigate('Housekeeping')}>
              <CleaningServicesSvg width={32} height={32} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="options-outline" size={20} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="calendar-outline" size={20} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.headerIconBtn, styles.headerIconBtnOrange]}>
              <Ionicons name="add" size={20} color={ORANGE} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 7-day strip ── */}
        <View style={styles.weekStripWrapper}>
          <TouchableOpacity onPress={() => setWeekOffset(w => w - 1)} style={styles.weekArrow}>
            <Ionicons name="chevron-back" size={18} color="#484b4b" />
          </TouchableOpacity>
          <View style={styles.weekStrip}>
            {weekDays.map((day, i) => {
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, todayDate);
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.weekDay, isSelected && styles.weekDaySelected]}
                  onPress={() => setSelectedDate(new Date(day))}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.weekDayName, isSelected && styles.weekDayNameSelected]}>
                    {DAY_NAMES[day.getDay()]}
                  </Text>
                  <Text style={[styles.weekDayNum, isSelected && styles.weekDayNumSelected, isToday && !isSelected && styles.weekDayNumToday]}>
                    {day.getDate()}
                  </Text>
                  {isSelected && <View style={styles.weekDayUnderline} />}
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity onPress={() => setWeekOffset(w => w + 1)} style={styles.weekArrow}>
            <Ionicons name="chevron-forward" size={18} color="#484b4b" />
          </TouchableOpacity>
        </View>

        {/* ── Filter chips ── */}
        <View style={styles.filtersRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            {filters.map(f => {
              const isActive = activeFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setActiveFilter(isActive ? 'ALL' : f.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Unallocated alert banner ── */}
        {unallocatedCount > 0 && (showCheckIns) && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => setShowUnallocatedOnly(v => !v)}
            activeOpacity={0.8}
          >
            <Ionicons name="alert-circle-outline" size={16} color={RED} style={{ marginRight: 8 }} />
            <Text style={styles.alertText}>
              {unallocatedCount} unallocated reservation{unallocatedCount !== 1 ? 's' : ''}
            </Text>
            <View style={[styles.alertToggle, showUnallocatedOnly && styles.alertToggleOn]}>
              <View style={[styles.alertToggleThumb, showUnallocatedOnly && styles.alertToggleThumbOn]} />
            </View>
          </TouchableOpacity>
        )}

        {/* ── Content ── */}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={ORANGE} />
        ) : error ? (
          <Text style={styles.errorText}>Could not load reservations.</Text>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>

            {showCheckIns && filteredCheckingIn.length > 0 && (
              <Section title="Check-ins">
                {filteredCheckingIn.map(r => (
                  <ReservationCard key={r.id} res={r} variant="check-in" />
                ))}
              </Section>
            )}

            {showCheckOuts && filteredCheckingOut.length > 0 && (
              <Section title="Check-outs">
                {filteredCheckingOut.map(r => (
                  <ReservationCard key={r.id} res={r} variant="check-out" />
                ))}
              </Section>
            )}

            {showStayThroughs && filteredStayThroughs.length > 0 && (
              <Section title="Stay-throughs">
                {filteredStayThroughs.map(r => (
                  <ReservationCard key={r.id} res={r} variant="stay-through" />
                ))}
              </Section>
            )}

            {!filteredCheckingIn.length && !filteredCheckingOut.length && !filteredStayThroughs.length && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No reservations for this date.</Text>
              </View>
            )}

            <View style={{ height: 32 }} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#f2f3f3' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerLeft: { flex: 1 },
  headerLabel: {
    fontSize: 12,
    color: '#484b4b',
    fontWeight: '600',
    letterSpacing: 0.24,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerDateRow: { flexDirection: 'row', alignItems: 'center' },
  headerDate: {
    fontSize: 16,
    fontFamily: 'ValueSerifTrial-Medium',
    color: '#000',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  headerIconBtnOrange: {
    backgroundColor: '#fff5ee',
  },

  // Week strip
  weekStripWrapper: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e8e8',
  },
  weekArrow: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekStrip: {
    flex: 1,
    flexDirection: 'row',
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  weekDaySelected: {
    backgroundColor: '#fff5ee',
  },
  weekDayName: {
    fontSize: 11,
    color: '#484b4b',
    fontWeight: '400',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  weekDayNameSelected: {
    color: ORANGE,
    fontWeight: '600',
  },
  weekDayNum: {
    fontSize: 15,
    color: '#484b4b',
    fontWeight: '400',
  },
  weekDayNumSelected: {
    color: ORANGE,
    fontWeight: '700',
  },
  weekDayNumToday: {
    color: ORANGE,
  },
  weekDayUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: ORANGE,
  },

  // Filter chips
  filtersRow: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e8e8',
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccd1d1',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    borderColor: ORANGE,
    backgroundColor: '#fff5ee',
  },
  chipText: {
    fontSize: 14,
    color: '#484b4b',
    fontWeight: '400',
  },
  chipTextActive: {
    color: ORANGE,
    fontWeight: '600',
  },

  // Alert banner
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf1ed',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5cfc4',
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: RED,
    fontWeight: '500',
  },
  alertToggle: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ccd1d1',
    padding: 2,
    justifyContent: 'center',
  },
  alertToggleOn: {
    backgroundColor: ORANGE,
  },
  alertToggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
  },
  alertToggleThumbOn: {
    alignSelf: 'flex-end',
  },

  // Scroll content
  scrollContent: { paddingTop: 8, paddingBottom: 16 },

  // Section
  section: { marginTop: 8 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#e5e8e8',
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  guestPhoto: {
    width: 82,
    height: 82,
    borderRadius: 6,
    backgroundColor: '#f2f3f3',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212323',
    marginBottom: 5,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  cardMetaText: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },

  // Buttons
  btnRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  btn: {
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnGreen: { backgroundColor: GREEN },
  btnGreenText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  btnDark: { backgroundColor: '#333' },
  btnDarkText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  btnOutlined: {
    borderWidth: 1.5,
    borderColor: '#333',
    backgroundColor: '#fff',
  },
  btnOutlinedText: { color: '#333', fontSize: 14, fontWeight: '600' },

  // Empty state
  emptyState: { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyStateText: { fontSize: 14, color: '#9ca3af' },

  // Error
  errorText: { textAlign: 'center', color: 'red', marginTop: 40 },
});
