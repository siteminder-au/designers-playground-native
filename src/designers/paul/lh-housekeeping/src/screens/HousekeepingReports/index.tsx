import React, { useRef, useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@apollo/client';
import { GET_HOUSEKEEPING_SCHEDULE } from '../../apollo/queries';
import { useHousekeepingStatus, RoomStatus } from '../../context/HousekeepingStatus';
import { STATUS_VARIANT, SYMBOL_CONTAINER } from '../../config/statusVariant';
import FLAGS from '../../config/featureFlags';

interface RoomDaySchedule {
  isOccupied: boolean;
  guestCount: number;
  adults: number;
  children: number;
  infants: number;
  reservationId: string | null;
  guestName: string | null;
  checkIn: string | null;
  checkOut: string | null;
  lateCheckout: boolean;
  bedConfiguration: string;
  room: { id: string; number: string; type: string; status: RoomStatus };
}

interface DaySchedule {
  date: string;
  rooms: RoomDaySchedule[];
}

const ORANGE = '#e8722a';
const NUM_DAYS = 5;

const HOUSEKEEPERS = ['Maria S.', 'James T.', 'Jacqueline W.'];

const STATUS_CONFIG: Record<RoomStatus, { label: string; bg: string; text: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  CLEANED:       { label: 'Clean',         bg: '#dcfce7', text: '#15803d', icon: 'checkmark-circle'  },
  UNCLEANED:     { label: 'Dirty',         bg: '#fee2e2', text: '#b91c1c', icon: 'alert-circle'      },
  SKIP_CLEANING: { label: 'Skip Clean', bg: '#fef9c3', text: '#a16207', icon: 'remove-circle'     },
};

// 'symbol' variant — MaterialCommunityIcons with housekeeping-semantic meaning
// shimmer = sparkling clean · water = stain/spill (dirty) · do-not-disturb = skip service
type SymbolEntry =
  | { set: 'MI';  name: React.ComponentProps<typeof MaterialIcons>['name'];          color: string; tint: string }
  | { set: 'MCI'; name: React.ComponentProps<typeof MaterialCommunityIcons>['name']; color: string; tint: string };

const STATUS_SYMBOL: Record<RoomStatus, SymbolEntry> = {
  CLEANED:       { set: 'MI',  name: 'auto-awesome',      color: '#2d7d46', tint: '#dcfce7' },
  UNCLEANED:     { set: 'MI',  name: 'cleaning-services', color: '#b91c1c', tint: '#fee2e2' },
  SKIP_CLEANING: { set: 'MCI', name: 'sleep',             color: '#d97706', tint: '#fef9c3' },
};

function SymbolIcon({ entry, size }: { entry: SymbolEntry; size: number }) {
  if (entry.set === 'MCI') {
    return <MaterialCommunityIcons name={entry.name} size={size} color={entry.color} />;
  }
  return <MaterialIcons name={entry.name} size={size} color={entry.color} />;
}

// 'abbr' variant — text label is primary, border colour is secondary
const STATUS_ABBR: Record<RoomStatus, { label: string; fullLabel: string; color: string }> = {
  CLEANED:       { label: 'CLN',  fullLabel: 'Clean',         color: '#2d7d46' },
  UNCLEANED:     { label: 'DRT',  fullLabel: 'Dirty',         color: '#b91c1c' },
  SKIP_CLEANING: { label: 'SKP',  fullLabel: 'Skip Clean', color: '#d97706' },
};

type SortField = 'room_number' | 'room_type' | 'occupancy' | 'guest_count' | 'notes' | 'cleanliness';
type SortDirection = 'asc' | 'desc';
interface SortState { field: SortField; direction: SortDirection }

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'room_number', label: 'Room number' },
  { value: 'room_type',   label: 'Room type' },
  { value: 'occupancy',   label: 'Room status' },
  { value: 'guest_count', label: 'Number of guests' },
  { value: 'notes',       label: 'Room notes' },
  { value: 'cleanliness', label: 'Cleanliness status' },
];

