import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@apollo/client';
import { GET_TODAY_RESERVATIONS } from '../../apollo/queries';

const ORANGE = '#e8722a';
const GREEN = '#2d7d46';
const GRAY = '#6b7280';

type GuestStatus = 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT';
type FilterKey = 'ALL' | 'UNALLOCATED' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT';

interface Reservation {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  guestStatus: GuestStatus;
  isUnallocated: boolean;
  outstandingBalance: number | null;
  paymentExpired: boolean;
  roomDisplayName: string | null;
}

function formatDate(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return 'Today';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
}

function formatLongDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: GuestStatus }) {
  const config = {
    CONFIRMED:   { label: 'CONFIRMED',   color: ORANGE },
    CHECKED_IN:  { label: 'CHECKED IN',  color: GREEN },
    CHECKED_OUT: { label: 'CHECKED OUT', color: GRAY },
  }[status];
  return <Text style={[styles.statusBadge, { color: config.color }]}>{config.label}</Text>;
}

// ── Room row ──────────────────────────────────────────────────────────────────

function RoomRow({ name, orange }: { name: string; orange?: boolean }) {
  return (
    <View style={styles.roomRow}>
      <Ionicons name="bed-outline" size={14} color={orange ? ORANGE : '#6b7280'} style={{ marginRight: 6 }} />
      <Text style={[styles.roomName, orange && { color: ORANGE, fontWeight: '600' }]}>{name}</Text>
    </View>
  );
}

// ── Card: Checking out ────────────────────────────────────────────────────────

