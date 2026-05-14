import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  SectionList,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  Switch,
  PanResponder,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@apollo/client';
import { GET_HOUSEKEEPING_SCHEDULE, GET_STAFF_NOTES, ADD_STAFF_NOTE, UPDATE_STAFF_NOTE } from '../../apollo/queries';
import { useHousekeepingStatus, RoomStatus } from '../../context/HousekeepingStatus';
import { STATUS_VARIANT, SYMBOL_CONTAINER } from '../../config/statusVariant';
import FLAGS from '../../config/featureFlags';
import { COLORS } from '../../config/colors';
import CleanSvg from '../../../assets/Clean.svg';
import DirtySvg from '../../../assets/Dirty.svg';
import InspectionSvg from '../../../assets/Inspection.svg';
import SnoozeSvg from '../../../assets/Snooze.svg';

interface RoomDaySchedule {
  isOccupied: boolean;
  hasCheckoutToday: boolean;
  guestCount: number;
  adults: number;
  children: number;
  infants: number;
  reservationId: string | null;
  guestName: string | null;
  checkIn: string | null;
  checkOut: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  lateCheckout: boolean;
  earlyCheckout: boolean;
  bedConfiguration: string;
  guestComments: string | null;
  extraItems: string[];
  room: { id: string; number: string; type: string; status: RoomStatus; notes: string | null; isClosed: boolean };
}

interface DaySchedule {
  date: string;
  rooms: RoomDaySchedule[];
}

interface StaffNote {
  id: string;
  roomId: string;
  author: string;
  text: string;
  tag: 'room' | 'guest';
  reservationId: string | null;
  createdAt: string;
  updatedAt: string;
}

const ORANGE = '#e8722a';
const NUM_DAYS = 5;
const WINDOW_HEIGHT = Dimensions.get('window').height;

const HOUSEKEEPERS = ['Maria S.', 'James T.', 'Jacqueline W.'];

const STATUS_CONFIG: Record<RoomStatus, { label: string; bg: string; border: string; text: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }> = {
  CLEANED:              { label: 'Clean',              bg: '#9AE0BD',               border: '#258548',               text: '#258548',               icon: 'auto-awesome'    },
  UNCLEANED:            { label: 'Needs clean',        bg: '#f1bfbf',               border: '#b81919',               text: '#b81919',               icon: 'auto-awesome'    },
  DEEP_CLEAN:           { label: 'Needs deep clean',   bg: '#f1bfbf',               border: '#b81919',               text: '#b81919',               icon: 'auto-awesome'    },
  SKIP_CLEANING:        { label: 'Skip clean',         bg: '#fef9c3',               border: '#d97706',               text: '#a16207',               icon: 'do-not-disturb'  },
  AWAITING_INSPECTION:  { label: 'Awaiting inspection',bg: COLORS.Blue[600],        border: COLORS.Blue[200],        text: COLORS.Blue[200],        icon: 'auto-fix-high'   },
};

const STATUS_SVG_ICON: Partial<Record<RoomStatus, React.FC<{ width?: number; height?: number }>>> = {
  CLEANED:             CleanSvg,
  UNCLEANED:           DirtySvg,
  DEEP_CLEAN:          DirtySvg,
  AWAITING_INSPECTION: InspectionSvg,
  SKIP_CLEANING:       SnoozeSvg,
};

// 'symbol' variant — MaterialCommunityIcons with housekeeping-semantic meaning
// shimmer = sparkling clean · water = stain/spill (dirty) · do-not-disturb = skip service
type SymbolEntry =
  | { set: 'MI';  name: React.ComponentProps<typeof MaterialIcons>['name'];          color: string; tint: string }
  | { set: 'MCI'; name: React.ComponentProps<typeof MaterialCommunityIcons>['name']; color: string; tint: string };

const STATUS_SYMBOL: Record<RoomStatus, SymbolEntry> = {
  CLEANED:             { set: 'MI',  name: 'auto-awesome',      color: '#258548',        tint: '#9AE0BD'        },
  UNCLEANED:           { set: 'MI',  name: 'cleaning-services', color: '#b81919',        tint: '#f1bfbf'        },
  DEEP_CLEAN:          { set: 'MCI', name: 'broom',             color: '#b81919',        tint: '#f1bfbf'        },
  SKIP_CLEANING:       { set: 'MCI', name: 'sleep',             color: '#d97706',        tint: '#fef9c3'        },
  AWAITING_INSPECTION: { set: 'MI',  name: 'auto-fix-high',     color: COLORS.Blue[200], tint: COLORS.Blue[600] },
};

function SymbolIcon({ entry, size }: { entry: SymbolEntry; size: number }) {
  if (entry.set === 'MCI') {
    return <MaterialCommunityIcons name={entry.name} size={size} color={entry.color} />;
  }
  return <MaterialIcons name={entry.name} size={size} color={entry.color} />;
}

// 'abbr' variant — text label is primary, border colour is secondary
const STATUS_ABBR: Record<RoomStatus, { label: string; fullLabel: string; color: string }> = {
  CLEANED:             { label: 'CLN', fullLabel: 'Clean',               color: '#258548'        },
  UNCLEANED:           { label: 'DRT', fullLabel: 'Needs clean',         color: '#b81919'        },
  DEEP_CLEAN:          { label: 'DPC', fullLabel: 'Needs deep clean',    color: '#b81919'        },
  SKIP_CLEANING:       { label: 'SKP', fullLabel: 'Skip Clean',          color: '#d97706'        },
  AWAITING_INSPECTION: { label: 'AWI', fullLabel: 'Awaiting inspection', color: COLORS.Blue[200] },
};

type SortField = 'priority' | 'room_number' | 'room_type' | 'occupancy' | 'guest_count' | 'notes' | 'cleanliness';
type SortDirection = 'asc' | 'desc';
interface SortState { field: SortField; direction: SortDirection }

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'priority',    label: 'Priority' },
  { value: 'cleanliness', label: 'Cleaning status' },
  { value: 'notes',       label: 'Room notes' },
  { value: 'occupancy',   label: 'Room status' },
  { value: 'room_number', label: 'Room name' },
  { value: 'room_type',   label: 'Room type' },
  { value: 'guest_count', label: 'Number of guests' },
];

const DEFAULT_SORT: SortState = { field: 'priority', direction: 'desc' };


const STATUS_SORT_ORDER: Record<RoomStatus, number> = {
  UNCLEANED:           0,
  DEEP_CLEAN:          1,
  SKIP_CLEANING:       2,
  AWAITING_INSPECTION: 3,
  CLEANED:             4,
};

// Returns priority bucket 1 (most urgent) → 7 (not actionable)
function getPriority(
  item: RoomDaySchedule,
  date: string,
  notes: Record<string, string>,
  overrides: Record<string, RoomStatus>,
): number {
  const noteKey = item.reservationId ?? item.room.id;
  const effectiveStatus = overrides[item.room.id] ?? item.room.status;
  const hasNotes = !!(notes[noteKey] || item.room.notes || item.guestComments || item.extraItems.length > 0);

  // Actioned statuses always drop to the bottom, sub-ordered so awaiting
  // inspection sits above skip-clean which sits above clean (the truly "done"
  // tier). Closed rooms join the bottom alongside cleaned. Active statuses
  // (UNCLEANED, DEEP_CLEAN) fall through to the urgency logic below.
  if (item.room.isClosed) return 9;
  if (effectiveStatus === 'CLEANED') return 9;
  if (effectiveStatus === 'SKIP_CLEANING') return 8;
  if (effectiveStatus === 'AWAITING_INSPECTION') return 7;

  // P6: Late checkout — guest still in room, push down until window passes
  if (item.lateCheckout && item.isOccupied) return 6;

  // P1: Early check-in / time-critical arrival prep — guest arriving soonest
  if (!item.isOccupied && item.checkIn === date && item.checkInTime !== null) return 1;

  // P2: Checkout today + arriving today — same-day turnover needed
  if (item.hasCheckoutToday && item.guestName !== null && item.checkIn === date) return 2;

  // P3: Stayover — in-house guest needs regular service today
  if (item.isOccupied) return 3;

  // P4: VIP / special notes — needs attention but not time-critical
  if (hasNotes) return 4;

  // P5: Checkout + no near-term arrival, or vacant with nothing pending
  return 5;
}

function sortRooms(
  rooms: RoomDaySchedule[],
  sort: SortState,
  overrides: Record<string, RoomStatus>,
  notes: Record<string, string>,
  date: string = '',
): RoomDaySchedule[] {
  const dir = sort.direction === 'asc' ? 1 : -1;
  return [...rooms].sort((a, b) => {
    let result = 0;
    switch (sort.field) {
      case 'priority': {
        // Inverted so ↓ (desc) puts P1 (most urgent) first
        const pA = getPriority(a, date, notes, overrides);
        const pB = getPriority(b, date, notes, overrides);
        if (pA !== pB) { result = pB - pA; break; }
        // Same bucket tiebreaker: earlier check-in time is more urgent
        if (a.checkInTime && b.checkInTime) {
          // b.localeCompare(a): '11:00' > '10:00' → positive → * dir(-1) → a first ✓
          result = b.checkInTime.localeCompare(a.checkInTime);
        }
        break;
      }
      case 'room_number': {
        const na = parseInt(a.room.number, 10);
        const nb = parseInt(b.room.number, 10);
        result = (!isNaN(na) && !isNaN(nb)) ? na - nb : a.room.number.localeCompare(b.room.number);
        break;
      }
      case 'room_type':
        result = a.room.type.localeCompare(b.room.type);
        break;
      case 'occupancy':
        result = (a.isOccupied ? 1 : 0) - (b.isOccupied ? 1 : 0);
        break;
      case 'guest_count':
        result = a.guestCount - b.guestCount;
        break;
      case 'notes': {
        const keyA = a.reservationId ?? a.room.id;
        const keyB = b.reservationId ?? b.room.id;
        const hasStaffA   = !!(notes[keyA] || a.room.notes);
        const hasGuestA   = !!a.guestComments;
        const hasExtrasA  = a.extraItems.length > 0;
        const hasStaffB   = !!(notes[keyB] || b.room.notes);
        const hasGuestB   = !!b.guestComments;
        const hasExtrasB  = b.extraItems.length > 0;
        const countA = (hasStaffA ? 1 : 0) + (hasGuestA ? 1 : 0) + (hasExtrasA ? 1 : 0);
        const countB = (hasStaffB ? 1 : 0) + (hasGuestB ? 1 : 0) + (hasExtrasB ? 1 : 0);
        if (countA !== countB) { result = countA - countB; break; }
        // Tiebreaker when count is equal: Extras (4) > Guest comments (2) > Staff notes (1)
        const prioA = (hasExtrasA ? 4 : 0) + (hasGuestA ? 2 : 0) + (hasStaffA ? 1 : 0);
        const prioB = (hasExtrasB ? 4 : 0) + (hasGuestB ? 2 : 0) + (hasStaffB ? 1 : 0);
        result = prioA - prioB;
        break;
      }
      case 'cleanliness': {
        const sa = overrides[a.room.id] ?? a.room.status;
        const sb = overrides[b.room.id] ?? b.room.status;
        result = STATUS_SORT_ORDER[sa] - STATUS_SORT_ORDER[sb];
        break;
      }
    }
    if (result !== 0) return result * dir;
    const ta = parseInt(a.room.number, 10);
    const tb = parseInt(b.room.number, 10);
    return (!isNaN(ta) && !isNaN(tb)) ? ta - tb : a.room.number.localeCompare(b.room.number);
  });
}

interface FilterState {
  statuses: RoomStatus[];
  roomTypes: string[];
  roomStatuses: string[];
  cleaningStatuses: string[];
  includeStaffNotes: boolean;
  includeGuestComments: boolean;
  includeExtras: boolean;
  lateCheckout: boolean;
  earlyCheckout: boolean;
}
const ROOM_TYPE_OPTIONS = ['Bridge Room', 'Deluxe Suite', 'Family Room'];
const ROOM_STATUS_OPTIONS = ['Occupied', 'Unoccupied', 'Check-in only', 'Check-out only', 'Check-out/in', 'Closed'];
const CLEANING_STATUS_OPTIONS = ['Clean', 'Need cleaning', 'Need deep cleaning', 'Skip cleaning', 'Awaiting inspection'];
const CLEANING_STATUS_MAP: Record<string, RoomStatus | null> = {
  'Clean':               'CLEANED',
  'Need cleaning':       'UNCLEANED',
  'Need deep cleaning':  'DEEP_CLEAN',
  'Skip cleaning':       'SKIP_CLEANING',
  'Awaiting inspection': 'AWAITING_INSPECTION',
};
const DEFAULT_FILTERS: FilterState = { statuses: [], roomTypes: [], roomStatuses: [], cleaningStatuses: [], includeStaffNotes: false, includeGuestComments: false, includeExtras: false, lateCheckout: false, earlyCheckout: false };

function getRoomStatusCategory(item: RoomDaySchedule, date: string): string {
  if (item.room.isClosed)       return 'Closed';
  const isCheckIn     = item.checkIn === date;
  const hasCheckout   = item.hasCheckoutToday;
  if (isCheckIn && hasCheckout) return 'Check-out/in';
  if (isCheckIn)                return 'Check-in only';
  if (hasCheckout)              return 'Check-out only';
  if (!item.isOccupied)         return 'Unoccupied';
  return 'Occupied';
}