const DEFAULT_SORT: SortState = { field: 'room_number', direction: 'asc' };


const STATUS_SORT_ORDER: Record<RoomStatus, number> = {
  UNCLEANED:     0,
  SKIP_CLEANING: 1,
  CLEANED:       2,
};

function sortRooms(
  rooms: RoomDaySchedule[],
  sort: SortState,
  overrides: Record<string, RoomStatus>,
  notes: Record<string, string>,
): RoomDaySchedule[] {
  const dir = sort.direction === 'asc' ? 1 : -1;
  return [...rooms].sort((a, b) => {
    let result = 0;
    switch (sort.field) {
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
        result = (notes[keyA] ? 1 : 0) - (notes[keyB] ? 1 : 0);
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
  const { label, bg, text, icon } = STATUS_CONFIG[status];

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

  // 'icon' — default/current
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      onPress={handlePress}
    >
      <View ref={ref} style={[styles.badge, styles.badgeInteractive, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={14} color={text} style={{ marginRight: 5 }} />
        <Text style={[styles.badgeText, { color: text }]}>{label}</Text>
        <Ionicons name="chevron-down" size={10} color={text} style={{ marginLeft: 3 }} />
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialIcons name="hotel" size={13} color="#111" />
            <Text style={styles.roomType}>{item.room.type}</Text>
            <View style={styles.roomTitleSep} />
            <Text style={[styles.occupancyStatusText, { color: item.isOccupied ? '#b91c1c' : '#2d7d46' }]}>
              {item.isOccupied ? 'Occupied' : 'Unoccupied'}
            </Text>
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

      {/* Row 3 (occupied): guest name · pax counts · dates — individually flagged */}
      {item.isOccupied && (flags.showGuestName || flags.showGuestPax || flags.showGuestDates) && (
        <View style={styles.guestInfoSection}>
          <View style={styles.guestDatesRow}>
            {flags.showGuestName && item.guestName && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialCommunityIcons name="card-account-details-outline" size={13} color="#111" />
                <Text style={styles.guestNameText}>{item.guestName}</Text>
              </View>
            )}
            {flags.showGuestName && flags.showGuestPax && <View style={styles.bedConfigPipe} />}
            {flags.showGuestPax && (
              <>
                {item.adults > 0 && (
                  <View style={styles.occupancyItem}>
                    <MaterialCommunityIcons name="account" size={13} color="#6b7280" />
                    <Text style={styles.occupancyCount}>{item.adults}</Text>
                  </View>
                )}
                {item.children > 0 && (
                  <View style={styles.occupancyItem}>
                    <MaterialCommunityIcons name="human-child" size={13} color="#6b7280" />
                    <Text style={styles.occupancyCount}>{item.children}</Text>
                  </View>
                )}
                {item.infants > 0 && (
                  <View style={styles.occupancyItem}>
                    <MaterialCommunityIcons name="baby-carriage" size={13} color="#6b7280" />
                    <Text style={styles.occupancyCount}>{item.infants}</Text>
                  </View>
                )}
              </>
            )}
          </View>
          {(flags.showGuestDates || flags.showLateCheckout) && (
            <View style={styles.guestBadgeRow}>
              {flags.showGuestDates && item.checkIn && item.checkOut && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="calendar-outline" size={12} color="#111" />
                  <Text style={styles.guestDatesText}>
                    {formatCardDate(item.checkIn)} → {formatCardDate(item.checkOut)}
                  </Text>
                </View>
              )}
              {flags.showLateCheckout && item.lateCheckout && (
                <View style={styles.lateCheckoutBadge}>
                  <Text style={styles.lateCheckoutText}>Late checkout</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      <View style={styles.noteArea}>
        <View style={styles.noteActionRow}>
          {note ? (
            <TouchableOpacity onPress={onNotePress} style={[styles.noteRow, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
              <Text numberOfLines={2} style={[styles.noteText, { flex: 1 }]}>{note}</Text>
              <Ionicons name="pencil-outline" size={14} color={ORANGE} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onNotePress} style={styles.noteRow}>
              <Text style={styles.addNoteText}>+ Notes</Text>
            </TouchableOpacity>
          )}
          {flags.showAssignHousekeeper && <View style={styles.noteAssignDivider} />}
          {flags.showAssignHousekeeper && <TouchableOpacity style={styles.assignBtn} onPress={onAssignPress}>
            {assignedTo ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[styles.assignBtnText, { maxWidth: 58, textAlign: 'left' }]} numberOfLines={1}>{assignedTo}</Text>
                <Ionicons name="swap-horizontal-outline" size={13} color={ORANGE} />
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.assignBtnText}>Assign</Text>
                <Ionicons name="add" size={14} color={ORANGE} />
              </View>
            )}
          </TouchableOpacity>}
        </View>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function HousekeepingScreen() {
  const insets = useSafeAreaInsets();
  const today = new Date().toISOString().split('T')[0];

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
  const { statusOverrides, setStatusOverride } = useHousekeepingStatus();
  const [statusDropdown, setStatusDropdown] = useState<{
    roomId: string;
    currentStatus: RoomStatus;
    x: number; y: number; width: number; height: number;
  } | null>(null);

  // Feature flags (runtime toggles for demo)
  const [flags, setFlags] = useState({ ...FLAGS });
  const [demoSheetVisible, setDemoSheetVisible] = useState(false);
  const demoSheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (demoSheetVisible) {
      Animated.spring(demoSheetAnim, { toValue: 1, useNativeDriver: false, friction: 8 }).start();
    }
  }, [demoSheetVisible]);

  function closeDemoSheet() {
    Animated.timing(demoSheetAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => setDemoSheetVisible(false));
  }

  // Sort state
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const sortSheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (sortModalVisible) {
      sortSheetAnim.setValue(0);
      Animated.spring(sortSheetAnim, {
        toValue: 1, useNativeDriver: true,
        damping: 22, stiffness: 220,
      }).start();
    }
  }, [sortModalVisible]);

  function closeSortModal() {
    Animated.timing(sortSheetAnim, {
      toValue: 0, duration: 200, useNativeDriver: true,
    }).start(() => setSortModalVisible(false));
  }

  // Assign housekeeper state
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assigningRoomId, setAssigningRoomId] = useState<string | null>(null);
  const assignSheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (assignModalVisible) {
      assignSheetAnim.setValue(0);
      Animated.spring(assignSheetAnim, {
        toValue: 1, useNativeDriver: true,
        damping: 22, stiffness: 220,
      }).start();
    }
  }, [assignModalVisible]);

  function openAssignModal(roomId: string) {
    setAssigningRoomId(roomId);
    setAssignModalVisible(true);
  }

  function closeAssignModal() {
    Animated.timing(assignSheetAnim, {
      toValue: 0, duration: 200, useNativeDriver: true,
    }).start(() => setAssignModalVisible(false));
  }

  function confirmAssignment() {
    closeAssignModal();
  }

  // Print preview state
  const [printPreviewVisible, setPrintPreviewVisible] = useState(false);
  const [moreSettingsExpanded, setMoreSettingsExpanded] = useState(false);
  const [headersAndFooters, setHeadersAndFooters] = useState(true);
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const settingsSheetAnim = useRef(new Animated.Value(0)).current;

  function toggleSettingsSheet() {
    setSettingsSheetOpen(v => {
      const next = !v;
      Animated.spring(settingsSheetAnim, {
        toValue: next ? 1 : 0,
        useNativeDriver: false,
        friction: 8,
      }).start();
      return next;
    });
  }

  // Notes state
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState('');

  // Query: either the current week or the selected range
  const queryStart = dateRange?.start ?? weekStart;
  const queryEnd   = dateRange?.end   ?? addDays(weekStart, NUM_DAYS - 1);

  const { data, loading, error } = useQuery(GET_HOUSEKEEPING_SCHEDULE, {
    variables: { startDate: queryStart, endDate: queryEnd },
  });

  const schedule: DaySchedule[] = data?.housekeepingSchedule ?? [];
  const visibleDates = Array.from({ length: NUM_DAYS }, (_, i) => addDays(weekStart, i));

  // Single-day view
  const selectedDay = schedule.find(d => d.date === selectedDate);
  const singleRooms: RoomDaySchedule[] = sortRooms(selectedDay?.rooms ?? [], sort, statusOverrides, notes);
  const printTotalRows = (dateRange ? schedule.flatMap(d => d.rooms) : singleRooms).length;
  const printPageCount = Math.max(1, Math.ceil(printTotalRows / 22));

  // Range view sections
  const rangeSections = schedule.map(day => ({
    title: formatSectionHeader(day.date, today),
    data: sortRooms(day.rooms, sort, statusOverrides, notes),
  }));

  function openModal() {
    setPendingStart(null);
    setPendingEnd(null);
    setExpandedField('start');
    setModalVisible(true);
  }

  function applyRange() {
    if (!pendingStart || !pendingEnd) return;
    setDateRange({ start: pendingStart, end: pendingEnd });
    setModalVisible(false);
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
    setStatusOverride(statusDropdown.roomId, newStatus);
    setStatusDropdown(null);
  }


  function openNotesModal(noteKey: string) {
    setEditingRoomId(noteKey);
    setDraftNote(notes[noteKey] ?? '');
    setNotesModalVisible(true);
  }

  function saveNote() {
    if (!editingRoomId) return;
    setNotes(prev => ({ ...prev, [editingRoomId]: draftNote.trim() }));
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
        <View>
          <Text style={styles.headerLabel}>HOUSEKEEPING</Text>
          <Text style={styles.headerDate} numberOfLines={1}>{headerText}</Text>
        </View>
        {dateRange && (
          <TouchableOpacity onPress={clearRange} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.printBtn} onPress={() => setPrintPreviewVisible(true)}>
          <Ionicons name="print-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* ── Controls row: date strip (60%) + select dates (40%) ── */}
      <View style={styles.controlsRow}>

        {/* Date strip — 60% */}
        <View style={styles.stripContainer}>
          <TouchableOpacity
            style={styles.arrow}
            onPress={() => {
              const s = addDays(weekStart, -NUM_DAYS);
              setWeekStart(s);
              if (!dateRange) setSelectedDate(s);
            }}
          >
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>

          {visibleDates.map(d => {
            const { day, date } = formatDayStrip(d);
            const isSelected = !dateRange && d === selectedDate;
            return (
              <TouchableOpacity
                key={d}
                style={styles.dayBtn}
                onPress={() => { setSelectedDate(d); setDateRange(null); }}
              >
                <Text style={[styles.dayLabel, isSelected && styles.activeText]}>{day}</Text>
                <Text style={[styles.dayNum, isSelected && styles.activeText]}>{date}</Text>
                {isSelected && <View style={styles.dayUnderline} />}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.arrow}
            onPress={() => {
              const s = addDays(weekStart, NUM_DAYS);
              setWeekStart(s);
              if (!dateRange) setSelectedDate(s);
            }}
          >
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Vertical divider */}
        <View style={styles.verticalDivider} />

        {/* Select dates — 40% */}
        <TouchableOpacity style={styles.selectDatesBtn} onPress={openModal}>
          <Text style={styles.selectDatesText}>Select dates</Text>
        </TouchableOpacity>
      </View>

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
        <TouchableOpacity style={styles.demoBtn} onPress={() => setDemoSheetVisible(true)}>
          <Ionicons name="flask-outline" size={14} color="#6b7280" style={{ marginRight: 4 }} />
          <Text style={styles.demoBtnText}>Demo</Text>
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
              <RoomRow
                item={item}
                status={effectiveStatus}
                note={notes[noteKey] ?? ''}
                bedConfig={bedConfig}
                flags={flags}
                onNotePress={() => openNotesModal(noteKey)}
                onStatusPress={(rect) => openStatusDropdown(item.room.id, effectiveStatus, rect)}
                assignedTo={assignments[item.room.id] ?? null}
                onAssignPress={() => openAssignModal(item.room.id)}
              />
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          stickySectionHeadersEnabled
          style={{ backgroundColor: '#f5f5f5' }}
          contentContainerStyle={{ paddingTop: 0, paddingBottom: 32 }}
        />
      ) : (
        <FlatList
          data={singleRooms}
          keyExtractor={item => item.room.id}
          renderItem={({ item }) => {
            const effectiveStatus = statusOverrides[item.room.id] ?? item.room.status;
            const noteKey = item.reservationId ?? item.room.id;
            const bedConfig = item.bedConfiguration;
            return (
              <RoomRow
                item={item}
                status={effectiveStatus}
                note={notes[noteKey] ?? ''}
                bedConfig={bedConfig}
                flags={flags}
                onNotePress={() => openNotesModal(noteKey)}
                onStatusPress={(rect) => openStatusDropdown(item.room.id, effectiveStatus, rect)}
                assignedTo={assignments[item.room.id] ?? null}
                onAssignPress={() => openAssignModal(item.room.id)}
              />
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          style={{ backgroundColor: '#f5f5f5' }}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No room data for this date.</Text>}
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
              {(Object.keys(STATUS_CONFIG) as RoomStatus[]).map((s, i) => {
                const isActive = (statusOverrides[statusDropdown.roomId] ?? statusDropdown.currentStatus) === s;
                return (
                  <React.Fragment key={s}>
                    {i > 0 && <View style={styles.dropdownDivider} />}
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

      {/* ── Sort bottom sheet ── */}
      <Modal visible={sortModalVisible} animationType="none" transparent onRequestClose={closeSortModal}>
        <Animated.View style={[styles.sortSheetOverlay, { opacity: sortSheetAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeSortModal} />
          <Animated.View style={[styles.sortSheet, { transform: [{ translateY: sortSheetAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }] }]}>
            <View style={styles.sortSheetHandle} />
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
                  {i > 0 && <View style={styles.dropdownDivider} />}
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
          <Animated.View style={[styles.sortSheet, { transform: [{ translateY: assignSheetAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }] }]}>
            <View style={styles.sortSheetHandle} />
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
                  {i > 0 && <View style={styles.dropdownDivider} />}
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

      {/* ── Demo flags bottom sheet ── */}
      <Modal visible={demoSheetVisible} animationType="none" transparent onRequestClose={closeDemoSheet}>
        <Animated.View style={[styles.sortSheetOverlay, { opacity: demoSheetAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeDemoSheet} />
          <Animated.View style={[styles.sortSheet, { transform: [{ translateY: demoSheetAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }] }]}>
            <View style={styles.sortSheetHandle} />
            <View style={styles.sortSheetHeader}>
              <Text style={styles.sortSheetTitle}>Demo flags</Text>
              <TouchableOpacity onPress={() => setFlags({ ...FLAGS })}>
                <Text style={styles.sortResetText}>Reset</Text>
              </TouchableOpacity>
            </View>
            {([
              { key: 'showGuestName',         label: 'Guest name' },
              { key: 'showGuestPax',          label: 'Pax counts' },
              { key: 'showGuestDates',        label: 'Check-in / check-out dates' },
              { key: 'showBedConfig',         label: 'Bed configuration' },
              { key: 'showLateCheckout',      label: 'Late checkout badge' },
              { key: 'showAssignHousekeeper', label: 'Assign housekeeper' },
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
                <Text style={[styles.printTableHeaderCell, { flex: 1 }]}>Room</Text>
                <Text style={[styles.printTableHeaderCell, { flex: 2 }]}>Type</Text>
                <Text style={[styles.printTableHeaderCell, { flex: 1.5 }]}>Occupancy</Text>
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
                      <Text style={[styles.printTableCell, styles.printTableCellBold, { flex: 1 }]}>{item.room.number}</Text>
                      <Text style={[styles.printTableCell, { flex: 2 }]}>{item.room.type}</Text>
                      <Text style={[styles.printTableCell, { flex: 1.5 }]}>
                        {item.isOccupied ? `${item.guestCount} guest${item.guestCount !== 1 ? 's' : ''}` : 'Vacant'}
                      </Text>
                      <View style={[styles.printStatusBadge, { backgroundColor: cfg.bg, flex: 1.3 }]}>
                        <Text style={[styles.printStatusText, { color: cfg.text }]}>{cfg.label}</Text>
                      </View>
                    </View>
                    {!!note && (
                      <View style={styles.printNoteRow}>
                        <Text style={styles.printNoteText}><Text style={styles.printNoteLabel}>Note: </Text>{note}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

          </ScrollView>

          {/* ── Bottom sheet: print settings ── */}
          <View style={styles.printSheet}>
            {/* Tappable header */}
            <TouchableOpacity style={styles.printSheetHeader} onPress={toggleSettingsSheet} activeOpacity={0.8}>
              <View style={styles.printSheetHandlePill} />
              <View style={styles.printSheetTitleRow}>
                <Text style={styles.printSheetTitleText}>Print Settings</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.printSheetPageCount}>{printPageCount} page{printPageCount !== 1 ? 's' : ''}</Text>
                  <Ionicons name={settingsSheetOpen ? 'chevron-down' : 'chevron-up'} size={16} color="#6b7280" />
                </View>
              </View>
            </TouchableOpacity>

            {/* Expandable settings */}
            <Animated.View style={{
              maxHeight: settingsSheetAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 500] }),
              overflow: 'hidden',
            }}>
              <View style={styles.printSheetDivider} />

              <View style={styles.printSettingsRow}>
                <Text style={styles.printSettingsLabel}>Destination</Text>
                <View style={styles.printSettingsSelect}>
                  <Ionicons name="document-outline" size={15} color="#6b7280" />
                  <Text style={styles.printSettingsSelectText}>Save as PDF</Text>
                  <Ionicons name="chevron-down" size={13} color="#6b7280" />
                </View>
              </View>

              <View style={styles.printSettingsRow}>
                <Text style={styles.printSettingsLabel}>Pages</Text>
                <View style={styles.printSettingsSelect}>
                  <Text style={styles.printSettingsSelectText}>All</Text>
                  <Ionicons name="chevron-down" size={13} color="#6b7280" />
                </View>
              </View>

              <View style={styles.printSettingsRow}>
                <Text style={styles.printSettingsLabel}>Layout</Text>
                <View style={styles.printSettingsSelect}>
                  <Text style={styles.printSettingsSelectText}>Portrait</Text>
                  <Ionicons name="chevron-down" size={13} color="#6b7280" />
                </View>
              </View>

              <View style={styles.printSettingsDivider} />

              <TouchableOpacity style={styles.printSettingsRow} onPress={() => setMoreSettingsExpanded(v => !v)}>
                <Text style={styles.printSettingsLabel}>More settings</Text>
                <Ionicons name={moreSettingsExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#111" />
              </TouchableOpacity>

              {moreSettingsExpanded && (
                <>
                  <View style={styles.printSettingsRow}>
                    <Text style={styles.printSettingsLabel}>Paper size</Text>
                    <View style={styles.printSettingsSelect}>
                      <Text style={styles.printSettingsSelectText}>A4</Text>
                      <Ionicons name="chevron-down" size={13} color="#6b7280" />
                    </View>
                  </View>
                  <View style={styles.printSettingsRow}>
                    <Text style={styles.printSettingsLabel}>Pages per sheet</Text>
                    <View style={styles.printSettingsSelect}>
                      <Text style={styles.printSettingsSelectText}>1</Text>
                      <Ionicons name="chevron-down" size={13} color="#6b7280" />
                    </View>
                  </View>
                  <View style={styles.printSettingsRow}>
                    <Text style={styles.printSettingsLabel}>Margins</Text>
                    <View style={styles.printSettingsSelect}>
                      <Text style={styles.printSettingsSelectText}>Default</Text>
                      <Ionicons name="chevron-down" size={13} color="#6b7280" />
                    </View>
                  </View>
                  <View style={styles.printSettingsRow}>
                    <Text style={styles.printSettingsLabel}>Scale</Text>
                    <View style={styles.printSettingsSelect}>
                      <Text style={styles.printSettingsSelectText}>Default</Text>
                      <Ionicons name="chevron-down" size={13} color="#6b7280" />
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
                    <Ionicons name="open-outline" size={14} color="#374151" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.printExternalRow}>
                    <Text style={styles.printExternalText}>Open PDF in Preview</Text>
                    <Ionicons name="open-outline" size={14} color="#374151" />
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>

            {/* Print button */}
            <View style={[styles.printPreviewFooter, { paddingBottom: insets.bottom + 12 }]}>
              <TouchableOpacity style={styles.printConfirmBtn}>
                <Ionicons name="print-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.printConfirmBtnText}>Print</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Select dates modal ── */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="fullScreen">
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>

          {/* Modal header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#111" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select dates</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView>
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
              <Ionicons
                name={expandedField === 'start' ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#9ca3af"
              />
            </TouchableOpacity>

            {expandedField === 'start' && (
              <Calendar
                onDayPress={(day: { dateString: string }) => {
                  setPendingStart(day.dateString);
                  setExpandedField('end');
                }}
                markedDates={pendingStart ? { [pendingStart]: { selected: true, selectedColor: ORANGE } } : {}}
                theme={{ selectedDayBackgroundColor: ORANGE, todayTextColor: ORANGE, arrowColor: ORANGE }}
              />
            )}

            {/* Divider */}
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
              <Ionicons
                name={expandedField === 'end' ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#9ca3af"
              />
            </TouchableOpacity>

            {expandedField === 'end' && (
              <Calendar
                minDate={pendingStart ?? undefined}
                onDayPress={(day: { dateString: string }) => {
                  setPendingEnd(day.dateString);
                  setExpandedField(null);
                }}
                markedDates={pendingEnd ? { [pendingEnd]: { selected: true, selectedColor: ORANGE } } : {}}
                theme={{ selectedDayBackgroundColor: ORANGE, todayTextColor: ORANGE, arrowColor: ORANGE }}
              />
            )}
          </ScrollView>

          {/* Apply button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.applyBtn, (!pendingStart || !pendingEnd) && styles.applyBtnDisabled]}
              onPress={applyRange}
              disabled={!pendingStart || !pendingEnd}
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>

        </View>
      </Modal>
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
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  headerLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600', letterSpacing: 1 },
  headerDate:  { fontSize: 22, fontWeight: '700', color: '#111', marginTop: 2 },
  clearBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  clearBtnText: { fontSize: 13, color: '#9ca3af' },
  printBtn: { padding: 4, marginLeft: 8 },
  sortToolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: 16,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: '#f5f5f5',
  },
  sortBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortBtnText: { fontSize: 13, color: ORANGE, fontWeight: '600' },
  sortToolbarSep: { width: 1, height: 14, backgroundColor: '#d1d5db', marginHorizontal: 12 },
  demoBtn:     { flexDirection: 'row', alignItems: 'center' },
  demoBtnText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },

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
    marginHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 12,
  },
  rowTop:   { flexDirection: 'row', alignItems: 'center' },
  rowLeft:  { flex: 1, gap: 6 },
  rowRight: { flexDirection: 'row', gap: 24, alignItems: 'center' },

  cardDivider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: -16, marginTop: 12 },

  // Notes area
  noteArea: { marginTop: 16, borderTopWidth: 1, borderColor: '#e5e7eb', marginHorizontal: -12, paddingHorizontal: 12, paddingTop: 12 },
  noteActionRow: { flexDirection: 'row', alignItems: 'center' },
  noteRow:  { flex: 1 },
  noteAssignDivider: { width: 1, alignSelf: 'stretch', backgroundColor: '#e5e7eb', marginHorizontal: 12 },
  noteActionDivider: { width: 1, height: 16, backgroundColor: '#d1d5db', marginHorizontal: 8 },
  assignBtn: { width: 80, alignItems: 'flex-end' },
  assignBtnText: { fontSize: 13, color: ORANGE, fontWeight: '600', textAlign: 'right' },
  noteText: { fontSize: 13, color: '#374151', fontStyle: 'italic', lineHeight: 18 },
  editNoteBtn:     { paddingLeft: 4 },
  editNoteBtnText: { fontSize: 13, color: ORANGE, fontWeight: '600' },
  addNoteText:     { fontSize: 13, color: ORANGE, fontWeight: '600' },

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
  roomNumber:   { fontSize: 14, fontWeight: '600', color: '#111' },
  roomTitleSep: { width: 2, height: 2, borderRadius: 1, backgroundColor: '#9ca3af' },
  roomType:     { fontSize: 12, fontWeight: '500', color: '#111', flexShrink: 1 },

  // Guest info section
  guestInfoSection: {
    marginTop: 16,
  },
  guestNameText: { fontSize: 12, fontWeight: '500', color: '#111' },
  guestDatesRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  guestBadgeRow: { flexDirection: 'row', gap: 16, marginTop: 16 },
  guestDatesText: { fontSize: 12, color: '#111' },
  lateCheckoutBadge: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  lateCheckoutText: { fontSize: 11, fontWeight: '600', color: '#c2410c' },

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
  occupancyCount: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
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
  sectionHeader:   { backgroundColor: '#f5f5f5', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 },
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
  sortDirToggle: { padding: 6, marginLeft: 0 },

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
    alignSelf: 'center',
    marginTop: 10, marginBottom: 2,
  },
  sortSheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12,
  },
  sortSheetTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', letterSpacing: 0.5 },
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
  printPreviewSafe: { flex: 1, backgroundColor: '#f5f5f5' },
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
  printDocTitle: { fontSize: 13, fontWeight: '700', color: '#111' },
  printDocDate:  { fontSize: 9, color: '#6b7280', marginTop: 2 },
  printDocDivider: { height: 0.5, backgroundColor: '#9ca3af', marginVertical: 8 },
  printTableHeader: {
    flexDirection: 'row', paddingVertical: 4,
    borderBottomWidth: 0.5, borderColor: '#374151', marginBottom: 1,
  },
  printTableHeaderCell: { fontSize: 7.5, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.3 },
  printTableRow: {
    paddingVertical: 5,
    borderBottomWidth: 0.5, borderColor: '#e5e7eb',
  },
  printTableRowCols: {
    flexDirection: 'row', alignItems: 'center',
  },
  printTableRowAlt: {},
  printTableCell: { fontSize: 9, color: '#374151' },
  printTableCellBold: { fontWeight: '700', color: '#111' },
  printStatusBadge: { borderRadius: 2, paddingHorizontal: 4, paddingVertical: 1, alignSelf: 'flex-start' },
  printStatusText: { fontSize: 8, fontWeight: '600' },
  printNoteRow: { width: '100%', paddingTop: 2, paddingLeft: 1 },
  printNoteText: { fontSize: 7.5, color: '#6b7280', fontStyle: 'italic' },
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
    width: '100%',
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
});
