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
import FLAGS from '../../config/featureFlags';
import { COLORS } from '../../config/colors';
import type { RoomDaySchedule, DaySchedule, StaffNote } from './types';
import {
  ORANGE, NUM_DAYS, WINDOW_HEIGHT, HOUSEKEEPERS,
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
  ROOM_TYPE_OPTIONS, ROOM_STATUS_OPTIONS, CLEANING_STATUS_OPTIONS,
  DEFAULT_FILTERS, applyFilters, activeFilterCount,
} from './utils/filters';
import { shouldShowBedConfig } from './utils/bedConfig';
import styles from './styles';
import { type BadgeRect } from './components/CleaningControl';
import { RoomRow } from './components/RoomRow';
import { AnimatedRoomWrapper } from './components/AnimatedRoomWrapper';

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
  const [monthSheetVisible, setMonthSheetVisible] = useState(false);
  const [monthSheetCursor, setMonthSheetCursor] = useState(today); // any ISO date in the month being viewed
  const monthSheetAnim = useRef(new Animated.Value(0)).current;
  const monthSheetTranslateY = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (monthSheetVisible) {
      monthSheetTranslateY.setValue(600);
      monthSheetAnim.setValue(0);
      Animated.parallel([
        Animated.spring(monthSheetTranslateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }),
        Animated.spring(monthSheetAnim,       { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 220 }),
      ]).start();
    }
  }, [monthSheetVisible]);

  function closeMonthSheet() {
    Animated.parallel([
      Animated.timing(monthSheetTranslateY, { toValue: 600, duration: 200, useNativeDriver: true }),
      Animated.timing(monthSheetAnim,       { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(() => setMonthSheetVisible(false));
  }

  const monthSheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => { if (g.dy > 0) monthSheetTranslateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80) { closeMonthSheet(); }
        else { Animated.spring(monthSheetTranslateY, { toValue: 0, useNativeDriver: true }).start(); }
      },
    })
  ).current;

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
                <Text style={styles.sortSheetTitle}>{flags.compactCard ? 'Room details' : 'Notes'}</Text>
                <TouchableOpacity onPress={closeNotesSheet}>
                  <Text style={styles.sortResetText}>Done</Text>
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
                {/* Guest details — surfaced here only in compact card variant
                    (these fields are hidden from the room card to save space) */}
                {flags.compactCard && notesSheetItem && (
                  (flags.showGuestName && notesSheetItem.guestName) ||
                  (flags.showReservationId && notesSheetItem.reservationId) ||
                  (flags.showGuestPax && (notesSheetItem.adults > 0 || notesSheetItem.children > 0 || notesSheetItem.infants > 0)) ||
                  (flags.showBedConfig && shouldShowBedConfig(notesSheetItem.bedConfiguration))
                ) && (
                  <>
                    <Text style={styles.notesSheetSectionLabel}>Guest details</Text>
                    <View style={{ gap: 8, marginBottom: 12 }}>
                      {flags.showGuestName && notesSheetItem.guestName && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MaterialCommunityIcons name="card-account-details-outline" size={14} color={COLORS.Black[200]} />
                          <Text style={styles.notesSheetBody}>{notesSheetItem.guestName}</Text>
                        </View>
                      )}
                      {flags.showReservationId && notesSheetItem.reservationId && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MaterialCommunityIcons name="tag-outline" size={14} color={COLORS.Black[200]} />
                          <Text style={styles.notesSheetBody}>#{toBookingRef(notesSheetItem.reservationId)}</Text>
                        </View>
                      )}
                      {flags.showGuestPax && (notesSheetItem.adults > 0 || notesSheetItem.children > 0 || notesSheetItem.infants > 0) && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          {notesSheetItem.adults > 0 && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <MaterialCommunityIcons name="account-outline" size={14} color={COLORS.Black[200]} />
                              <Text style={styles.notesSheetBody}>{notesSheetItem.adults}</Text>
                            </View>
                          )}
                          {notesSheetItem.children > 0 && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <MaterialCommunityIcons name="account-child-outline" size={14} color={COLORS.Black[200]} />
                              <Text style={styles.notesSheetBody}>{notesSheetItem.children}</Text>
                            </View>
                          )}
                          {notesSheetItem.infants > 0 && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <MaterialCommunityIcons name="baby-face-outline" size={14} color={COLORS.Black[200]} />
                              <Text style={styles.notesSheetBody}>{notesSheetItem.infants}</Text>
                            </View>
                          )}
                        </View>
                      )}
                      {flags.showBedConfig && shouldShowBedConfig(notesSheetItem.bedConfiguration) && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MaterialCommunityIcons name="bed-outline" size={14} color={COLORS.Black[200]} />
                          <Text style={styles.notesSheetBody}>{notesSheetItem.bedConfiguration}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.notesSheetDivider} />
                  </>
                )}
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

            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
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

              {/* Date selector variant — segmented control (3 options) */}
              <View style={styles.demoVariantRow}>
                <Text style={[styles.demoFlagLabel, { flex: 0, marginRight: 0 }]}>Date picker</Text>
                <View style={styles.segmentedControl}>
                  {([
                    { value: 'range',      label: 'Date range sheet' },
                    { value: 'strip',      label: 'Date strip' },
                    { value: 'monthSheet', label: 'Date sheet' },
                  ] as { value: typeof FLAGS.dateSelectorVariant; label: string }[]).map(opt => {
                    const isActive = flags.dateSelectorVariant === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.segmentedBtn, isActive && styles.segmentedBtnActive]}
                        onPress={() => setFlags(prev => ({ ...prev, dateSelectorVariant: opt.value }))}
                      >
                        <Text style={[styles.segmentedBtnText, isActive && styles.segmentedBtnTextActive]} numberOfLines={1}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <View style={styles.dropdownDivider} />

              {([
                { key: 'showGuestName',         label: 'Guest name' },
                { key: 'showGuestPax',          label: 'Pax counts' },
                { key: 'showBedConfig',         label: 'Bed configuration' },
                { key: 'showLateCheckout',      label: 'Early check-in & late check-out badge' },
                { key: 'showReservationId',    label: 'Reservation ID' },
                { key: 'roomStatsChips',       label: 'Room stats as tappable chips' },
                { key: 'compactCard',          label: 'Compact room card (details in notes sheet)' },
              ] as { key: 'showGuestName' | 'showGuestPax' | 'showBedConfig' | 'showLateCheckout' | 'showReservationId' | 'roomStatsChips' | 'compactCard'; label: string }[]).map((item, i) => (
                <React.Fragment key={item.key}>
                  {i > 0 && <View style={styles.dropdownDivider} />}
                  <View style={styles.demoFlagRow}>
                    <Text style={styles.demoFlagLabel}>{item.label}</Text>
                    <Switch
                      value={flags[item.key] as boolean}
                      onValueChange={val => setFlags(prev => ({ ...prev, [item.key]: val }))}
                      trackColor={{ false: '#e5e7eb', true: ORANGE }}
                      thumbColor="#fff"
                    />
                  </View>
                </React.Fragment>
              ))}
            </ScrollView>
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
            <ScrollView>
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
            </ScrollView>

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

      {/* ── Select dates bottom sheet (only rendered in 'range' variant) ── */}
      <Modal visible={modalVisible && dateSelectorVariant === 'range'} animationType="none" transparent onRequestClose={closeDateSheet} statusBarTranslucent>
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

      {/* ── Month sheet (variant C — Figma 655:2956) ── */}
      <Modal visible={monthSheetVisible} animationType="none" transparent onRequestClose={closeMonthSheet} statusBarTranslucent>
        <Animated.View style={[styles.sortSheetOverlay, { opacity: monthSheetAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeMonthSheet} />
          <Animated.View style={[styles.monthSheet, { transform: [{ translateY: monthSheetTranslateY }] }]}>
            <View style={styles.sheetHandleArea} {...monthSheetPanResponder.panHandlers}>
              <View style={styles.dateSheetHandle} />
            </View>
            {(() => {
              const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
              const cursorDate = new Date(monthSheetCursor + 'T12:00:00');
              const year = cursorDate.getFullYear();
              const month = cursorDate.getMonth();
              const firstOfMonth = new Date(year, month, 1);
              const startDow = firstOfMonth.getDay(); // 0 = Sun
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              // 6 rows × 7 cols = 42 cells. Pad leading and trailing with nulls.
              const cells: (number | null)[] = [
                ...Array(startDow).fill(null),
                ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
              ];
              while (cells.length < 42) cells.push(null);
              const rows: (number | null)[][] = [];
              for (let i = 0; i < 6; i++) rows.push(cells.slice(i * 7, i * 7 + 7));
              const goPrev = () => {
                const d = new Date(year, month - 1, 1);
                setMonthSheetCursor(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
              };
              const goNext = () => {
                const d = new Date(year, month + 1, 1);
                setMonthSheetCursor(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`);
              };
              const todayDate = new Date(today + 'T12:00:00');
              const isToday = (day: number) => day === todayDate.getDate() && month === todayDate.getMonth() && year === todayDate.getFullYear();
              const selDate = new Date(selectedDate + 'T12:00:00');
              const isSelected = (day: number) => day === selDate.getDate() && month === selDate.getMonth() && year === selDate.getFullYear();
              const pickDay = (day: number) => {
                const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                setSelectedDate(iso);
                setWeekStart(iso);
                closeMonthSheet();
              };
              return (
                <>
                  <View style={styles.monthSheetHeader}>
                    <Text style={styles.monthSheetMonthYear}>{MONTH_LONG[month]} {year}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
                      <TouchableOpacity onPress={goPrev}>
                        <Ionicons name="chevron-back" size={22} color={ORANGE} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={goNext}>
                        <Ionicons name="chevron-forward" size={22} color={ORANGE} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.monthSheetDayRow}>
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                      <Text key={d} style={styles.monthSheetDayLabel}>{d}</Text>
                    ))}
                  </View>
                  <View style={styles.monthSheetGrid}>
                    {rows.map((row, ri) => (
                      <View key={ri} style={styles.monthSheetGridRow}>
                        {row.map((day, ci) => {
                          if (day === null) return <View key={ci} style={styles.monthSheetCell} />;
                          const sel = isSelected(day);
                          const td = isToday(day);
                          return (
                            <TouchableOpacity
                              key={ci}
                              style={[styles.monthSheetCell, sel && styles.monthSheetCellSelected]}
                              onPress={() => pickDay(day)}
                              activeOpacity={0.6}
                            >
                              <Text style={[
                                styles.monthSheetDayNum,
                                td && !sel && { color: ORANGE },
                                sel && styles.monthSheetDayNumSelected,
                              ]}>
                                {day}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                  <View style={{ height: insets.bottom + 16 }} />
                </>
              );
            })()}
            <TouchableOpacity onPress={closeMonthSheet} style={styles.monthSheetCloseBtn}>
              <Ionicons name="close" size={20} color={COLORS.Black[200]} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
    </SafeAreaView>
  );
}