function applyFilters(
  rooms: RoomDaySchedule[],
  filters: FilterState,
  notes: Record<string, string>,
  overrides: Record<string, RoomStatus>,
  date: string,
): RoomDaySchedule[] {
  const { statuses, roomTypes, roomStatuses, cleaningStatuses, includeStaffNotes, includeGuestComments, includeExtras, lateCheckout, earlyCheckout } = filters;
  if (!statuses.length && !roomTypes.length && !roomStatuses.length && !cleaningStatuses.length && !includeStaffNotes && !includeGuestComments && !includeExtras && !lateCheckout && !earlyCheckout) return rooms;
  return rooms.filter(item => {
    const noteKey = item.reservationId ?? item.room.id;
    const effectiveStatus = overrides[item.room.id] ?? item.room.status;
    if (statuses.length > 0 && !statuses.includes(effectiveStatus)) return false;
    if (roomTypes.length > 0 && !roomTypes.includes(item.room.type)) return false;
    if (roomStatuses.length > 0 && !roomStatuses.includes(getRoomStatusCategory(item, date))) return false;
    if (cleaningStatuses.length > 0) {
      const mapped = cleaningStatuses.map(s => CLEANING_STATUS_MAP[s]).filter(Boolean) as RoomStatus[];
      if (!mapped.includes(effectiveStatus)) return false;
    }
    if (includeStaffNotes || includeGuestComments || includeExtras) {
      const hasStaffNote = !!(notes[noteKey] || item.room.notes);
      const hasGuestComment = !!item.guestComments;
      const hasExtras = item.extraItems.length > 0;
      const passes = (includeStaffNotes && hasStaffNote) || (includeGuestComments && hasGuestComment) || (includeExtras && hasExtras);
      if (!passes) return false;
    }
    if (lateCheckout && !item.lateCheckout) return false;
    if (earlyCheckout && !item.earlyCheckout) return false;
    return true;
  });
}

function activeFilterCount(filters: FilterState): number {
  let n = 0;
  if (filters.statuses.length > 0) n++;
  if (filters.includeStaffNotes) n++;
  if (filters.includeGuestComments) n++;
  if (filters.includeExtras) n++;
  if (filters.lateCheckout) n++;
  if (filters.earlyCheckout) n++;
  return n;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function formatLong(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDayStrip(dateStr: string): { day: string; date: number } {
  const d = new Date(dateStr + 'T12:00:00');
  return {
    day: d.toLocaleDateString('en-AU', { weekday: 'short' }).toUpperCase(),
    date: d.getDate(),
  };
}

function formatSectionHeader(dateStr: string, today: string): string {
  if (dateStr === today) return `TODAY  ·  ${formatLong(dateStr)}`;
  if (dateStr === addDays(today, 1)) return `TOMORROW  ·  ${formatLong(dateStr)}`;
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.toLocaleDateString('en-AU', { weekday: 'short' }).toUpperCase()}  ·  ${formatLong(dateStr)}`;
}

function formatCardDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

// Derives a stable 8-digit booking reference from any reservation ID string
function toBookingRef(id: string): string {
  let h = 5381;
  for (let i = 0; i < id.length; i++) {
    h = (((h << 5) + h) ^ id.charCodeAt(i)) >>> 0;
  }
  return String(10000000 + (h % 90000000));
}

// "14:00" → "2pm", "11:30" → "11:30am"
function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`;
}

// ── Shared row components ─────────────────────────────────────────────────────

type BadgeRect = { x: number; y: number; width: number; height: number };

function CleaningControl({
  status,
  onPress,
}: {
  status: RoomStatus;
  onPress: (rect: BadgeRect) => void;
}) {
  const ref = useRef<View>(null);
  const { label, bg, border, text, icon } = STATUS_CONFIG[status];

  function handlePress() {
    ref.current?.measure((_x, _y, width, height, pageX, pageY) => {
      onPress({ x: pageX, y: pageY, width, height });
    });
  }

  if (STATUS_VARIANT === 'symbol') {
    const sym = STATUS_SYMBOL[status];
    const isChip = SYMBOL_CONTAINER === 'chip';
    const containerStyle = SYMBOL_CONTAINER === 'circle'
      ? styles.symbolCircle
      : SYMBOL_CONTAINER === 'rounded-square'
      ? styles.symbolSquare
      : styles.symbolChip;

    return (
      <TouchableOpacity activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} onPress={handlePress}>
        <View ref={ref} style={[styles.badgeInteractive, styles.badgeNeutral, { backgroundColor: sym.tint }]}>
          {isChip ? (
            <View style={[styles.symbolChip, { backgroundColor: sym.tint, paddingHorizontal: 10, width: 'auto' }]}>
              <SymbolIcon entry={sym} size={14} />
              <Text style={[styles.badgeText, { color: sym.color }]}>{label}</Text>
            </View>
          ) : (
            <View style={[containerStyle, { backgroundColor: sym.tint }]}>
              <SymbolIcon entry={sym} size={15} />
            </View>
          )}
          {!isChip && (
            <Text style={[styles.badgeText, { color: sym.color, marginRight: 4 }]}>{label}</Text>
          )}
          <Ionicons name="chevron-down" size={10} color="#9ca3af" style={isChip ? { marginLeft: 8 } : undefined} />
        </View>
      </TouchableOpacity>
    );
  }

  if (STATUS_VARIANT === 'abbr') {
    // Short text label is the primary signal; coloured left border is secondary.
    const abbr = STATUS_ABBR[status];
    return (
      <TouchableOpacity activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} onPress={handlePress}>
        <View ref={ref} style={[styles.badgeInteractive, styles.badgeNeutral, { borderLeftWidth: 3, borderLeftColor: abbr.color }]}>
          <Text style={[styles.badgeText, { color: '#374151', marginRight: 4 }]}>{abbr.fullLabel}</Text>
          <Ionicons name="chevron-down" size={10} color="#9ca3af" />
        </View>
      </TouchableOpacity>
    );
  }

  // 'icon' — Figma pill design
  const SvgIcon = STATUS_SVG_ICON[status];
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      onPress={handlePress}
    >
      <View ref={ref} style={[styles.cleaningBtn, { backgroundColor: bg, borderColor: border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {SvgIcon
            ? <SvgIcon width={18} height={18} />
            : <MaterialIcons name={icon} size={18} color={text} />}
          <Text style={[styles.cleaningBtnText, { color: text }]}>{label}</Text>
        </View>
        <Ionicons name="chevron-down" size={12} color={text} />
      </View>
    </TouchableOpacity>
  );
}

function OccupancyBadge({ isOccupied, adults, children, infants }: {
  isOccupied: boolean;
  adults: number;
  children: number;
  infants: number;
}) {
  if (!isOccupied) {
    return <Text style={styles.unoccupiedText}>Unoccupied</Text>;
  }
  const categories: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; count: number }[] = [
    { icon: 'account',       count: adults   },
    { icon: 'human-child',   count: children },
    { icon: 'baby-carriage', count: infants  },
  ];
  return (
    <View style={styles.occupancyRow}>
      <Text style={styles.occupancyLabel}>Occupied</Text>
      {categories.filter(c => c.count > 0).map(c => (
        <View key={c.icon} style={styles.occupancyItem}>
          <MaterialCommunityIcons name={c.icon} size={14} color="#6b7280" />
          <Text style={styles.occupancyCount}>{c.count}</Text>
        </View>
      ))}
    </View>
  );
}

const BED_CONFIG_KEYWORDS = ['extra bed', 'rollaway', 'king bed'];

function shouldShowBedConfig(config: string): boolean {
  const lower = config.toLowerCase();
  return BED_CONFIG_KEYWORDS.some(k => lower.includes(k));
}

function BedConfigDisplay({ config }: { config: string }) {
  return (
    <View style={styles.bedConfigBadge}>
      <Text style={styles.bedConfigText}>{config}</Text>
    </View>
  );
}

