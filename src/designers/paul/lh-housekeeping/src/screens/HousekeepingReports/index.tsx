import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  SectionList,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@apollo/client';
import { GET_HOUSEKEEPING_SCHEDULE, GET_STAFF_NOTES, ADD_STAFF_NOTE, UPDATE_STAFF_NOTE } from '../../apollo/queries';
import { useHousekeepingStatus, RoomStatus } from '../../context/HousekeepingStatus';
import FLAGS from '../../config/featureFlags';
import { COLORS } from '../../config/colors';
import type { RoomDaySchedule, DaySchedule, StaffNote } from './types';
import {
  ORANGE, NUM_DAYS,
  STATUS_CONFIG,
} from './constants';
import {
  addDays, formatLong, formatShort, formatDayStrip, formatSectionHeader,
  formatCardDate, toBookingRef, formatTime,
} from './utils/dateFormat';
import {
  type SortField, type SortDirection, type SortState,
  SORT_OPTIONS, DEFAULT_SORT, sortRooms,
} from './utils/priority';
import {
  type FilterState,
  DEFAULT_FILTERS, applyFilters, activeFilterCount,
} from './utils/filters';
import { shouldShowBedConfig } from './utils/bedConfig';
import styles from './styles';
import { type BadgeRect } from './components/CleaningControl';
import { RoomRow } from './components/RoomRow';
import { AnimatedRoomWrapper } from './components/AnimatedRoomWrapper';
import { useBottomSheet } from './hooks/useBottomSheet';
import { NotesSheet } from './components/sheets/NotesSheet';
import { SortSheet } from './components/sheets/SortSheet';
import { AssignSheet } from './components/sheets/AssignSheet';
import { FilterSheet } from './components/sheets/FilterSheet';
import { DemoFlagsSheet } from './components/sheets/DemoFlagsSheet';
import { AutomationsSheet } from './components/sheets/AutomationsSheet';
import { PrintPreviewModal } from './components/sheets/PrintPreviewModal';
import { DateRangeSheet } from './components/sheets/DateRangeSheet';
import { MonthSheet } from './components/sheets/MonthSheet';

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
  const {
    visible: modalVisible, setVisible: setModalVisible, close: closeDateSheet,
    sheetAnim: dateSheetAnim, translateY: dateSheetTranslateY, panResponder: dateSheetPanResponder,
  } = useBottomSheet(600);
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
  const {
    visible: demoSheetVisible, setVisible: setDemoSheetVisible, close: closeDemoSheet,
    sheetAnim: demoSheetAnim, translateY: demoTranslateY, panResponder: demoPanResponder,
  } = useBottomSheet(400);

  // Filter state
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const {
    visible: filterSheetVisible, setVisible: setFilterSheetVisible, close: closeFilterSheet,
    sheetAnim: filterSheetAnim, translateY: filterTranslateY, panResponder: filterPanResponder,
  } = useBottomSheet(500);

  // Automations sheet state
  const {
    visible: autoSheetVisible, setVisible: setAutoSheetVisible, close: closeAutoSheet,
    sheetAnim: autoSheetAnim, translateY: autoTranslateY, panResponder: autoPanResponder,
  } = useBottomSheet(500);
  const [deepCleanDays, setDeepCleanDays] = useState('3');
  const [nightlyResetOccupied, setNightlyResetOccupied] = useState(false);
  const [resetAfterCheckout, setResetAfterCheckout] = useState(true);
  const [resetAfterClosure, setResetAfterClosure] = useState(true);
  // Demo variant: which date selector pattern to render (read from `flags`
  // state so the demo flags sheet can switch at runtime).
  const dateSelectorVariant = flags.dateSelectorVariant;
  const singleDateSelector = dateSelectorVariant === 'strip';
  const monthSheetVariant = dateSelectorVariant === 'monthSheet';

  // Active stat chip filter — only used when flags.roomStatsChips is on.
  // null = no chip selected (show everything).
  const [activeStatFilter, setActiveStatFilter] = useState<null | 'dirty' | 'earlyCheckIn' | 'lateCheckOut' | 'outOfOrder' | 'issues'>(null);
  // Clear the chip filter when switching away from the chips variant.
  useEffect(() => {
    if (!flags.roomStatsChips) setActiveStatFilter(null);
  }, [flags.roomStatsChips]);

  // Month sheet (variant C) state
  const {
    visible: monthSheetVisible, setVisible: setMonthSheetVisible, close: closeMonthSheet,
    sheetAnim: monthSheetAnim, translateY: monthSheetTranslateY, panResponder: monthSheetPanResponder,
  } = useBottomSheet(600);
  const [monthSheetCursor, setMonthSheetCursor] = useState(today); // any ISO date in the month being viewed

  function openMonthSheet() {
    setMonthSheetCursor(selectedDate || today);
    setMonthSheetVisible(true);
  }

  // When switching to a single-day variant (strip or monthSheet), drop any
  // active range view and snap back to single-day view so the UI is consistent.
  useEffect(() => {
    if (dateSelectorVariant !== 'range' && dateRange) {
      setDateRange(null);
      setSelectedDate(today);
      setWeekStart(today);
      if (modalVisible) closeDateSheet();
    }
  }, [dateSelectorVariant]);

  // Sort state
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const {
    visible: sortModalVisible, setVisible: setSortModalVisible, close: closeSortModal,
    sheetAnim: sortSheetAnim, translateY: sortTranslateY, panResponder: sortPanResponder,
  } = useBottomSheet(400);

  // Assign housekeeper state
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [assigningRoomId, setAssigningRoomId] = useState<string | null>(null);
  const {
    visible: assignModalVisible, setVisible: setAssignModalVisible, close: closeAssignModal,
    sheetAnim: assignSheetAnim, translateY: assignTranslateY, panResponder: assignPanResponder,
  } = useBottomSheet(400);

  function openAssignModal(roomId: string) {
    setAssigningRoomId(roomId);
    setAssignModalVisible(true);
  }

  function confirmAssignment() {
    closeAssignModal();
  }

  // Print preview state
  const [printPreviewVisible, setPrintPreviewVisible] = useState(false);
  const [moreSettingsExpanded, setMoreSettingsExpanded] = useState(false);
  const [headersAndFooters, setHeadersAndFooters] = useState(true);

  // Print settings sheet — standard bottom sheet pattern. The settings sheet
  // auto-opens when the print preview opens (and auto-closes when it closes).
  const {
    visible: printSettingsVisible, setVisible: setPrintSettingsVisible, close: closePrintSettings,
    sheetAnim: printSettingsSheetAnim, translateY: printSettingsTranslateY, panResponder: printSettingsPanResponder,
  } = useBottomSheet(500);

  useEffect(() => {
    if (printPreviewVisible) setPrintSettingsVisible(true);
    else setPrintSettingsVisible(false);
  }, [printPreviewVisible]);

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
  const {
    visible: notesSheetVisible, setVisible: setNotesSheetVisible, close: closeNotesSheet,
    sheetAnim: notesSheetAnim, translateY: notesSheetTranslateY, panResponder: notesSheetPanResponder,
  } = useBottomSheet(400);
  const [notesSheetItem, setNotesSheetItem] = useState<RoomDaySchedule | null>(null);
  const [notesSheetKey, setNotesSheetKey] = useState<string | null>(null);
  const [notesSheetEditing, setNotesSheetEditing] = useState(false);
  const [notesSheetDraft, setNotesSheetDraft] = useState('');
  const [newNoteTag, setNewNoteTag] = useState<'room' | 'guest'>('room');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

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
  // Chip-variant filter: only active when chip variant is on AND a chip is selected.
  const matchesActiveChip = (r: RoomDaySchedule): boolean => {
    if (!flags.roomStatsChips || !activeStatFilter) return true;
    if (activeStatFilter === 'dirty') {
      const s = statusOverrides[r.room.id] ?? r.room.status;
      return s === 'UNCLEANED' || s === 'DEEP_CLEAN';
    }
    if (activeStatFilter === 'earlyCheckIn') return r.checkInTime !== null;
    if (activeStatFilter === 'lateCheckOut') return r.lateCheckout && r.hasCheckoutToday;
    if (activeStatFilter === 'outOfOrder')   return r.room.isClosed;
    if (activeStatFilter === 'issues')       return r.room.notes !== null;
    return true;
  };
  const singleRooms: RoomDaySchedule[] = applyFilters(
    sortRooms(selectedDay?.rooms ?? [], sort, statusOverrides, notes, selectedDate),
    filters, notes, statusOverrides, selectedDate,
  ).filter(matchesActiveChip);

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
  // Predicates that match each stat — used both for counting and for the chip
  // variant's tap-to-filter behavior.
  type StatKey = 'dirty' | 'earlyCheckIn' | 'lateCheckOut' | 'outOfOrder' | 'issues';
  const statPredicates: Record<StatKey, (r: RoomDaySchedule) => boolean> = {
    dirty:        r => { const s = statusOverrides[r.room.id] ?? r.room.status; return s === 'UNCLEANED' || s === 'DEEP_CLEAN'; },
    earlyCheckIn: r => r.checkInTime !== null,
    lateCheckOut: r => r.lateCheckout && r.hasCheckoutToday,
    outOfOrder:   r => r.room.isClosed,
    issues:       r => r.room.notes !== null,
  };
  const dayStats = {
    dirty:        statsRooms.filter(statPredicates.dirty).length,
    earlyCheckIn: statsRooms.filter(statPredicates.earlyCheckIn).length,
    lateCheckOut: statsRooms.filter(statPredicates.lateCheckOut).length,
    outOfOrder:   statsRooms.filter(statPredicates.outOfOrder).length,
    issues:       statsRooms.filter(statPredicates.issues).length,
  };
  const BG = '#f2f3f3'; // matches screen background
  const statItems = ([
    { key: 'dirty',        value: dayStats.dirty,        label: 'Rooms dirty today'      },
    { key: 'earlyCheckIn', value: dayStats.earlyCheckIn, label: 'Early check-in today'   },
    { key: 'lateCheckOut', value: dayStats.lateCheckOut, label: 'Late check-out today'   },
    { key: 'outOfOrder',   value: dayStats.outOfOrder,   label: 'Out of order today'     },
    { key: 'issues',       value: dayStats.issues,       label: 'Issue reported today'   },
  ] as { key: StatKey; value: number; label: string }[]);

  const statsStrip = flags.roomStatsChips ? (
    // Chip variant — tappable filters
    <View style={{ position: 'relative' }}>
      <ScrollView
        ref={statsScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 8 }}
      >
        {statItems.map(stat => {
          const isActive = activeStatFilter === stat.key;
          return (
            <TouchableOpacity
              key={stat.key}
              style={[styles.statChip, isActive && styles.statChipActive]}
              onPress={() => setActiveStatFilter(isActive ? null : stat.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.statChipText, isActive && styles.statChipTextActive]}>
                {stat.value} {stat.label.replace(' today', '')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, flexDirection: 'row' }} pointerEvents="none">
        <View style={{ flex: 1, backgroundColor: `rgba(242,243,243,0)`    }} />
        <View style={{ flex: 1, backgroundColor: `rgba(242,243,243,0.3)`  }} />
        <View style={{ flex: 1, backgroundColor: `rgba(242,243,243,0.6)`  }} />
        <View style={{ flex: 1, backgroundColor: `rgba(242,243,243,0.85)` }} />
        <View style={{ flex: 1, backgroundColor: `rgba(242,243,243,1)`    }} />
      </View>
    </View>
  ) : (
    // Default — static informational strip
    <View style={{ position: 'relative' }}>
      <ScrollView
        ref={statsScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 24 }}
      >
        {statItems.map(stat => (
          <View key={stat.key} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </ScrollView>
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
          {monthSheetVariant ? (
            <TouchableOpacity onPress={openMonthSheet} activeOpacity={0.6} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.headerDate, dateRange && { fontSize: 15 }]} numberOfLines={1}>{headerText}</Text>
              <Ionicons name="chevron-down" size={18} color={COLORS.Black[200]} />
            </TouchableOpacity>
          ) : (
            <Text style={[styles.headerDate, dateRange && { fontSize: 15 }]} numberOfLines={1}>{headerText}</Text>
          )}
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

            {!dateRange && dateSelectorVariant === 'range' && (
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

      {/* ── Week strip (single-date variant) — mirrors Reservations screen ── */}
      {singleDateSelector && (() => {
        const DAY_NAMES_STRIP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        // 7 days centered around the selected date (Reservations pattern: -3 to +3)
        const stripDays: string[] = Array.from({ length: 7 }, (_, i) => addDays(selectedDate, i - 3));
        return (
          <View style={styles.weekStripWrapper}>
            <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, -7))} style={styles.weekArrow}>
              <Ionicons name="chevron-back" size={18} color="#484b4b" />
            </TouchableOpacity>
            <View style={styles.weekStrip}>
              {stripDays.map(d => {
                const isSelected = d === selectedDate;
                const isToday = d === today;
                const dayObj = new Date(d + 'T12:00:00');
                return (
                  <TouchableOpacity
                    key={d}
                    style={[styles.weekDay, isSelected && styles.weekDaySelected]}
                    onPress={() => setSelectedDate(d)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.weekDayName, isSelected && styles.weekDayNameSelected]}>
                      {DAY_NAMES_STRIP[dayObj.getDay()]}
                    </Text>
                    <Text style={[styles.weekDayNum, isSelected && styles.weekDayNumSelected, isToday && !isSelected && styles.weekDayNumToday]}>
                      {dayObj.getDate()}
                    </Text>
                    {isSelected && <View style={styles.weekDayUnderline} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, 7))} style={styles.weekArrow}>
              <Ionicons name="chevron-forward" size={18} color="#484b4b" />
            </TouchableOpacity>
          </View>
        );
      })()}

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

      <NotesSheet
        visible={notesSheetVisible}
        onClose={closeNotesSheet}
        sheetAnim={notesSheetAnim}
        translateY={notesSheetTranslateY}
        panResponder={notesSheetPanResponder}
        item={notesSheetItem}
        flags={flags}
        sheetNotes={sheetNotes}
        notesSheetEditing={notesSheetEditing}
        setNotesSheetEditing={setNotesSheetEditing}
        notesSheetDraft={notesSheetDraft}
        setNotesSheetDraft={setNotesSheetDraft}
        editingNoteId={editingNoteId}
        setEditingNoteId={setEditingNoteId}
        newNoteTag={newNoteTag}
        setNewNoteTag={setNewNoteTag}
        saveSheetNote={saveSheetNote}
        insetsBottom={insets.bottom}
      />

      <SortSheet
        visible={sortModalVisible}
        onClose={closeSortModal}
        sheetAnim={sortSheetAnim}
        translateY={sortTranslateY}
        panResponder={sortPanResponder}
        sort={sort}
        setSort={setSort}
      />

      <AssignSheet
        visible={assignModalVisible}
        onClose={closeAssignModal}
        sheetAnim={assignSheetAnim}
        translateY={assignTranslateY}
        panResponder={assignPanResponder}
        assigningRoomId={assigningRoomId}
        assignments={assignments}
        setAssignments={setAssignments}
        onConfirm={confirmAssignment}
      />

      <FilterSheet
        visible={filterSheetVisible}
        onClose={closeFilterSheet}
        sheetAnim={filterSheetAnim}
        translateY={filterTranslateY}
        panResponder={filterPanResponder}
        filters={filters}
        setFilters={setFilters}
        insetsBottom={insets.bottom}
      />

      <DemoFlagsSheet
        visible={demoSheetVisible}
        onClose={closeDemoSheet}
        sheetAnim={demoSheetAnim}
        translateY={demoTranslateY}
        panResponder={demoPanResponder}
        flags={flags}
        setFlags={setFlags}
        housekeeperMode={housekeeperMode}
        setHousekeeperMode={setHousekeeperMode}
        insetsBottom={insets.bottom}
      />

      <AutomationsSheet
        visible={autoSheetVisible}
        onClose={closeAutoSheet}
        sheetAnim={autoSheetAnim}
        translateY={autoTranslateY}
        panResponder={autoPanResponder}
        deepCleanDays={deepCleanDays}
        setDeepCleanDays={setDeepCleanDays}
        nightlyResetOccupied={nightlyResetOccupied}
        setNightlyResetOccupied={setNightlyResetOccupied}
        resetAfterCheckout={resetAfterCheckout}
        setResetAfterCheckout={setResetAfterCheckout}
        resetAfterClosure={resetAfterClosure}
        setResetAfterClosure={setResetAfterClosure}
        insetsBottom={insets.bottom}
      />

      <PrintPreviewModal
        visible={printPreviewVisible}
        onClose={() => setPrintPreviewVisible(false)}
        headerText={headerText}
        dateRange={dateRange}
        schedule={schedule}
        singleRooms={singleRooms}
        statusOverrides={statusOverrides}
        notes={notes}
        printSettingsVisible={printSettingsVisible}
        closePrintSettings={closePrintSettings}
        printSettingsSheetAnim={printSettingsSheetAnim}
        printSettingsTranslateY={printSettingsTranslateY}
        printSettingsPanResponder={printSettingsPanResponder}
        printPageCount={printPageCount}
        moreSettingsExpanded={moreSettingsExpanded}
        setMoreSettingsExpanded={setMoreSettingsExpanded}
        headersAndFooters={headersAndFooters}
        setHeadersAndFooters={setHeadersAndFooters}
        insetsTop={insets.top}
        insetsBottom={insets.bottom}
      />

      <DateRangeSheet
        visible={modalVisible && dateSelectorVariant === 'range'}
        onClose={closeDateSheet}
        sheetAnim={dateSheetAnim}
        translateY={dateSheetTranslateY}
        panResponder={dateSheetPanResponder}
        today={today}
        pendingStart={pendingStart}
        setPendingStart={setPendingStart}
        pendingEnd={pendingEnd}
        setPendingEnd={setPendingEnd}
        expandedField={expandedField}
        setExpandedField={setExpandedField}
        resetDateSheet={resetDateSheet}
        applyRange={applyRange}
      />

      <MonthSheet
        visible={monthSheetVisible}
        onClose={closeMonthSheet}
        sheetAnim={monthSheetAnim}
        translateY={monthSheetTranslateY}
        panResponder={monthSheetPanResponder}
        monthSheetCursor={monthSheetCursor}
        setMonthSheetCursor={setMonthSheetCursor}
        today={today}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        setWeekStart={setWeekStart}
        insetsBottom={insets.bottom}
      />
    </View>
    </SafeAreaView>
  );
}