function CheckingOutCard({ res, today }: { res: Reservation; today: string }) {
  const nights = nightsBetween(res.checkIn, res.checkOut);
  return (
    <View style={styles.card}>
      <StatusBadge status={res.guestStatus} />
      <Text style={styles.guestName}>{res.guestName}</Text>
      <Text style={styles.dates}>
        {formatDate(res.checkIn, today)} → {formatDate(res.checkOut, today)}
      </Text>
      {res.roomDisplayName && <RoomRow name={res.roomDisplayName} />}
      <TouchableOpacity style={styles.btnDark}>
        <Text style={styles.btnDarkText}>Check-out {res.adults} guest{res.adults !== 1 ? 's' : ''}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Card: Checking in ─────────────────────────────────────────────────────────

function CheckingInCard({ res, today }: { res: Reservation; today: string }) {
  const nights = nightsBetween(res.checkIn, res.checkOut);
  const hasIssues = !!res.outstandingBalance || res.paymentExpired;
  const isUnallocated = res.isUnallocated;

  return (
    <View style={[styles.card, isUnallocated && styles.cardOrangeBorder]}>
      <StatusBadge status="CONFIRMED" />
      <Text style={styles.guestName}>{res.guestName}</Text>
      <Text style={styles.dates}>
        {formatDate(res.checkIn, today)} → {formatDate(res.checkOut, today)}
      </Text>

      {isUnallocated ? (
        <RoomRow name={`Unallocated (${res.roomDisplayName ?? 'Room type TBD'})`} orange />
      ) : (
        res.roomDisplayName && <RoomRow name={res.roomDisplayName} />
      )}

      {res.outstandingBalance && (
        <View style={styles.warningRow}>
          <Ionicons name="alert-circle-outline" size={14} color={ORANGE} style={{ marginRight: 4 }} />
          <Text style={styles.warningText}>
            AUD {res.outstandingBalance.toLocaleString('en-AU', { minimumFractionDigits: 2 })} outstanding
          </Text>
        </View>
      )}
      {res.paymentExpired && (
        <View style={styles.warningRow}>
          <Ionicons name="alert-circle-outline" size={14} color={ORANGE} style={{ marginRight: 4 }} />
          <Text style={styles.warningText}>Payment request expired</Text>
        </View>
      )}

      {isUnallocated ? (
        <TouchableOpacity style={styles.btnOutlined}>
          <Text style={styles.btnOutlinedText}>Assign room</Text>
        </TouchableOpacity>
      ) : hasIssues ? (
        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.btnOutlined, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.btnOutlinedText}>Take payment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnDark, { flex: 1 }]}>
            <Text style={styles.btnDarkText}>Check-in</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.btnGreen}>
          <Text style={styles.btnGreenText}>Check-in for {nights} night{nights !== 1 ? 's' : ''}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Card: Checked out / Inhouse ───────────────────────────────────────────────

function SimpleCard({ res, today }: { res: Reservation; today: string }) {
  return (
    <View style={styles.card}>
      <StatusBadge status={res.guestStatus} />
      <Text style={styles.guestName}>{res.guestName}</Text>
      <Text style={styles.dates}>
        {formatDate(res.checkIn, today)} → {formatDate(res.checkOut, today)}
      </Text>
      {res.roomDisplayName && <RoomRow name={res.roomDisplayName} />}
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

export default function ReservationsScreen() {
  const today = new Date().toISOString().split('T')[0];
  const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL');

  const { data, loading, error } = useQuery(GET_TODAY_RESERVATIONS, {
    variables: { date: today },
  });

  const counts = data?.todayReservations?.counts;
  const checkingOut: Reservation[] = data?.todayReservations?.checkingOut ?? [];
  const checkingIn: Reservation[]  = data?.todayReservations?.checkingIn  ?? [];
  const checkedOut: Reservation[]  = data?.todayReservations?.checkedOut  ?? [];
  const inhouse: Reservation[]     = data?.todayReservations?.inhouse     ?? [];

  const filters: { key: FilterKey; label: string; count?: number }[] = [
    { key: 'UNALLOCATED', label: 'Unallocated', count: counts?.unallocated },
    { key: 'CONFIRMED',   label: 'Confirmed',   count: counts?.confirmed },
    { key: 'CHECKED_IN',  label: 'Checked in',  count: counts?.checkedIn },
    { key: 'CHECKED_OUT', label: 'Checked out', count: counts?.checkedOut },
  ];

  const showCheckingOut = activeFilter === 'ALL' || activeFilter === 'CHECKED_IN';
  const showCheckingIn  = activeFilter === 'ALL' || activeFilter === 'CONFIRMED' || activeFilter === 'UNALLOCATED';
  const showCheckedOut  = activeFilter === 'ALL' || activeFilter === 'CHECKED_OUT';
  const showInhouse     = activeFilter === 'ALL' || activeFilter === 'CHECKED_IN';

  const filteredCheckingIn = activeFilter === 'UNALLOCATED'
    ? checkingIn.filter(r => r.isUnallocated)
    : checkingIn;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>RESERVATIONS</Text>
          <Text style={styles.headerDate}>{formatLongDate(today)}</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.addBtn}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* ── Filter chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map(f => {
          const isActive = activeFilter === f.key;
          const hasItems = (f.count ?? 0) > 0;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setActiveFilter(isActive ? 'ALL' : f.key)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {f.label}{hasItems ? ` (${f.count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Content ── */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={ORANGE} />
      ) : error ? (
        <Text style={styles.errorText}>Could not load reservations.</Text>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
          {showCheckingOut && checkingOut.length > 0 && (
            <Section title="Guests checking out">
              {checkingOut.map(r => <CheckingOutCard key={r.id} res={r} today={today} />)}
            </Section>
          )}
          {showCheckingIn && filteredCheckingIn.length > 0 && (
            <Section title="Guests checking in today">
              {filteredCheckingIn.map(r => <CheckingInCard key={r.id} res={r} today={today} />)}
            </Section>
          )}
          {showCheckedOut && checkedOut.length > 0 && (
            <Section title="Guests who have checked out">
              {checkedOut.map(r => <SimpleCard key={r.id} res={r} today={today} />)}
            </Section>
          )}
          {showInhouse && inhouse.length > 0 && (
            <Section title="Inhouse">
              {inhouse.map(r => <SimpleCard key={r.id} res={r} today={today} />)}
            </Section>
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
  headerLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600', letterSpacing: 1 },
  headerDate:  { fontSize: 22, fontWeight: '700', color: '#111', marginTop: 2 },
  addBtn:      { fontSize: 13, color: ORANGE, fontWeight: '600' },

  // Filter chips
  filtersScroll:  { flexGrow: 0, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  filtersContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  chipActive:     { borderColor: ORANGE, backgroundColor: '#fff' },
  chipText:       { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: ORANGE, fontWeight: '600' },

  // Scroll content
  scrollContent: { paddingBottom: 16 },

  // Section
  section:      { marginTop: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111', paddingHorizontal: 16, marginBottom: 8 },

  // Card
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardOrangeBorder: { borderColor: ORANGE },

  // Status badge
  statusBadge: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },

  // Guest name + dates
  guestName: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 4 },
  dates:     { fontSize: 14, color: '#374151', marginBottom: 8 },

  // Room row
  roomRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  roomName: { fontSize: 13, color: '#6b7280' },

  // Warnings
  warningRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  warningText: { fontSize: 13, color: ORANGE },

  // Buttons
  btnRow: { flexDirection: 'row', marginTop: 8 },
  btnDark: {
    backgroundColor: '#111',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDarkText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnGreen: {
    backgroundColor: GREEN,
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  btnGreenText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnOutlined: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  btnOutlinedText: { color: '#111', fontSize: 15, fontWeight: '500' },

  errorText: { textAlign: 'center', color: 'red', marginTop: 40 },
});