function RoomRow({
  item,
  status,
  note,
  bedConfig,
  assignedTo,
  flags,
  onNotePress,
  onStatusPress,
  onAssignPress,
}: {
  item: RoomDaySchedule;
  status: RoomStatus;
  note: string;
  bedConfig: string;
  assignedTo: string | null;
  flags: typeof FLAGS;
  onNotePress: () => void;
  onStatusPress: (rect: BadgeRect) => void;
  onAssignPress: () => void;
}) {
  return (
    <View style={styles.row}>
      {/* Row 1: Room number · Occupied/Unoccupied  |  CleaningControl */}
      <View style={styles.rowTop}>
        <View style={styles.rowLeft}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.roomNumber}>
              {/^\d+$/.test(item.room.number) ? `Room ${item.room.number}` : item.room.number}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <Text style={styles.roomType}>{item.room.type.toUpperCase()}</Text>
            {item.isOccupied && !item.room.isClosed && (
              <>
                <View style={styles.roomTitleSep} />
                <Text style={[styles.occupancyStatusText, { color: '#b81919' }]}>Occupied</Text>
              </>
            )}
            {item.room.isClosed && (
              <>
                <View style={styles.roomTitleSep} />
                <Text style={[styles.occupancyStatusText, { color: '#6b7280' }]}>Closed</Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.rowRight}>
          <CleaningControl status={status} onPress={onStatusPress} />
        </View>
      </View>


      {/* Row 2: Bed config (only for special configs) */}
      {flags.showBedConfig && shouldShowBedConfig(bedConfig) && (
        <View style={styles.bedConfigRow}>
          <View style={styles.bedConfigLeft}>
            <BedConfigDisplay config={bedConfig} />
          </View>
        </View>
      )}

      {/* Row 3 (occupied or arriving today): guest name · reservation ID · badges · pax — individually flagged */}
      {(item.isOccupied || item.guestName !== null) && (flags.showGuestName || flags.showGuestPax || flags.showGuestDates || flags.showReservationId || flags.showLateCheckout) && (
        <View style={styles.guestInfoSection}>
          {/* Main row: left (name + resID) | right (badges) */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Left column — name + reservation ID */}
            <View style={{ flex: 1, gap: 12 }}>
              {flags.showGuestName && item.guestName && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialCommunityIcons name="card-account-details-outline" size={12} color="#333333" />
                  <Text style={styles.guestNameText}>{item.guestName}</Text>
                </View>
              )}
              {flags.showReservationId && item.reservationId && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialCommunityIcons name="tag-outline" size={12} color="#333333" />
                  <Text style={styles.reservationIdText}>#{toBookingRef(item.reservationId)}</Text>
                </View>
              )}
            </View>
            {/* Right column — check-in / check-out badges */}
            {flags.showLateCheckout && ((item.hasCheckoutToday && item.isOccupied) || (!item.isOccupied && item.guestName !== null)) && (
              <View style={{ gap: 6, alignItems: 'flex-end' }}>
                {item.hasCheckoutToday && item.isOccupied && (
                  <View style={item.checkOutTime ? styles.lateCheckoutBadge : styles.standardBadge}>
                    <Text style={item.checkOutTime ? styles.lateCheckoutText : styles.standardBadgeText}>
                      {item.checkOutTime ? `${formatTime(item.checkOutTime).toUpperCase()} check-out` : 'Checking out'}
                    </Text>
                  </View>
                )}
                {!item.isOccupied && item.guestName !== null && (
                  <View style={item.checkInTime ? styles.lateCheckoutBadge : styles.standardBadge}>
                    <Text style={item.checkInTime ? styles.lateCheckoutText : styles.standardBadgeText}>
                      {item.checkInTime ? `${formatTime(item.checkInTime).toUpperCase()} check-in` : 'Checking in'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
          {/* Pax counts row */}
          {flags.showGuestPax && (
            <View style={[styles.guestDatesRow, { marginTop: 12 }]}>
              {item.adults > 0 && (
                <View style={styles.occupancyItem}>
                  <MaterialCommunityIcons name="account-outline" size={13} color={COLORS.Black[200]} />
                  <Text style={styles.occupancyCount}>{item.adults}</Text>
                </View>
              )}
              {item.children > 0 && (
                <View style={styles.occupancyItem}>
                  <MaterialCommunityIcons name="account-child-outline" size={13} color={COLORS.Black[200]} />
                  <Text style={styles.occupancyCount}>{item.children}</Text>
                </View>
              )}
              {item.infants > 0 && (
                <View style={styles.occupancyItem}>
                  <MaterialCommunityIcons name="baby-face-outline" size={13} color={COLORS.Black[200]} />
                  <Text style={styles.occupancyCount}>{item.infants}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.noteArea} onPress={onNotePress} activeOpacity={0.7}>
        <View style={styles.noteActionRow}>
          {/* Notes section — 70% when extras present, full width otherwise */}
          <View style={{ flex: item.extraItems.length > 0 ? 0.8 : 1 }}>
            {item.guestComments ? (
              <View style={{ gap: 6 }}>
                <Text numberOfLines={2} style={[styles.guestCommentsText, { flex: 1 }]}>
                  <Text style={styles.guestCommentsLabel}>Guest comments: </Text>{item.guestComments}
                </Text>
                {note ? (
                  <Text numberOfLines={2} style={[styles.noteText, { flex: 1 }]}>
                    <Text style={styles.staffNoteLabel}>Staff note: </Text>{note}
                  </Text>
                ) : (
                  <Text style={styles.addNoteText}>+ Staff notes</Text>
                )}
              </View>
            ) : note ? (
              <View style={styles.noteRow}>
                <Text numberOfLines={2} style={[styles.noteText, { flex: 1 }]}>
                  <Text style={styles.staffNoteLabel}>Staff note: </Text>{note}
                </Text>
              </View>
            ) : (
              <View style={styles.noteRow}>
                <Text style={styles.addNoteText}>+ Staff notes</Text>
              </View>
            )}
          </View>
          {item.extraItems.length > 0 && (
            <>
              {/* Vertical divider */}
              <View style={styles.noteDivider} />
              {/* Extras section — 20% width */}
              <View style={styles.extrasSection}>
                <Text style={styles.extrasCount}>{item.extraItems.length}</Text>
                <Text style={styles.extrasLabel}>Extras</Text>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ── FLIP-animated wrapper: after each render, measures each row's screen Y and
// slides it from its previous Y to the new one when the list reorders.
// Uses getBoundingClientRect on web (RN Web's onLayout doesn't fire on flex
// reposition) and measureInWindow on native.

function AnimatedRoomWrapper({
  id,
  positionsRef,
  shouldAnimate,
  children,
}: {
  id: string;
  positionsRef: React.MutableRefObject<Map<string, number>>;
  shouldAnimate: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<View>(null);
  const translateY = useRef(new Animated.Value(0)).current;

  function applyDelta(oldY: number, newY: number) {
    if (Math.abs(oldY - newY) > 1) {
      translateY.setValue(oldY - newY);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: Platform.OS !== 'web',
        damping: 22,
        stiffness: 220,
      }).start();
    }
  }

  useLayoutEffect(() => {
    const node = ref.current as any;
    if (!node) return;
    // Only animate when the sort order changed (shouldAnimate=true). On other
    // re-renders (opening dropdowns, polling, etc.), record positions for the
    // next reorder but skip the animation so layout-shift noise doesn't trigger
    // spurious slides.
    if (typeof node.getBoundingClientRect === 'function') {
      const newY = node.getBoundingClientRect().top;
      const lastY = positionsRef.current.get(id);
      if (shouldAnimate && lastY != null) applyDelta(lastY, newY);
      positionsRef.current.set(id, newY);
    } else if (typeof node.measureInWindow === 'function') {
      node.measureInWindow((_x: number, y: number) => {
        const lastY = positionsRef.current.get(id);
        if (shouldAnimate && lastY != null) applyDelta(lastY, y);
        positionsRef.current.set(id, y);
      });
    }
  });

  return (
    <View ref={ref}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        {children}
      </Animated.View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function HousekeepingScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const today = new Date().toISOString().split('T')[0];

  // Tracks each room card's last measured Y for FLIP reorder animation
  const roomPositionsRef = useRef(new Map<string, number>());
  // Tracks previous sort order so we only animate on actual reorders, not on
  // every re-render (e.g. opening dropdowns, polling refetches).
  const previousOrderRef = useRef<string[]>([]);
  // Refs for explicit scroll preservation across status changes
  const flatListRef = useRef<FlatList<RoomDaySchedule>>(null);
  const scrollYRef = useRef(0);
  const handleListScroll = (e: any) => {
    scrollYRef.current = e.nativeEvent.contentOffset.y;
  };

  // Strip state
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekStart, setWeekStart] = useState(today);

  // Range state
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  // Select-dates modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [expandedField, setExpandedField] = useState<'start' | 'end' | null>('start');
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const [pendingEnd, setPendingEnd] = useState<string | null>(null);

  // Status overrides (shared via context for cross-screen sync)
  const { statusOverrides, setStatusOverride, housekeeperMode, setHousekeeperMode } = useHousekeepingStatus();
  const [statusDropdown, setStatusDropdown] = useState<{
    roomId: string;
    currentStatus: RoomStatus;
    x: number; y: number; width: number; height: number;
  } | null>(null);

  // Stats strip scroll ref + pulse hint on first load
  const statsScrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    // 3 left-right pulses, each 350ms apart, starting after 500ms
    const beats = [0, 28, 0, 28, 0];
    const timers = beats.map((x, i) =>
      setTimeout(() => statsScrollRef.current?.scrollTo({ x, animated: true }), 500 + i * 350)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Feature flags (runtime toggles for demo)
  const [flags, setFlags] = useState({ ...FLAGS });
  const [demoSheetVisible, setDemoSheetVisible] = useState(false);
  const demoSheetAnim = useRef(new Animated.Value(0)).current;
  const demoTranslateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (demoSheetVisible) {
      demoTranslateY.setValue(400);
      demoSheetAnim.setValue(0);
      Animated.parallel([
        Animated.spring(demoTranslateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }),
        Animated.spring(demoSheetAnim,  { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 220 }),
      ]).start();
    }
  }, [demoSheetVisible]);

  function closeDemoSheet() {
    Animated.parallel([
      Animated.timing(demoTranslateY, { toValue: 400, duration: 200, useNativeDriver: true }),
      Animated.timing(demoSheetAnim,  { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(() => setDemoSheetVisible(false));
  }

  const demoPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => { if (g.dy > 0) demoTranslateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80) { closeDemoSheet(); }
        else { Animated.spring(demoTranslateY, { toValue: 0, useNativeDriver: true }).start(); }
      },
    })
  ).current;

  // Filter state
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const filterSheetAnim = useRef(new Animated.Value(0)).current;
  // Single translateY value: drives both open/close animation and drag offset
  const filterTranslateY = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (filterSheetVisible) {
      filterTranslateY.setValue(500);
      filterSheetAnim.setValue(0);
      Animated.parallel([
        Animated.spring(filterTranslateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }),
        Animated.spring(filterSheetAnim, { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 220 }),
      ]).start();
    }
  }, [filterSheetVisible]);

  function closeFilterSheet() {
    Animated.parallel([
      Animated.timing(filterTranslateY, { toValue: 500, duration: 200, useNativeDriver: true }),
      Animated.timing(filterSheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setFilterSheetVisible(false);
    });
  }

  const filterPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) filterTranslateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80) {
          closeFilterSheet();
        } else {
          Animated.spring(filterTranslateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  // Automations sheet state
  const [autoSheetVisible, setAutoSheetVisible] = useState(false);
  const autoSheetAnim = useRef(new Animated.Value(0)).current;
  const autoTranslateY = useRef(new Animated.Value(500)).current;
  const [deepCleanDays, setDeepCleanDays] = useState('3');
  const [nightlyResetOccupied, setNightlyResetOccupied] = useState(false);
  const [resetAfterCheckout, setResetAfterCheckout] = useState(true);
  const [resetAfterClosure, setResetAfterClosure] = useState(true);
  // Demo variant: single-date selector mode (read from the `flags` state above
  // so it's runtime-toggleable from the demo flags sheet). When on, the calendar
  // icon and date range bottom sheet are hidden; week strip is the only picker.
  const singleDateSelector = flags.singleDateSelector;

  // When entering single-date mode, drop any active range view and snap back
  // to single-day view so the UI is consistent.
  useEffect(() => {
    if (singleDateSelector && dateRange) {
      setDateRange(null);
      setSelectedDate(today);
      setWeekStart(today);
      if (modalVisible) closeDateSheet();
    }
  }, [singleDateSelector]);

  useEffect(() => {
    if (autoSheetVisible) {
      autoTranslateY.setValue(500);
      autoSheetAnim.setValue(0);
      Animated.parallel([
        Animated.spring(autoTranslateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }),
        Animated.spring(autoSheetAnim,  { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 220 }),
      ]).start();
    }
  }, [autoSheetVisible]);

  function closeAutoSheet() {
    Animated.parallel([
      Animated.timing(autoTranslateY, { toValue: 500, duration: 200, useNativeDriver: true }),
      Animated.timing(autoSheetAnim,  { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(() => setAutoSheetVisible(false));
  }

  const autoPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => { if (g.dy > 0) autoTranslateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80) { closeAutoSheet(); }
        else { Animated.spring(autoTranslateY, { toValue: 0, useNativeDriver: true }).start(); }
      },
    })
  ).current;

  // Sort state
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const sortSheetAnim = useRef(new Animated.Value(0)).current;
  const sortTranslateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (sortModalVisible) {
      sortTranslateY.setValue(400);
      sortSheetAnim.setValue(0);
      Animated.parallel([
        Animated.spring(sortTranslateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }),
        Animated.spring(sortSheetAnim,  { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 220 }),
      ]).start();
    }
  }, [sortModalVisible]);

  function closeSortModal() {
    Animated.parallel([
      Animated.timing(sortTranslateY, { toValue: 400, duration: 200, useNativeDriver: true }),
      Animated.timing(sortSheetAnim,  { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(() => setSortModalVisible(false));
  }

  const sortPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => { if (g.dy > 0) sortTranslateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80) { closeSortModal(); }
        else { Animated.spring(sortTranslateY, { toValue: 0, useNativeDriver: true }).start(); }
      },
    })
  ).current;

  // Date range sheet animation (slide up from bottom, drag to dismiss)
  const dateSheetAnim = useRef(new Animated.Value(0)).current;
  const dateSheetTranslateY = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (modalVisible) {
      dateSheetTranslateY.setValue(600);
      dateSheetAnim.setValue(0);
      Animated.parallel([
        Animated.spring(dateSheetTranslateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }),
        Animated.spring(dateSheetAnim,       { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 220 }),
      ]).start();
    }
  }, [modalVisible]);

  function closeDateSheet() {
    Animated.parallel([
      Animated.timing(dateSheetTranslateY, { toValue: 600, duration: 200, useNativeDriver: true }),
      Animated.timing(dateSheetAnim,       { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(() => setModalVisible(false));
  }

  const dateSheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => { if (g.dy > 0) dateSheetTranslateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80) { closeDateSheet(); }
        else { Animated.spring(dateSheetTranslateY, { toValue: 0, useNativeDriver: true }).start(); }
      },
    })
  ).current;

  // Assign housekeeper state
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assigningRoomId, setAssigningRoomId] = useState<string | null>(null);
  const assignSheetAnim = useRef(new Animated.Value(0)).current;
  const assignTranslateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (assignModalVisible) {
      assignTranslateY.setValue(400);
      assignSheetAnim.setValue(0);
      Animated.parallel([
        Animated.spring(assignTranslateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }),
        Animated.spring(assignSheetAnim,  { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 220 }),
      ]).start();
    }
  }, [assignModalVisible]);

  function openAssignModal(roomId: string) {
    setAssigningRoomId(roomId);
    setAssignModalVisible(true);
  }

  function closeAssignModal() {
    Animated.parallel([
      Animated.timing(assignTranslateY, { toValue: 400, duration: 200, useNativeDriver: true }),
      Animated.timing(assignSheetAnim,  { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(() => setAssignModalVisible(false));
  }

  const assignPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => { if (g.dy > 0) assignTranslateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80) { closeAssignModal(); }
        else { Animated.spring(assignTranslateY, { toValue: 0, useNativeDriver: true }).start(); }
      },
    })
  ).current;

  function confirmAssignment() {
    closeAssignModal();
  }

  // Print preview state
  const [printPreviewVisible, setPrintPreviewVisible] = useState(false);
  const [moreSettingsExpanded, setMoreSettingsExpanded] = useState(false);
  const [headersAndFooters, setHeadersAndFooters] = useState(true);

  // Print settings sheet — standard bottom sheet pattern
  const [printSettingsVisible, setPrintSettingsVisible] = useState(false);
  const printSettingsSheetAnim = useRef(new Animated.Value(0)).current;
  const printSettingsTranslateY = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (printSettingsVisible) {
      printSettingsTranslateY.setValue(500);
      printSettingsSheetAnim.setValue(0);
      Animated.parallel([
        Animated.spring(printSettingsTranslateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }),
        Animated.spring(printSettingsSheetAnim,  { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 220 }),
      ]).start();
    }
  }, [printSettingsVisible]);

  useEffect(() => {
    if (printPreviewVisible) setPrintSettingsVisible(true);
    else setPrintSettingsVisible(false);
  }, [printPreviewVisible]);

  const printSettingsPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderMove:   (_, g) => { if (g.dy > 0) printSettingsTranslateY.setValue(g.dy); },
      onPanResponderRelease:(_, g) => {
        if (g.dy > 80) closePrintSettings();
        else Animated.spring(printSettingsTranslateY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  // Staff notes: fetched from si_staff_notes via GraphQL, polled every 15s like cleaning
  const { data: staffNotesData } = useQuery(GET_STAFF_NOTES, { pollInterval: 15000 });
  const allStaffNotes: StaffNote[] = staffNotesData?.staffNotes ?? [];
  const [addStaffNoteMutation] = useMutation(ADD_STAFF_NOTE, { refetchQueries: [{ query: GET_STAFF_NOTES }] });
  const [updateStaffNoteMutation] = useMutation(UPDATE_STAFF_NOTE, { refetchQueries: [{ query: GET_STAFF_NOTES }] });

  // Map of noteKey → latest visible staff-note text, where noteKey is
  // `reservationId ?? roomId`. A 'guest' note attaches to its reservation; a
  // 'room' note attaches to the physical room and is visible regardless of who
  // is checked in. This preserves the existing UI lookup pattern.
  const notes: Record<string, string> = {};
  for (const n of allStaffNotes) {
    if (n.tag === 'room') notes[n.roomId] = n.text;
    else if (n.tag === 'guest' && n.reservationId) notes[n.reservationId] = n.text;
  }

  // Legacy modal kept around for backward compat; not currently triggered.
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState('');

  // Notes detail sheet state
  const [notesSheetVisible, setNotesSheetVisible] = useState(false);
  const [notesSheetItem, setNotesSheetItem] = useState<RoomDaySchedule | null>(null);
  const [notesSheetKey, setNotesSheetKey] = useState<string | null>(null);
  const [notesSheetEditing, setNotesSheetEditing] = useState(false);
  const [notesSheetDraft, setNotesSheetDraft] = useState('');
  const [newNoteTag, setNewNoteTag] = useState<'room' | 'guest'>('room');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const notesSheetAnim = useRef(new Animated.Value(0)).current;
  const notesSheetTranslateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (notesSheetVisible) {
      notesSheetTranslateY.setValue(400);
      notesSheetAnim.setValue(0);
      Animated.parallel([
        Animated.spring(notesSheetTranslateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }),
        Animated.spring(notesSheetAnim,       { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 220 }),
      ]).start();
    }
  }, [notesSheetVisible]);

  const notesSheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderMove:   (_, g) => { if (g.dy > 0) notesSheetTranslateY.setValue(g.dy); },
      onPanResponderRelease:(_, g) => {
        if (g.dy > 80) closeNotesSheet();
        else Animated.spring(notesSheetTranslateY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  // Query: either the current week or the selected range
  const queryStart = dateRange?.start ?? weekStart;
  const queryEnd   = dateRange?.end   ?? addDays(weekStart, NUM_DAYS - 1);

  const { data, loading, error } = useQuery(GET_HOUSEKEEPING_SCHEDULE, {
    variables: { startDate: queryStart, endDate: queryEnd },
    pollInterval: 15000,
  });

  const schedule: DaySchedule[] = data?.housekeepingSchedule ?? [];
  const visibleDates = Array.from({ length: NUM_DAYS }, (_, i) => addDays(weekStart, i));

  // Automation: nightly reset — set all today's occupied rooms to Need Cleaning once per toggle-on
  const nightlyResetApplied = useRef(false);
  useEffect(() => {
    if (!nightlyResetOccupied) { nightlyResetApplied.current = false; return; }
    if (!schedule.length || nightlyResetApplied.current) return;
    const todaySchedule = schedule.find(d => d.date === today);
    if (!todaySchedule) return;
    todaySchedule.rooms.forEach(item => {
      if (item.isOccupied) setStatusOverride(item.room.id, 'UNCLEANED');
    });
    nightlyResetApplied.current = true;
  }, [schedule, nightlyResetOccupied]);

  // Automation: flag occupied rooms as Needs Deep Clean after N consecutive days
  useEffect(() => {
    const n = parseInt(deepCleanDays, 10);
    if (!n || n <= 0 || !schedule.length) return;
    schedule.forEach(day => {
      if (day.date > today) return;
      day.rooms.forEach(item => {
        if (!item.isOccupied || !item.checkIn) return;
        const stayDays = Math.floor(
          (new Date(day.date + 'T12:00:00').getTime() - new Date(item.checkIn + 'T12:00:00').getTime())
          / 86400000,
        );
        if (stayDays < n) return;
        const effective = statusOverrides[item.room.id] ?? item.room.status;
        if (effective === 'UNCLEANED') {
          setStatusOverride(item.room.id, 'DEEP_CLEAN');
        }
      });
    });
  }, [schedule, deepCleanDays, statusOverrides]);

  const filterCount = activeFilterCount(filters);

  // Single-day view
  const selectedDay = schedule.find(d => d.date === selectedDate);
  const singleRooms: RoomDaySchedule[] = applyFilters(
    sortRooms(selectedDay?.rooms ?? [], sort, statusOverrides, notes, selectedDate),
    filters, notes, statusOverrides, selectedDate,
  );

  // Detect if the sort order of the single-day list changed since the previous
  // render. Only triggers the FLIP slide animation on real reorders.
  const currentOrder = singleRooms.map(r => r.room.id);
  let orderChanged = previousOrderRef.current.length === currentOrder.length;
  if (orderChanged) {
    orderChanged = false;
    for (let i = 0; i < currentOrder.length; i++) {
      if (previousOrderRef.current[i] !== currentOrder[i]) {
        orderChanged = true;
        break;
      }
    }
  } else if (previousOrderRef.current.length > 0) {
    // Length changed (filter toggled, etc.) — count as a reorder so cards reflow smoothly.
    orderChanged = true;
  }
  previousOrderRef.current = currentOrder;

  const printTotalRows = (dateRange ? schedule.flatMap(d => d.rooms) : singleRooms).length;
  const printPageCount = Math.max(1, Math.ceil(printTotalRows / 22));

  // Stats strip — always computed from the selected/start date, unfiltered
  const statsRooms = selectedDay?.rooms ?? [];
  const dayStats = {
    dirty:        statsRooms.filter(r => { const s = statusOverrides[r.room.id] ?? r.room.status; return s === 'UNCLEANED' || s === 'DEEP_CLEAN'; }).length,
    earlyCheckIn: statsRooms.filter(r => r.checkInTime !== null).length,
    lateCheckOut: statsRooms.filter(r => r.lateCheckout && r.hasCheckoutToday).length,
    outOfOrder:   statsRooms.filter(r => r.room.isClosed).length,
    issues:       statsRooms.filter(r => r.room.notes !== null).length,
  };
  const BG = '#f2f3f3'; // matches screen background
  const statsStrip = (
    <View style={{ position: 'relative' }}>
      <ScrollView
        ref={statsScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 24 }}
      >
        {([
          { value: dayStats.dirty,        label: 'Rooms dirty today'      },
          { value: dayStats.earlyCheckIn, label: 'Early check-in today'   },
          { value: dayStats.lateCheckOut, label: 'Late check-out today'   },
          { value: dayStats.outOfOrder,   label: 'Out of order today'     },
          { value: dayStats.issues,       label: 'Issue reported today'   },
        ] as { value: number; label: string }[]).map((stat, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </ScrollView>
      {/* Simulated right-edge fade — indicates horizontal scroll affordance */}
      <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, flexDirection: 'row' }} pointerEvents="none">
        <View style={{ flex: 1, backgroundColor: `rgba(242,243,243,0)`    }} />
        <View style={{ flex: 1, backgroundColor: `rgba(242,243,243,0.3)`  }} />
        <View style={{ flex: 1, backgroundColor: `rgba(242,243,243,0.6)`  }} />
        <View style={{ flex: 1, backgroundColor: `rgba(242,243,243,0.85)` }} />
        <View style={{ flex: 1, backgroundColor: `rgba(242,243,243,1)`    }} />
      </View>
    </View>
  );

  // Range view sections (empty sections hidden when filters active)
  const rangeSections = schedule
    .map(day => ({
      title: formatSectionHeader(day.date, today),
      data: applyFilters(sortRooms(day.rooms, sort, statusOverrides, notes, day.date), filters, notes, statusOverrides, day.date),
    }))
    .filter(s => s.data.length > 0);

  function openModal() {
    setPendingStart(null);
    setPendingEnd(null);
    setExpandedField('start');
    setModalVisible(true);
  }

  function applyRange() {
    if (!pendingStart || !pendingEnd) return;
    setDateRange({ start: pendingStart, end: pendingEnd });
    closeDateSheet();
  }

  function resetDateSheet() {
    setPendingStart(null);
    setPendingEnd(null);
    setExpandedField('start');
  }

  function clearRange() {
    setDateRange(null);
    setSelectedDate(today);
    setWeekStart(today);
  }

  function openStatusDropdown(roomId: string, currentStatus: RoomStatus, rect: BadgeRect) {
    setStatusDropdown({ roomId, currentStatus, ...rect });
  }

  function applyStatusChange(newStatus: RoomStatus) {
    if (!statusDropdown) return;
    // Snapshot scroll position so we can pin it back after the re-render —
    // prevents the FlatList from auto-shifting to follow the moved card.
    const snapshotScroll = scrollYRef.current;
    setStatusOverride(statusDropdown.roomId, newStatus);
    setStatusDropdown(null);
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToOffset({ offset: snapshotScroll, animated: false });
    });
  }


  function openPrintSettings() {
    setPrintSettingsVisible(true);
  }

  function closePrintSettings() {
    Animated.parallel([
      Animated.timing(printSettingsTranslateY, { toValue: 500, duration: 200, useNativeDriver: true }),
      Animated.timing(printSettingsSheetAnim,  { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(() => setPrintSettingsVisible(false));
  }

  function openNotesSheet(item: RoomDaySchedule, noteKey: string) {
    setNotesSheetItem(item);
    setNotesSheetKey(noteKey);
    setNotesSheetEditing(false);
    setNotesSheetDraft('');
    setEditingNoteId(null);
    // Default the tag based on whether the room has an active reservation: a
    // checked-in / arriving guest → notes are about that stay; otherwise it's
    // about the physical room.
    setNewNoteTag(item.reservationId ? 'guest' : 'room');
    setNotesSheetVisible(true);
  }

  function saveSheetNote() {
    if (!notesSheetItem) return;
    const trimmed = notesSheetDraft.trim();
    if (!trimmed) {
      setNotesSheetEditing(false);
      return;
    }
    if (editingNoteId) {
      updateStaffNoteMutation({ variables: { id: editingNoteId, text: trimmed } })
        .catch(err => console.warn('[paul] updateStaffNote failed', err));
    } else {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      addStaffNoteMutation({
        variables: {
          id,
          roomId: notesSheetItem.room.id,
          author: 'You',
          text: trimmed,
          tag: newNoteTag,
          reservationId: newNoteTag === 'guest' ? notesSheetItem.reservationId : null,
        },
      }).catch(err => console.warn('[paul] addStaffNote failed', err));
    }
    setNotesSheetDraft('');
    setNotesSheetEditing(false);
    setEditingNoteId(null);
  }

  // Visible staff notes for the room currently open in the sheet — room-tagged
  // notes are always shown; guest-tagged notes only when their reservation_id
  // matches the room's current reservation.
  const sheetNotes: StaffNote[] = notesSheetItem
    ? allStaffNotes.filter(n => {
        if (n.roomId !== notesSheetItem.room.id) return false;
        if (n.tag === 'room') return true;
        return !!notesSheetItem.reservationId && n.reservationId === notesSheetItem.reservationId;
      })
    : [];

  function closeNotesSheet() {
    Animated.parallel([
      Animated.timing(notesSheetTranslateY, { toValue: 400, duration: 200, useNativeDriver: true }),
      Animated.timing(notesSheetAnim,       { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(() => setNotesSheetVisible(false));
  }

  function openNotesModal(noteKey: string) {
    setEditingRoomId(noteKey);
    setDraftNote(notes[noteKey] ?? '');
    setNotesModalVisible(true);
  }

  function saveNote() {
    // Legacy local-state save path — kept as a no-op so the unused notesModal
    // component still compiles. All real writes go through saveSheetNote.
    setNotesModalVisible(false);
  }

  // Header date text
  const headerText = dateRange
    ? `${formatShort(dateRange.start)} → ${formatShort(dateRange.end)}`
    : formatLong(selectedDate);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {!housekeeperMode && (
            <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#484b4b" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerLabel} pointerEvents="none">Housekeeping</Text>
          <TouchableOpacity style={{ padding: 4, marginLeft: 'auto' }} onPress={() => setDemoSheetVisible(true)}>
            <Ionicons name="flask-outline" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerBottom}>
          <Text style={[styles.headerDate, dateRange && { fontSize: 15 }]} numberOfLines={1}>{headerText}</Text>
          {dateRange && (
            <TouchableOpacity onPress={openModal} style={styles.clearBtn}>
              <Ionicons name="pencil-outline" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
            {(selectedDate !== today || dateRange) && (
              <TouchableOpacity
                style={{ paddingHorizontal: 12, height: 32, backgroundColor: '#f4f4f4', borderRadius: 4, justifyContent: 'center' }}
                onPress={() => { setSelectedDate(today); setWeekStart(today); setDateRange(null); }}
              >
                <Text style={{ fontSize: 14, color: '#333', fontWeight: '500' }}>Today</Text>
              </TouchableOpacity>
            )}

            {!dateRange && !singleDateSelector && (
              <TouchableOpacity style={{ padding: 4 }} onPress={openModal}>
                <Ionicons name="calendar-outline" size={20} color="#333" />
              </TouchableOpacity>
            )}
            {!housekeeperMode && (
              <TouchableOpacity style={{ padding: 4 }} onPress={() => setAutoSheetVisible(true)}>
                <MaterialCommunityIcons name="cog-sync-outline" size={22} color="#374151" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* ── Week strip (single-date variant) ── */}
      {singleDateSelector && (
        <View style={styles.weekStripRow}>
          <TouchableOpacity onPress={() => setWeekStart(addDays(weekStart, -NUM_DAYS))} style={styles.arrow}>
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>
          {visibleDates.map(d => {
            const isActive = d === selectedDate;
            const { day, date } = formatDayStrip(d);
            const dayIndex = new Date(d + 'T12:00:00').getDay();
            const isWeekend = dayIndex === 0 || dayIndex === 6;
            return (
              <TouchableOpacity key={d} style={styles.dayBtn} onPress={() => setSelectedDate(d)}>
                <Text style={[styles.dayLabel, isWeekend && !isActive && { color: '#b91c1c' }, isActive && styles.activeText]}>{day}</Text>
                <Text style={[styles.dayNum, isWeekend && !isActive && { color: '#b91c1c' }, isActive && styles.activeText]}>{date}</Text>
                {isActive && <View style={styles.dayUnderline} />}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity onPress={() => setWeekStart(addDays(weekStart, NUM_DAYS))} style={styles.arrow}>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Sort toolbar ── */}
      <View style={styles.sortToolbar}>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setSortModalVisible(true)}>
          <Text style={styles.sortBtnText}>
            Sort: {SORT_OPTIONS.find(o => o.value === sort.field)?.label}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sortDirToggle}
          onPress={() => setSort(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
        >
          <Ionicons
            name={sort.direction === 'asc' ? 'arrow-up' : 'arrow-down'}
            size={16}
            color={ORANGE}
          />
        </TouchableOpacity>
        <View style={styles.sortToolbarSep} />
        <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterSheetVisible(true)}>
          <Ionicons name="options-outline" size={15} color={ORANGE} />
          <Text style={styles.filterBtnText}>Filter</Text>
          {filterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{filterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.sortToolbarPrint} onPress={() => setPrintPreviewVisible(true)}>
          <Ionicons name="print-outline" size={15} color={ORANGE} />
          <Text style={styles.sortToolbarPrintText}>Print</Text>
        </TouchableOpacity>
      </View>

      {/* ── Content ── */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={ORANGE} />
      ) : error ? (
        <Text style={styles.errorText}>Could not load schedule.</Text>
      ) : dateRange ? (
        <SectionList
          sections={rangeSections}
          keyExtractor={(item, i) => `${item.room.id}-${i}`}
          ListHeaderComponent={statsStrip}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const effectiveStatus = statusOverrides[item.room.id] ?? item.room.status;
            const noteKey = item.reservationId ?? item.room.id;
            const bedConfig = item.bedConfiguration;
            return (
              <AnimatedRoomWrapper id={item.room.id} positionsRef={roomPositionsRef} shouldAnimate={orderChanged}>
                <RoomRow
                  item={item}
                  status={effectiveStatus}
                  note={notes[noteKey] ?? ''}
                  bedConfig={bedConfig}
                  flags={flags}
                  onNotePress={() => openNotesSheet(item, noteKey)}
                  onStatusPress={(rect) => openStatusDropdown(item.room.id, effectiveStatus, rect)}
                  assignedTo={assignments[item.room.id] ?? null}
                  onAssignPress={() => openAssignModal(item.room.id)}
                />
              </AnimatedRoomWrapper>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {filterCount > 0 ? 'No rooms match the current filters.' : 'No room data for this range.'}
            </Text>
          }
          stickySectionHeadersEnabled
          style={{ backgroundColor: '#f2f3f3' }}
          contentContainerStyle={{ paddingTop: 0, paddingBottom: 32 }}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          onScroll={handleListScroll}
          scrollEventThrottle={16}
          data={singleRooms}
          keyExtractor={item => item.room.id}
          ListHeaderComponent={statsStrip}
          renderItem={({ item }) => {
            const effectiveStatus = statusOverrides[item.room.id] ?? item.room.status;
            const noteKey = item.reservationId ?? item.room.id;
            const bedConfig = item.bedConfiguration;
            return (
              <AnimatedRoomWrapper id={item.room.id} positionsRef={roomPositionsRef} shouldAnimate={orderChanged}>
                <RoomRow
                  item={item}
                  status={effectiveStatus}
                  note={notes[noteKey] ?? ''}
                  bedConfig={bedConfig}
                  flags={flags}
                  onNotePress={() => openNotesSheet(item, noteKey)}
                  onStatusPress={(rect) => openStatusDropdown(item.room.id, effectiveStatus, rect)}
                  assignedTo={assignments[item.room.id] ?? null}
                  onAssignPress={() => openAssignModal(item.room.id)}
                />
              </AnimatedRoomWrapper>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          style={{ backgroundColor: '#f2f3f3' }}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {filterCount > 0 ? 'No rooms match the current filters.' : 'No room data for this date.'}
            </Text>
          }
        />
      )}

      {/* ── Status dropdown ── */}
      {statusDropdown && (
        <Modal transparent animationType="none" visible onRequestClose={() => setStatusDropdown(null)}>
          <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={() => setStatusDropdown(null)}>
            <View style={[styles.dropdownCard, {
              top: statusDropdown.y + statusDropdown.height + 6,
              right: Dimensions.get('window').width - statusDropdown.x - statusDropdown.width,
            }]}>
              {(Object.keys(STATUS_CONFIG) as RoomStatus[]).filter(s => !(housekeeperMode && s === 'CLEANED')).map((s, i) => {
                const isActive = (statusOverrides[statusDropdown.roomId] ?? statusDropdown.currentStatus) === s;
                return (
                  <React.Fragment key={s}>
  
                    <TouchableOpacity
                      style={[styles.dropdownItem, isActive && styles.dropdownItemActive]}
                      onPress={() => applyStatusChange(s)}
                    >
                      <Text style={[styles.dropdownItemText, { color: STATUS_CONFIG[s].text }]}>
                        {STATUS_CONFIG[s].label}
                      </Text>
                      {isActive && <Ionicons name="checkmark" size={16} color={ORANGE} />}
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>
      )}


      {/* ── Notes modal ── */}
      <Modal visible={notesModalVisible} animationType="slide" presentationStyle="fullScreen">
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setNotesModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Notes</Text>
              <View style={{ width: 24 }} />
            </View>

            <TextInput
              style={styles.notesInput}
              multiline
              placeholder="Enter notes..."
              placeholderTextColor="#d1d5db"
              value={draftNote}
              onChangeText={setDraftNote}
              autoFocus
              textAlignVertical="top"
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.applyBtn} onPress={saveNote}>
                <Text style={styles.applyBtnText}>Save</Text>
              </TouchableOpacity>
            </View>

          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Notes detail sheet ── */}
      <Modal visible={notesSheetVisible} animationType="none" transparent onRequestClose={closeNotesSheet}>
        <Animated.View style={[styles.sortSheetOverlay, { opacity: notesSheetAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeNotesSheet} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Animated.View style={[styles.sortSheet, { paddingBottom: 0, transform: [{ translateY: notesSheetTranslateY }] }]}>
              <View style={styles.sheetHandleArea} {...notesSheetPanResponder.panHandlers}>
                <View style={styles.sortSheetHandle} />
              </View>
              <View style={styles.sortSheetHeader}>
                <Text style={styles.sortSheetTitle}>Notes</Text>
                <TouchableOpacity onPress={closeNotesSheet}>
                  <Text style={styles.sortResetText}>Done</Text>
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
                {notesSheetItem?.guestComments ? (
                  <>
                    <Text style={styles.notesSheetSectionLabel}>Guest comments</Text>
                    <Text style={styles.notesSheetBody}>{notesSheetItem.guestComments}</Text>
                    <View style={styles.notesSheetDivider} />
                  </>
                ) : null}
                <Text style={styles.notesSheetSectionLabel}>Staff notes</Text>
                {sheetNotes.length === 0 && !notesSheetEditing && (
                  <Text style={[styles.notesSheetBody, { color: COLORS.Black[600], fontStyle: 'italic', marginBottom: 8 }]}>
                    No staff notes yet.
                  </Text>
                )}
                {sheetNotes.map(note => {
                  const isEditing = editingNoteId === note.id;
                  return (
                    <View key={note.id} style={{ marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <Text style={[styles.notesSheetBody, { fontSize: 11, color: COLORS.Black[500] }]}>
                          {note.tag === 'room' ? 'Room' : 'Guest'} · {note.author} · {new Date(note.createdAt).toLocaleString([], { hour: 'numeric', minute: '2-digit' })}
                        </Text>
                        {!isEditing && (
                          <TouchableOpacity onPress={() => { setEditingNoteId(note.id); setNotesSheetDraft(note.text); setNotesSheetEditing(true); }}>
                            <Ionicons name="pencil-outline" size={14} color={ORANGE} />
                          </TouchableOpacity>
                        )}
                      </View>
                      {isEditing ? (
                        <>
                          <TextInput
                            style={styles.notesSheetInput}
                            value={notesSheetDraft}
                            onChangeText={setNotesSheetDraft}
                            multiline
                            autoFocus
                            placeholder="Edit note..."
                            placeholderTextColor={COLORS.Black[600]}
                            textAlignVertical="top"
                            maxLength={300}
                          />
                          <View style={styles.notesSheetSaveRow}>
                            <TouchableOpacity onPress={() => { setEditingNoteId(null); setNotesSheetEditing(false); setNotesSheetDraft(''); }}>
                              <Text style={styles.notesSheetCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.notesSheetSaveBtn} onPress={saveSheetNote}>
                              <Text style={styles.notesSheetSaveBtnText}>Save</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      ) : (
                        <Text style={styles.notesSheetBody}>{note.text}</Text>
                      )}
                    </View>
                  );
                })}
                {notesSheetEditing && !editingNoteId ? (
                  <>
                    {notesSheetItem?.reservationId && (
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                        <TouchableOpacity
                          onPress={() => setNewNoteTag('room')}
                          style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: newNoteTag === 'room' ? ORANGE : COLORS.Background.Stroke, backgroundColor: newNoteTag === 'room' ? '#FFF4ED' : 'transparent' }}
                        >
                          <Text style={{ color: newNoteTag === 'room' ? ORANGE : COLORS.Black[400], fontSize: 12, fontWeight: '600' }}>Room</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setNewNoteTag('guest')}
                          style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: newNoteTag === 'guest' ? ORANGE : COLORS.Background.Stroke, backgroundColor: newNoteTag === 'guest' ? '#FFF4ED' : 'transparent' }}
                        >
                          <Text style={{ color: newNoteTag === 'guest' ? ORANGE : COLORS.Black[400], fontSize: 12, fontWeight: '600' }}>Guest</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    <TextInput
                      style={styles.notesSheetInput}
                      value={notesSheetDraft}
                      onChangeText={setNotesSheetDraft}
                      multiline
                      autoFocus
                      placeholder="Add a note..."
                      placeholderTextColor={COLORS.Black[600]}
                      textAlignVertical="top"
                      maxLength={300}
                    />
                    <View style={styles.notesSheetSaveRow}>
                      <TouchableOpacity onPress={() => { setNotesSheetEditing(false); setNotesSheetDraft(''); }}>
                        <Text style={styles.notesSheetCancel}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.notesSheetSaveBtn} onPress={saveSheetNote}>
                        <Text style={styles.notesSheetSaveBtnText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : !editingNoteId ? (
                  <TouchableOpacity onPress={() => { setNotesSheetDraft(''); setNotesSheetEditing(true); }}>
                    <Text style={styles.addNoteText}>+ Add staff note</Text>
                  </TouchableOpacity>
                ) : null}
                {(notesSheetItem?.extraItems?.length ?? 0) > 0 && (
                  <>
                    <View style={styles.notesSheetDivider} />
                    <Text style={styles.notesSheetSectionLabel}>Extras</Text>
                    {notesSheetItem!.extraItems.map((item, i) => (
                      <Text key={i} style={styles.notesSheetBody}>{'\u2022'} {item}</Text>
                    ))}
                  </>
                )}
              </ScrollView>
            </Animated.View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>

      {/* ── Sort bottom sheet ── */}
      <Modal visible={sortModalVisible} animationType="none" transparent onRequestClose={closeSortModal}>
        <Animated.View style={[styles.sortSheetOverlay, { opacity: sortSheetAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeSortModal} />
          <Animated.View style={[styles.sortSheet, { transform: [{ translateY: sortTranslateY }] }]}>
            <View style={styles.sheetHandleArea} {...sortPanResponder.panHandlers}><View style={styles.sortSheetHandle} /></View>
            <View style={styles.sortSheetHeader}>
              <Text style={styles.sortSheetTitle}>Sort by</Text>
              <TouchableOpacity onPress={() => { setSort(DEFAULT_SORT); closeSortModal(); }}>
                <Text style={styles.sortResetText}>Reset</Text>
              </TouchableOpacity>
            </View>
            {SORT_OPTIONS.map((option, i) => {
              const isSelected = sort.field === option.value;
              return (
                <React.Fragment key={option.value}>

                  <TouchableOpacity
                    style={[styles.sortOptionRow, isSelected && styles.sortOptionRowActive]}
                    onPress={() => { setSort(prev => ({ ...prev, field: option.value })); closeSortModal(); }}
                  >
                    <View style={[styles.sortRadio, isSelected && styles.sortRadioActive]}>
                      {isSelected && <View style={styles.sortRadioDot} />}
                    </View>
                    <Text style={[styles.sortOptionLabel, isSelected && styles.sortOptionLabelActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* ── Assign housekeeper bottom sheet ── */}
      <Modal visible={assignModalVisible} animationType="none" transparent onRequestClose={closeAssignModal}>
        <Animated.View style={[styles.sortSheetOverlay, { opacity: assignSheetAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeAssignModal} />
          <Animated.View style={[styles.sortSheet, { transform: [{ translateY: assignTranslateY }] }]}>
            <View style={styles.sheetHandleArea} {...assignPanResponder.panHandlers}><View style={styles.sortSheetHandle} /></View>
            <View style={styles.sortSheetHeader}>
              <Text style={styles.sortSheetTitle}>Assign housekeeper</Text>
              <TouchableOpacity onPress={confirmAssignment}>
                <Text style={styles.sortResetText}>Confirm</Text>
              </TouchableOpacity>
            </View>
            {HOUSEKEEPERS.map((name, i) => {
              const isSelected = assigningRoomId ? assignments[assigningRoomId] === name : false;
              return (
                <React.Fragment key={name}>

                  <TouchableOpacity
                    style={[styles.sortOptionRow, isSelected && styles.sortOptionRowActive]}
                    onPress={() => {
                      if (assigningRoomId) setAssignments(prev => ({ ...prev, [assigningRoomId]: name }));
                    }}
                  >
                    <View style={[styles.sortRadio, isSelected && styles.sortRadioActive]}>
                      {isSelected && <View style={styles.sortRadioDot} />}
                    </View>
                    <Text style={[styles.sortOptionLabel, isSelected && styles.sortOptionLabelActive]}>
                      {name}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* ── Filter bottom sheet ── */}
      <Modal visible={filterSheetVisible} animationType="none" transparent onRequestClose={closeFilterSheet}>
        <Animated.View style={[styles.sortSheetOverlay, { opacity: filterSheetAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeFilterSheet} />
          <Animated.View style={[styles.sortSheet, { height: WINDOW_HEIGHT * 0.85, paddingBottom: 0, transform: [{ translateY: filterTranslateY }] }]}>
            <View style={styles.sheetHandleArea} {...filterPanResponder.panHandlers}>
              <View style={styles.sortSheetHandle} />
            </View>
            <View style={styles.sortSheetHeader}>
              <Text style={styles.sortSheetTitle}>Filter</Text>
              <TouchableOpacity onPress={() => setFilters(DEFAULT_FILTERS)}>
                <Text style={styles.sortResetText}>Reset</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            {/* Room type — multi-select chips */}
            <View style={styles.filterSection}>
                <Text style={styles.filterSectionLabel}>ROOM TYPE</Text>
                <View style={styles.filterChipRow}>
                  {ROOM_TYPE_OPTIONS.map(type => {
                    const isActive = filters.roomTypes.includes(type);
                    return (
                      <TouchableOpacity
                        key={type}
                        activeOpacity={0.75}
                        style={[styles.filterChip, { borderColor: isActive ? '#ff6842' : '#d1d5db', backgroundColor: isActive ? '#fff5ee' : '#fff' }]}
                        onPress={() => setFilters(prev => ({
                          ...prev,
                          roomTypes: isActive ? prev.roomTypes.filter(x => x !== type) : [...prev.roomTypes, type],
                        }))}
                      >
                        <Text style={[styles.filterChipText, { color: isActive ? '#ff6842' : '#333', fontWeight: isActive ? '600' : '400' }]}>{type}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Room status — multi-select chips */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionLabel}>ROOM STATUS</Text>
                <View style={styles.filterChipRow}>
                  {ROOM_STATUS_OPTIONS.map(status => {
                    const isActive = filters.roomStatuses.includes(status);
                    return (
                      <TouchableOpacity
                        key={status}
                        activeOpacity={0.75}
                        style={[styles.filterChip, { borderColor: isActive ? '#ff6842' : '#d1d5db', backgroundColor: isActive ? '#fff5ee' : '#fff' }]}
                        onPress={() => setFilters(prev => ({
                          ...prev,
                          roomStatuses: isActive ? prev.roomStatuses.filter(x => x !== status) : [...prev.roomStatuses, status],
                        }))}
                      >
                        <Text style={[styles.filterChipText, { color: isActive ? '#ff6842' : '#333', fontWeight: isActive ? '600' : '400' }]}>{status}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Cleaning status — multi-select chips */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionLabel}>CLEANING STATUS</Text>
                <View style={styles.filterChipRow}>
                  {CLEANING_STATUS_OPTIONS.map(s => {
                    const isActive = filters.cleaningStatuses.includes(s);
                    return (
                      <TouchableOpacity
                        key={s}
                        activeOpacity={0.75}
                        style={[styles.filterChip, { borderColor: isActive ? '#ff6842' : '#d1d5db', backgroundColor: isActive ? '#fff5ee' : '#fff' }]}
                        onPress={() => setFilters(prev => ({
                          ...prev,
                          cleaningStatuses: isActive ? prev.cleaningStatuses.filter(x => x !== s) : [...prev.cleaningStatuses, s],
                        }))}
                      >
                        <Text style={[styles.filterChipText, { color: isActive ? '#ff6842' : '#333', fontWeight: isActive ? '600' : '400' }]}>{s}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Checkouts — chips */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionLabel}>CHECKOUTS</Text>
                <View style={styles.filterChipRow}>
                  {([
                    { key: 'lateCheckout',  label: 'Late'  },
                    { key: 'earlyCheckout', label: 'Early' },
                  ] as { key: 'lateCheckout' | 'earlyCheckout'; label: string }[]).map(item => {
                    const isActive = filters[item.key];
                    return (
                      <TouchableOpacity
                        key={item.key}
                        activeOpacity={0.75}
                        style={[styles.filterChip, isActive ? styles.filterChipActive : styles.filterChipInactive]}
                        onPress={() => setFilters(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      >
                        <Text style={[styles.filterChipText, { color: isActive ? '#ff6842' : '#333', fontWeight: isActive ? '600' : '400' }]}>{item.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Notes — chips */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionLabel}>NOTES</Text>
                <View style={styles.filterChipRow}>
                  {([
                    { key: 'includeStaffNotes',    label: 'Staff notes'     },
                    { key: 'includeGuestComments', label: 'Guest comments'  },
                    { key: 'includeExtras',        label: 'Extras'          },
                  ] as { key: 'includeStaffNotes' | 'includeGuestComments' | 'includeExtras'; label: string }[]).map(opt => {
                    const isActive = filters[opt.key];
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        activeOpacity={0.75}
                        style={[styles.filterChip, isActive ? styles.filterChipActive : styles.filterChipInactive]}
                        onPress={() => setFilters(prev => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                      >
                        <Text style={[styles.filterChipText, { color: isActive ? '#ff6842' : '#333', fontWeight: isActive ? '600' : '400' }]}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Save — pinned footer */}
            <View style={[styles.autoFooter, styles.filterSaveFooter, { paddingBottom: insets.bottom + 16 }]}>
              <TouchableOpacity style={styles.autoDoneBtn} onPress={closeFilterSheet}>
                <Text style={styles.autoDoneBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* ── Demo flags bottom sheet ── */}
      <Modal visible={demoSheetVisible} animationType="none" transparent onRequestClose={closeDemoSheet}>
        <Animated.View style={[styles.sortSheetOverlay, { opacity: demoSheetAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeDemoSheet} />
          <Animated.View style={[styles.sortSheet, { transform: [{ translateY: demoTranslateY }] }]}>
            <View style={styles.sheetHandleArea} {...demoPanResponder.panHandlers}><View style={styles.sortSheetHandle} /></View>
            <View style={styles.sortSheetHeader}>
              <Text style={styles.sortSheetTitle}>Demo flags</Text>
              <TouchableOpacity onPress={() => { setFlags({ ...FLAGS }); setHousekeeperMode(false); }}>
                <Text style={styles.sortResetText}>Reset</Text>
              </TouchableOpacity>
            </View>

            {/* View mode */}
            <View style={styles.demoFlagRow}>
              <Text style={styles.demoFlagLabel}>Housekeeper view</Text>
              <Switch
                value={housekeeperMode}
                onValueChange={setHousekeeperMode}
                trackColor={{ false: '#e5e7eb', true: ORANGE }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.dropdownDivider} />
            <View style={[styles.dropdownDivider, { marginBottom: 8 }]} />

            {([
              { key: 'showGuestName',         label: 'Guest name' },
              { key: 'showGuestPax',          label: 'Pax counts' },
              { key: 'showBedConfig',         label: 'Bed configuration' },
              { key: 'showLateCheckout',      label: 'Early check-in & late check-out badge' },
              { key: 'showReservationId',    label: 'Reservation ID' },
              { key: 'singleDateSelector',    label: 'Single date selector (hide calendar)' },
            ] as { key: keyof typeof FLAGS; label: string }[]).map((item, i) => (
              <React.Fragment key={item.key}>
                {i > 0 && <View style={styles.dropdownDivider} />}
                <View style={styles.demoFlagRow}>
                  <Text style={styles.demoFlagLabel}>{item.label}</Text>
                  <Switch
                    value={flags[item.key]}
                    onValueChange={val => setFlags(prev => ({ ...prev, [item.key]: val }))}
                    trackColor={{ false: '#e5e7eb', true: ORANGE }}
                    thumbColor="#fff"
                  />
                </View>
              </React.Fragment>
            ))}
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* ── Automations bottom sheet ── */}
      <Modal visible={autoSheetVisible} animationType="none" transparent onRequestClose={closeAutoSheet}>
        <Animated.View style={[styles.sortSheetOverlay, { opacity: autoSheetAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeAutoSheet} />
          <Animated.View style={[styles.sortSheet, { paddingBottom: 0, transform: [{ translateY: autoTranslateY }] }]}>
            <View style={styles.sheetHandleArea} {...autoPanResponder.panHandlers}><View style={styles.sortSheetHandle} /></View>
            <View style={styles.sortSheetHeader}>
              <Text style={styles.sortSheetTitle}>Automations</Text>
              <TouchableOpacity onPress={() => { setDeepCleanDays('3'); setNightlyResetOccupied(false); setResetAfterCheckout(true); setResetAfterClosure(true); }}>
                <Text style={styles.sortResetText}>Reset</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.autoSheetSubtitle}>Rules that run on page load to keep cleaning statuses up to date.</Text>

            {/* Deep clean section */}
            <View style={styles.autoSection}>
              <Text style={styles.autoSectionTitle}>Deep clean after N days of occupancy</Text>
              <Text style={styles.autoSectionDesc}>Flags rooms occupied for N or more consecutive days as Need Deep Cleaning.</Text>
              <View style={styles.autoInputRow}>
                <TextInput
                  style={styles.autoInput}
                  value={deepCleanDays}
                  onChangeText={setDeepCleanDays}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.autoInputSuffix}>days</Text>
              </View>
            </View>

            <View style={styles.autoSeparator} />

            {/* Checkbox rows */}
            {([
              { key: 'nightlyResetOccupied',  label: 'Nightly reset for occupied rooms',         desc: 'Resets all occupied rooms to Need Cleaning each day.',                            value: nightlyResetOccupied, set: setNightlyResetOccupied },
              { key: 'resetAfterCheckout',    label: 'Reset to Need Cleaning after check-out',   desc: 'Sets departing rooms to Need Cleaning on check-out day.',                        value: resetAfterCheckout,   set: setResetAfterCheckout },
              { key: 'resetAfterClosure',     label: 'Reset to Need Cleaning after room closure ends', desc: 'Clears rooms returning from maintenance or renovation closures.',           value: resetAfterClosure,    set: setResetAfterClosure },
            ] as const).map(({ key, label, desc, value, set }) => (
              <TouchableOpacity key={key} style={styles.autoCheckRow} onPress={() => (set as (v: boolean) => void)(!value)} activeOpacity={0.7}>
                <MaterialIcons
                  name={value ? 'check-box' : 'check-box-outline-blank'}
                  size={22}
                  color={value ? '#e8722a' : '#9ca3af'}
                  style={{ marginTop: 1 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.autoCheckLabel}>{label}</Text>
                  <Text style={styles.autoCheckDesc}>{desc}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Done button */}
            <View style={[styles.autoFooter, { paddingBottom: insets.bottom + 16 }]}>
              <TouchableOpacity style={styles.autoDoneBtn} onPress={closeAutoSheet}>
                <Text style={styles.autoDoneBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* ── Print preview modal ── */}
      <Modal visible={printPreviewVisible} animationType="slide" presentationStyle="fullScreen">
        <View style={[styles.printPreviewSafe, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.printPreviewHeader}>
            <TouchableOpacity onPress={() => setPrintPreviewVisible(false)}>
              <Ionicons name="close" size={22} color="#111" />
            </TouchableOpacity>
            <Text style={styles.printPreviewHeaderTitle}>Print preview</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Document */}
          <ScrollView contentContainerStyle={styles.printPreviewScroll}>
            <View style={styles.printDoc}>
              {/* Document header */}
              <Text style={styles.printDocTitle}>Housekeeping Report</Text>
              <Text style={styles.printDocDate}>{headerText}</Text>
              <View style={styles.printDocDivider} />

              {/* Table header */}
              <View style={styles.printTableHeader}>
                <Text style={[styles.printTableHeaderCell, { flex: 1.4 }]}>Room</Text>
                <Text style={[styles.printTableHeaderCell, { flex: 1 }]}>Check-in</Text>
                <Text style={[styles.printTableHeaderCell, { flex: 1 }]}>Check-out</Text>
                <Text style={[styles.printTableHeaderCell, { flex: 1.5 }]}>Room status</Text>
                <Text style={[styles.printTableHeaderCell, { flex: 1.3 }]}>Status</Text>
              </View>

              {/* Rows */}
              {(dateRange ? schedule.flatMap(d => d.rooms) : singleRooms).map((item, i) => {
                const status = statusOverrides[item.room.id] ?? item.room.status;
                const cfg = STATUS_CONFIG[status];
                const note = notes[item.room.id];
                return (
                  <View key={`${item.room.id}-${i}`} style={[styles.printTableRow, i % 2 === 1 && styles.printTableRowAlt]}>
                    <View style={styles.printTableRowCols}>
                      <Text style={[styles.printTableCell, styles.printTableCellBold, { flex: 1.4 }]}>{item.room.number}</Text>
                      <Text style={[styles.printTableCell, { flex: 1 }]}>{item.checkIn ? new Date(item.checkIn + 'T12:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '—'}</Text>
                      <Text style={[styles.printTableCell, { flex: 1 }]}>{item.checkOut ? new Date(item.checkOut + 'T12:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '—'}</Text>
                      <Text style={[styles.printTableCell, { flex: 1.5 }]}>
                        {item.isOccupied ? `${item.guestCount} guest${item.guestCount !== 1 ? 's' : ''}` : 'Vacant'}
                      </Text>
                      <View style={[styles.printStatusBadge, { backgroundColor: cfg.bg, flex: 1.3 }]}>
                        <Text style={[styles.printStatusText, { color: cfg.text }]}>{cfg.label}</Text>
                      </View>
                    </View>
                    {(!!item.guestComments || !!note) && (
                      <View style={styles.printNotesContainer}>
                        {!!item.guestComments && (
                          <Text style={styles.printNoteText}><Text style={styles.printNoteLabel}>Guest comments: </Text>{item.guestComments}</Text>
                        )}
                        {!!note && (
                          <Text style={styles.printNoteText}><Text style={styles.printNoteLabel}>Staff note: </Text>{note}</Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

          </ScrollView>

          {/* ── Print settings sheet — standard bottom sheet overlay ── */}
          {printSettingsVisible && (
            <Animated.View style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              justifyContent: 'flex-end',
              backgroundColor: 'rgba(0,0,0,0.35)',
              opacity: printSettingsSheetAnim,
            }}>
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closePrintSettings} />
              <Animated.View style={[styles.printSheet, { paddingBottom: 0, transform: [{ translateY: printSettingsTranslateY }] }]}>
                <View style={styles.sheetHandleArea} {...printSettingsPanResponder.panHandlers}>
                  <View style={styles.sortSheetHandle} />
                </View>
                <View style={styles.printSheetTitleRow}>
                  <Text style={styles.printSheetTitleText}>Print Settings</Text>
                  <Text style={styles.printSheetPageCount}>{printPageCount} page{printPageCount !== 1 ? 's' : ''}</Text>
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
                  <View style={styles.printSheetDivider} />

                  <View style={styles.printSettingsRow}>
                    <Text style={styles.printSettingsLabel}>Destination</Text>
                    <View style={styles.printSettingsSelect}>
                      <Ionicons name="document-outline" size={15} color={COLORS.Black[400]} />
                      <Text style={styles.printSettingsSelectText}>Save as PDF</Text>
                      <Ionicons name="chevron-down" size={13} color={COLORS.Black[400]} />
                    </View>
                  </View>

                  <View style={styles.printSettingsRow}>
                    <Text style={styles.printSettingsLabel}>Pages</Text>
                    <View style={styles.printSettingsSelect}>
                      <Text style={styles.printSettingsSelectText}>All</Text>
                      <Ionicons name="chevron-down" size={13} color={COLORS.Black[400]} />
                    </View>
                  </View>

                  <View style={styles.printSettingsRow}>
                    <Text style={styles.printSettingsLabel}>Layout</Text>
                    <View style={styles.printSettingsSelect}>
                      <Text style={styles.printSettingsSelectText}>Portrait</Text>
                      <Ionicons name="chevron-down" size={13} color={COLORS.Black[400]} />
                    </View>
                  </View>

                  <View style={styles.printSettingsDivider} />

                  <TouchableOpacity style={styles.printSettingsRow} onPress={() => setMoreSettingsExpanded(v => !v)}>
                    <Text style={styles.printSettingsLabel}>More settings</Text>
                    <Ionicons name={moreSettingsExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.Black[100]} />
                  </TouchableOpacity>

                  {moreSettingsExpanded && (
                    <>
                      <View style={styles.printSettingsRow}>
                        <Text style={styles.printSettingsLabel}>Paper size</Text>
                        <View style={styles.printSettingsSelect}>
                          <Text style={styles.printSettingsSelectText}>A4</Text>
                          <Ionicons name="chevron-down" size={13} color={COLORS.Black[400]} />
                        </View>
                      </View>
                      <View style={styles.printSettingsRow}>
                        <Text style={styles.printSettingsLabel}>Pages per sheet</Text>
                        <View style={styles.printSettingsSelect}>
                          <Text style={styles.printSettingsSelectText}>1</Text>
                          <Ionicons name="chevron-down" size={13} color={COLORS.Black[400]} />
                        </View>
                      </View>
                      <View style={styles.printSettingsRow}>
                        <Text style={styles.printSettingsLabel}>Margins</Text>
                        <View style={styles.printSettingsSelect}>
                          <Text style={styles.printSettingsSelectText}>Default</Text>
                          <Ionicons name="chevron-down" size={13} color={COLORS.Black[400]} />
                        </View>
                      </View>
                      <View style={styles.printSettingsRow}>
                        <Text style={styles.printSettingsLabel}>Scale</Text>
                        <View style={styles.printSettingsSelect}>
                          <Text style={styles.printSettingsSelectText}>Default</Text>
                          <Ionicons name="chevron-down" size={13} color={COLORS.Black[400]} />
                        </View>
                      </View>
                      <View style={[styles.printSettingsRow, { alignItems: 'flex-start' }]}>
                        <Text style={styles.printSettingsLabel}>Options</Text>
                        <View>
                          <TouchableOpacity style={styles.printCheckRow} onPress={() => setHeadersAndFooters(v => !v)}>
                            <View style={[styles.printCheckbox, headersAndFooters && styles.printCheckboxChecked]}>
                              {headersAndFooters && <Ionicons name="checkmark" size={11} color="#fff" />}
                            </View>
                            <Text style={styles.printCheckLabel}>Headers and footers</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.printCheckRow}>
                            <View style={styles.printCheckbox} />
                            <Text style={styles.printCheckLabel}>Background graphics</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.printSettingsDivider} />
                      <TouchableOpacity style={styles.printExternalRow}>
                        <Text style={styles.printExternalText}>Print using system dialogue...</Text>
                        <Ionicons name="open-outline" size={14} color={COLORS.Black[300]} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.printExternalRow}>
                        <Text style={styles.printExternalText}>Open PDF in Preview</Text>
                        <Ionicons name="open-outline" size={14} color={COLORS.Black[300]} />
                      </TouchableOpacity>
                    </>
                  )}
                </ScrollView>

                <View style={[styles.printPreviewFooter, { paddingBottom: insets.bottom + 12 }]}>
                  <TouchableOpacity style={styles.printConfirmBtn}>
                    <Ionicons name="print-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.printConfirmBtnText}>Print</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </Animated.View>
          )}
        </View>
      </Modal>

      {/* ── Select dates bottom sheet (not rendered in single-date variant) ── */}
      <Modal visible={modalVisible && !singleDateSelector} animationType="none" transparent onRequestClose={closeDateSheet} statusBarTranslucent>
        <Animated.View style={[styles.sortSheetOverlay, { opacity: dateSheetAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeDateSheet} />
          <Animated.View style={[styles.dateSheet, { transform: [{ translateY: dateSheetTranslateY }] }]}>
              <View style={styles.sheetHandleArea} {...dateSheetPanResponder.panHandlers}>
                <View style={styles.dateSheetHandle} />
              </View>
              <View style={styles.dateSheetHeader}>
                <Text style={styles.dateSheetTitle}>Select dates</Text>
                <TouchableOpacity onPress={closeDateSheet} style={styles.dateSheetCloseBtn}>
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
    </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#f2f3f3' },

  // Header
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  header: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  headerLabel: { fontSize: 16, color: '#333', fontWeight: '600', position: 'absolute', left: 0, right: 0, textAlign: 'center' },
  headerDate:  { fontSize: 22, fontFamily: 'ValueSerifTrial-Medium', color: '#111', marginTop: 2, lineHeight: 30 },
  clearBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 4, alignSelf: 'center' },
  clearBtnText: { fontSize: 13, color: '#9ca3af' },
  printBtn: { padding: 4, marginLeft: 8 },
  sortToolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: 16,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: '#f2f3f3',
  },
  sortBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortBtnText: { fontSize: 13, color: ORANGE, fontWeight: '600' },
  sortToolbarSep: { width: 1, height: 14, backgroundColor: '#d1d5db', marginHorizontal: 4 },
  sortToolbarPrint: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 6, marginRight: 16 },
  sortToolbarPrintText: { fontSize: 13, color: ORANGE, fontWeight: '600' },
  demoBtn:     { flexDirection: 'row', alignItems: 'center' },
  demoBtnText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },

  // Filter button
  filterBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 6 },
  filterBtnText:  { fontSize: 13, color: ORANGE, fontWeight: '600' },
  filterBadge:    { minWidth: 16, height: 16, borderRadius: 8, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  filterBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },

  // Filter sheet
  filterSection:      { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  filterSectionLabel: { fontSize: 11, fontWeight: '700', color: '#9ca3af', letterSpacing: 0.8, marginBottom: 16 },
  filterChipRow:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  // Segmented control
  segmentedControl: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 3,
  },
  segmentedSegment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentedSegmentActive: {
    borderWidth: 2,
    borderColor: '#111',
  },
  segmentedText:       { fontSize: 15, color: '#6b7280', fontWeight: '400' },
  segmentedTextActive: { color: '#111', fontWeight: '600' },

  filterChip:         { borderWidth: 1, borderRadius: 4, paddingHorizontal: 16, height: 34, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  filterChipActive:   { borderColor: '#ff6842', backgroundColor: '#fff5ee' },
  filterChipInactive: { borderColor: '#ccd1d1', backgroundColor: '#fff' },
  filterChipText:     { fontSize: 14, fontWeight: '400' },

  // Demo flags sheet
  demoFlagRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  demoFlagLabel: { fontSize: 15, color: '#111', flex: 1, marginRight: 16 },

  // Controls row
  controlsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    height: 62,
  },

  // Date strip (fills remaining space)
  stripContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  weekStripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.Background.Stroke,
  },
  arrow:     { width: 22, alignItems: 'center' },
  arrowText: { fontSize: 20, color: '#9ca3af', lineHeight: 24 },
  dayBtn:    { flex: 1, alignItems: 'center', paddingVertical: 4 },
  dayLabel:  { fontSize: 9, color: '#9ca3af', fontWeight: '600', letterSpacing: 0.4 },
  dayNum:    { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 1 },
  activeText:   { color: ORANGE },
  dayUnderline: { height: 2, width: 16, backgroundColor: ORANGE, borderRadius: 1, marginTop: 2 },

  // Divider
  verticalDivider: { width: 1, height: '60%', backgroundColor: '#e5e7eb' },

  // Select dates (40%)
  selectDatesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  selectDatesText: { fontSize: 13, color: ORANGE, fontWeight: '600' },

  // Room rows
  row: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E8E8',
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 0,
    overflow: 'hidden',
  },
  rowTop:   { flexDirection: 'row', alignItems: 'flex-start' },
  rowLeft:  { flex: 1, gap: 4 },
  rowRight: { flexDirection: 'row', gap: 24, alignItems: 'center' },

  cardDivider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: -16, marginTop: 12 },

  // Notes area
  noteArea: { marginTop: 16, borderTopWidth: 1, borderColor: '#F2F2F7', marginHorizontal: -12, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },
  guestCommentsLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600' as const, flexShrink: 0 },
  staffNoteLabel:     { fontSize: 11, color: '#9ca3af', fontWeight: '600' as const, fontStyle: 'normal' as const },
  guestCommentsText: { fontSize: 12, color: '#9ca3af', fontStyle: 'italic' as const },
  noteActionRow: { flexDirection: 'row', alignItems: 'stretch' },
  noteRow:  { flex: 1, height: 24, justifyContent: 'center' },
  noteAssignDivider: { width: 1, alignSelf: 'stretch', backgroundColor: '#e5e7eb', marginHorizontal: 12 },
  noteDivider: { width: 1, alignSelf: 'stretch', backgroundColor: '#e5e7eb', marginHorizontal: 12 },
  extrasSection: { flex: 0.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  extrasCount: { fontSize: 12, fontWeight: '700' as const, color: '#374151' },
  extrasLabel: { fontSize: 12, fontWeight: '600' as const, color: '#9ca3af' },
  statLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '500' as const },
  statValue: { fontSize: 14, fontWeight: '700' as const, color: '#111827' },
  noteActionDivider: { width: 1, height: 16, backgroundColor: '#d1d5db', marginHorizontal: 8 },
  assignBtn: { width: 80, height: 24, alignItems: 'flex-end', justifyContent: 'center' },
  assignBtnText: { fontSize: 12, color: ORANGE, fontWeight: '700', textAlign: 'right' },
  noteText: { fontSize: 12, color: '#9ca3af', fontStyle: 'italic' as const },
  editNoteBtn:     { paddingLeft: 4 },
  editNoteBtnText: { fontSize: 13, color: ORANGE, fontWeight: '600' },
  addNoteText:     { fontSize: 12, color: ORANGE, fontWeight: '700' },

  // Notes input
  notesInput: {
    flex: 1,
    margin: 16,
    padding: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 15,
    color: '#111',
    lineHeight: 22,
  },
  roomTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  roomNumber:   { fontSize: 16, fontWeight: '600', color: '#212323' },
  roomTitleSep: { width: 2, height: 2, borderRadius: 1, backgroundColor: '#9ca3af' },
  roomType:     { fontSize: 11, fontWeight: '700', color: '#9BA0A0' },

  // Guest info section
  guestInfoSection: {
    marginTop: 12,
  },
  guestNameText:     { fontSize: 12, fontWeight: '400', color: '#333333' },
  reservationIdText: { fontSize: 12, color: '#333333' },
  guestDatesRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  guestBadgeRow: { flexDirection: 'row', gap: 4, marginTop: 16 },
  guestDatesText: { fontSize: 12, color: '#111' },
  lateCheckoutBadge: {
    backgroundColor: '#FFE2D7',
    borderRadius: 999,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  lateCheckoutText: { fontSize: 11, fontWeight: '600', color: '#FF6842', letterSpacing: -0.1, lineHeight: 20 },
  standardBadge: {
    backgroundColor: COLORS.Background.Brown,
    borderRadius: 999,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  standardBadgeText: { fontSize: 11, fontWeight: '600', color: COLORS.Black[400], letterSpacing: -0.1, lineHeight: 20 },
  notesSheetSectionLabel: { fontSize: 11, fontWeight: '700' as const, color: COLORS.Black[500], letterSpacing: 0.5, textTransform: 'uppercase' as const, marginBottom: 8 },
  notesSheetBody: { fontSize: 14, color: COLORS.Black[200], lineHeight: 21 },
  notesSheetDivider: { height: 1, backgroundColor: COLORS.Background.Stroke, marginVertical: 20 },
  notesSheetInput: {
    borderWidth: 1, borderColor: COLORS.Background.Stroke, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: COLORS.Black[200], lineHeight: 21,
    minHeight: 80, textAlignVertical: 'top' as const,
  },
  notesSheetSaveRow: { flexDirection: 'row' as const, justifyContent: 'flex-end' as const, alignItems: 'center' as const, gap: 16, marginTop: 12 },
  notesSheetCancel: { fontSize: 14, color: COLORS.Black[400] },
  notesSheetSaveBtn: { backgroundColor: ORANGE, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8 },
  notesSheetSaveBtnText: { fontSize: 14, fontWeight: '600' as const, color: '#fff' },

  // Bed config
  bedConfigRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  bedConfigLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  bedConfigPipe: { width: 1, height: 14, backgroundColor: '#d1d5db' },
  bedConfigBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bedConfigText: { fontSize: 12, color: '#111' },

  occupancyRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  occupancyLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  occupancyItem:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  occupancyCount: { fontSize: 12, color: COLORS.Black[200], fontWeight: '400' },
  unoccupiedText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },

  // symbol container styles — all 30×30 so every icon sits in the same footprint
  symbolCircle: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 2,
  },
  symbolSquare: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 2,
  },
  symbolChip: {
    height: 30, borderRadius: 15,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10,
  },

  badge:            { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeInteractive: { flexDirection: 'row', alignItems: 'center', height: 40, paddingLeft: 4, paddingRight: 8 },
  badgeText:        { fontSize: 11, fontWeight: '600' },
  badgeNeutral:     { backgroundColor: '#f3f4f6', borderRadius: 8 },

  // Figma pill-style cleaning status button (icon variant)
  cleaningBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 34,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  cleaningBtnText: { fontSize: 12, fontWeight: '700', lineHeight: 16 },

  // Occupancy status text (plain, inline with room number)
  occupancyStatusText: { fontSize: 12, fontWeight: '700' },

  // Status dropdown
  dropdownOverlay: { flex: 1 },
  dropdownCard: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 170,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  dropdownItemActive: { backgroundColor: '#fef9f5' },
  dropdownItemText:   { fontSize: 14, fontWeight: '500' },
  dropdownDivider:    { height: 1, backgroundColor: '#f3f4f6' },

  separator:       { height: 1, backgroundColor: '#f3f4f6' },
  errorText:       { textAlign: 'center', color: 'red', marginTop: 40 },
  emptyText:       { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
  sectionHeader:   { backgroundColor: '#f2f3f3', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 },
  sectionHeaderText: { fontSize: 11, fontWeight: '700', color: '#6b7280', letterSpacing: 0.8 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  dateModalHelper: { fontSize: 12, color: '#9ca3af', textAlign: 'center', paddingTop: 16, paddingBottom: 12 },

  // Date fields
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  dateFieldActive: { backgroundColor: '#fef9f5' },
  dateFieldLeft:   { flex: 1 },
  dateFieldLabel:  { fontSize: 11, color: '#9ca3af', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  dateFieldValue:  { fontSize: 16, fontWeight: '600', color: '#111' },
  dateFieldPlaceholder: { color: '#d1d5db', fontWeight: '400' },
  fieldDivider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 },

  // Sort toolbar direction toggle
  sortDirToggle: { padding: 6, marginLeft: 0, marginRight: -2 },

  // Date range bottom sheet (Figma node 653:2819 styling — grey panels, drag handle,
  // sticky footer with Reset + dark pill Apply button)
  dateSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 0,
    maxHeight: '92%',
  },
  dateSheetHandle: { width: 44, height: 4, borderRadius: 4, backgroundColor: '#C6CEDA' },
  dateSheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  dateSheetTitle: { fontSize: 16, fontWeight: '700', color: COLORS.Black[200] },
  dateSheetCloseBtn: { padding: 4 },
  dateSheetHelper: {
    fontSize: 12, color: COLORS.Black[500],
    paddingHorizontal: 16, paddingBottom: 12, lineHeight: 16,
  },
  dateSheetScroll: { flexGrow: 0 },
  dateSheetPanel: {
    backgroundColor: '#F2F2F7', borderRadius: 6,
    padding: 12, marginBottom: 8,
  },
  dateSheetFieldRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dateSheetFieldLabel: { fontSize: 11, fontWeight: '600', color: COLORS.Black[500], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  dateSheetFieldValue: { fontSize: 17, color: COLORS.Black[200] },
  dateSheetFieldPlaceholder: { color: COLORS.Black[500] },
  dateSheetFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: '#E5E8E8',
    backgroundColor: '#fff',
  },
  dateSheetResetBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  dateSheetResetText: { fontSize: 15, fontWeight: '700', color: ORANGE, letterSpacing: -0.23 },
  dateSheetApplyPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#212323', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 9,
  },
  dateSheetApplyPillDisabled: { backgroundColor: '#9ca3af' },
  dateSheetApplyPillText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Sort bottom sheet
  sortSheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sortSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 36,
  },
  sortSheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#d1d5db',
  },
  sheetHandleArea: {
    width: '100%', paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  sortSheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 0, paddingBottom: 12,
  },
  sortSheetTitle: { fontSize: 18, fontWeight: '600', color: COLORS.Black[200] },
  sortResetText: { fontSize: 14, color: ORANGE, fontWeight: '600' },
  sortOptionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15,
  },
  sortOptionRowActive: { backgroundColor: '#fef9f5' },
  sortRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#d1d5db',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  sortRadioActive: { borderColor: ORANGE },
  sortRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: ORANGE },
  sortOptionLabel: { fontSize: 16, color: '#374151' },
  sortOptionLabelActive: { color: ORANGE, fontWeight: '600' },

  // Modal footer
  modalFooter: { padding: 16, borderTopWidth: 1, borderColor: '#e5e7eb' },
  applyBtn: {
    backgroundColor: ORANGE,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyBtnDisabled: { backgroundColor: '#f3f4f6' },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Print preview
  printPreviewSafe: { flex: 1, backgroundColor: '#f2f3f3' },
  printPreviewHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  printPreviewHeaderTitle: { fontSize: 13, fontWeight: '600', color: '#111' },
  // A4 paper: 210×297mm. Paper width = screen - 24px margin each side.
  // Scale ≈ paperWidth/595 pt, height = paperWidth * (297/210)
  printPreviewScroll: { padding: 12, alignItems: 'center' },
  printDoc: {
    backgroundColor: '#fff',
    width: Dimensions.get('window').width - 24,
    minHeight: (Dimensions.get('window').width - 24) * (297 / 210),
    padding: (Dimensions.get('window').width - 24) * 0.08, // ~17mm margin
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    marginBottom: 12,
  },
  printDocTitle: { fontSize: 11, fontWeight: '700', color: '#111' },
  printDocDate:  { fontSize: 7.5, color: '#6b7280', marginTop: 2 },
  printDocDivider: { height: 0.5, backgroundColor: '#9ca3af', marginVertical: 8 },
  printTableHeader: {
    flexDirection: 'row', paddingVertical: 4, gap: 6,
    borderBottomWidth: 0.5, borderColor: '#374151', marginBottom: 1,
  },
  printTableHeaderCell: { fontSize: 6.5, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.3 },
  printTableRow: {
    paddingVertical: 5,
    borderBottomWidth: 0.5, borderColor: '#e5e7eb',
  },
  printTableRowCols: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  printTableRowAlt: {},
  printTableCell: { fontSize: 7.5, color: '#374151' },
  printTableCellBold: { fontWeight: '700', color: '#111' },
  printStatusBadge: { borderRadius: 2, paddingHorizontal: 4, paddingVertical: 1, alignSelf: 'flex-start' },
  printStatusText: { fontSize: 7, fontWeight: '600' },
  printNoteRow: { width: '100%', paddingTop: 2, paddingLeft: 1 },
  printNotesContainer: {
    marginTop: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 2,
  },
  printNoteText: { fontSize: 6.5, color: '#6b7280', fontStyle: 'italic' },
  printNoteLabel: { fontWeight: '700', fontStyle: 'normal' },
  // Bottom sheet: print settings
  printSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  printSheetHeader: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  printSheetHandlePill: {
    width: 36, height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    marginBottom: 12,
  },
  printSheetTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 14,
  },
  printSheetTitleText: { fontSize: 16, fontWeight: '700', color: '#111' },
  printSheetPageCount: { fontSize: 14, color: '#6b7280' },
  printSheetDivider: { height: 1, backgroundColor: '#e5e7eb' },
  printSettingsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  printSettingsLabel: { fontSize: 14, color: '#111' },
  printSettingsSelect: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 7,
    minWidth: 150,
  },
  printSettingsSelectText: { flex: 1, fontSize: 13, color: '#374151' },
  printSettingsDivider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 2 },
  printCheckRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  printCheckbox: {
    width: 18, height: 18, borderWidth: 1.5, borderColor: '#9ca3af',
    borderRadius: 3, marginRight: 8, alignItems: 'center', justifyContent: 'center',
  },
  printCheckboxChecked: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  printCheckLabel: { fontSize: 13, color: '#374151' },
  printExternalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 11,
  },
  printExternalText: { fontSize: 13, color: '#374151' },

  printPreviewFooter: {
    paddingTop: 12, paddingHorizontal: 12, borderTopWidth: 1, borderColor: '#e5e7eb',
  },
  printConfirmBtn: {
    backgroundColor: '#111', borderRadius: 8, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  printConfirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Automations sheet
  autoSheetSubtitle: { fontSize: 13, color: '#6b7280', paddingHorizontal: 20, paddingBottom: 16, lineHeight: 18 },
  autoSection:       { paddingHorizontal: 20, paddingBottom: 16 },
  autoSectionTitle:  { fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 4 },
  autoSectionDesc:   { fontSize: 13, color: '#6b7280', lineHeight: 18, marginBottom: 12 },
  autoInputRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  autoInput: {
    width: 72, height: 36, borderWidth: 1, borderColor: '#d1d5db',
    borderRadius: 8, paddingHorizontal: 10, fontSize: 15, color: '#111',
    backgroundColor: '#fff',
  },
  autoInputSuffix:   { fontSize: 14, color: '#6b7280' },
  autoSeparator:     { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 20, marginBottom: 4 },
  autoCheckRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  autoCheckLabel:    { fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 2 },
  autoCheckDesc:     { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  autoFooter:        { paddingHorizontal: 20, paddingTop: 8 },

  filterSaveFooter:  { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  autoDoneBtn: {
    backgroundColor: '#e8722a', borderRadius: 8, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  autoDoneBtnText:   { color: '#fff', fontSize: 15, fontWeight: '700' },
});
