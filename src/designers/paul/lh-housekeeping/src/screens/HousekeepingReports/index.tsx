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
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@apollo/client';
import { GET_HOUSEKEEPING_SCHEDULE } from '../../apollo/queries';
import { useHousekeepingStatus, RoomStatus } from '../../context/HousekeepingStatus';
import FLAGS from '../../config/featureFlags';
import { COLORS } from '../../config/colors';
import {
  RoomDaySchedule, DaySchedule, PlaceholderRow, StatsRow, ScheduleRow,
  SortState, FilterState, BadgeRect,
  ORANGE, NUM_DAYS, DAYS_PER_PAGE, HOUSEKEEPERS,
  STATUS_CONFIG,
  SORT_OPTIONS, DEFAULT_SORT, DEFAULT_FILTERS,
} from './types';
import {
  sortRooms, applyFilters, activeFilterCount,
  addDays, formatLong, formatShort, formatDayStrip, formatSectionHeader,
} from './utils';
import { styles } from './styles';
import { CleaningControl } from './CleaningControl';
import { RoomRow } from './RoomRow';
import { StatsStrip } from './StatsStrip';
import { DatePickerOverlay } from './DatePickerOverlay';
import { SortSheet } from './SortSheet';
import { FilterSheet } from './FilterSheet';
import { AutomationsSheet } from './AutomationsSheet';

// ── Main screen ───────────────────────────────────────────────────────────────

export default function HousekeepingScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const today = new Date().toISOString().split('T')[0];

  // Strip state
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekStart, setWeekStart] = useState(today);

  // Range state
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  // Select-dates modal state
  const [modalVisible, setModalVisible] = useState(false);

  // Status overrides (shared via context for cross-screen sync)
  const { statusOverrides, setStatusOverride, housekeeperMode, setHousekeeperMode } = useHousekeepingStatus();
  const [statusDropdown, setStatusDropdown] = useState<{
    roomId: string;
    currentStatus: RoomStatus;
    x: number; y: number; width: number; height: number;
  } | null>(null);

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

  // Automations sheet state
  const [autoSheetVisible, setAutoSheetVisible] = useState(false);
  const [deepCleanDays, setDeepCleanDays] = useState('3');
  const [nightlyResetOccupied, setNightlyResetOccupied] = useState(false);
  const [resetAfterCheckout, setResetAfterCheckout] = useState(true);
  const [resetAfterClosure, setResetAfterClosure] = useState(true);

  // Pagination state (range view only)
  const [currentPage, setCurrentPage] = useState(0);
  const [revealedCount, setRevealedCount] = useState(1);
  const revealTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rangeListRef = useRef<any>(null);

  // Sort state
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const [sortModalVisible, setSortModalVisible] = useState(false);

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

  // Notes state
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState('');

  // Notes detail sheet state
  const [notesSheetVisible, setNotesSheetVisible] = useState(false);
  const [notesSheetItem, setNotesSheetItem] = useState<RoomDaySchedule | null>(null);
  const [notesSheetKey, setNotesSheetKey] = useState<string | null>(null);
  const [notesSheetEditing, setNotesSheetEditing] = useState(false);
  const [notesSheetDraft, setNotesSheetDraft] = useState('');
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
    pollInterval: 3000,
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

  // Pagination: reset to page 0 when date range changes
  useEffect(() => {
    setCurrentPage(0);
  }, [dateRange?.start, dateRange?.end]);

  // Pause stagger timers while the date picker modal is open (prevents re-render interference)
  useEffect(() => {
    if (modalVisible) {
      revealTimers.current.forEach(clearTimeout);
      revealTimers.current = [];
    }
  }, [modalVisible]);

  // Lazy loading: stagger-reveal each day's cards on the current page
  useEffect(() => {
    if (!dateRange || !schedule.length) return;
    revealTimers.current.forEach(clearTimeout);
    revealTimers.current = [];
    setRevealedCount(1);
    for (let i = 1; i < DAYS_PER_PAGE; i++) {
      const t = setTimeout(() => setRevealedCount(i + 1), i * 300);
      revealTimers.current.push(t);
    }
    return () => { revealTimers.current.forEach(clearTimeout); };
  }, [currentPage, dateRange?.start, dateRange?.end, schedule.length]);

  const filterCount = activeFilterCount(filters);

  // Single-day view
  const selectedDay = schedule.find(d => d.date === selectedDate);
  const singleRooms: RoomDaySchedule[] = applyFilters(
    sortRooms(selectedDay?.rooms ?? [], sort, statusOverrides, notes, selectedDate),
    filters, notes, statusOverrides, selectedDate,
  );
  const printTotalRows = (dateRange ? schedule.flatMap(d => d.rooms) : singleRooms).length;
  const printPageCount = Math.max(1, Math.ceil(printTotalRows / 22));

  // Stats strip — always computed from the selected/start date, unfiltered
  const statsRooms = selectedDay?.rooms ?? [];

  // Range view — paginated + lazy-revealed
  const allRangeSections: { title: string; date: string; data: ScheduleRow[] }[] = schedule
    .map(day => {
      const filtered = applyFilters(sortRooms(day.rooms, sort, statusOverrides, notes, day.date), filters, notes, statusOverrides, day.date) as ScheduleRow[];
      return {
        title: formatSectionHeader(day.date, today),
        date: day.date,
        data: filtered.length > 0
          ? [{ _stats: true as const, date: day.date, statsRooms: day.rooms }, ...filtered]
          : [] as ScheduleRow[],
      };
    })
    .filter(s => s.data.length > 0);
  const totalPages = Math.max(1, Math.ceil(allRangeSections.length / DAYS_PER_PAGE));
  const pagedRangeSections = allRangeSections
    .slice(currentPage * DAYS_PER_PAGE, (currentPage + 1) * DAYS_PER_PAGE)
    .map((section, idx) =>
      idx < revealedCount
        ? section
        : { ...section, data: [{ _placeholder: true as const, date: section.date }] as ScheduleRow[] }
    );
  const paginationFooter = dateRange && totalPages > 1 ? (
    <View style={styles.paginationRow}>
      <TouchableOpacity
        style={styles.pageBtn}
        onPress={() => setCurrentPage(p => Math.max(0, p - 1))}
        disabled={currentPage === 0}
      >
        <Ionicons name="chevron-back" size={20} color={currentPage === 0 ? '#d1d5db' : ORANGE} />
      </TouchableOpacity>
      <Text style={styles.pageIndicator}>Page {currentPage + 1} of {totalPages}</Text>
      <TouchableOpacity
        style={styles.pageBtn}
        onPress={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
        disabled={currentPage >= totalPages - 1}
      >
        <Ionicons name="chevron-forward" size={20} color={currentPage >= totalPages - 1 ? '#d1d5db' : ORANGE} />
      </TouchableOpacity>
    </View>
  ) : null;

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
    setNotesSheetVisible(true);
  }

  function saveSheetNote() {
    if (!notesSheetKey) return;
    const trimmed = notesSheetDraft.trim();
    if (trimmed) {
      setNotes(prev => ({ ...prev, [notesSheetKey!]: trimmed }));
    } else {
      setNotes(prev => { const next = { ...prev }; delete next[notesSheetKey!]; return next; });
    }
    setNotesSheetEditing(false);
  }

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
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.clearBtn}>
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

            {!dateRange && (
              <TouchableOpacity style={{ padding: 4 }} onPress={() => setModalVisible(true)}>
                <Ionicons name="calendar-outline" size={20} color="#333" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={{ padding: 4 }} onPress={() => setAutoSheetVisible(true)}>
              <MaterialCommunityIcons name="cog-sync-outline" size={22} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
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
          ref={rangeListRef}
          key={`range-page-${currentPage}`}
          sections={pagedRangeSections}
          keyExtractor={(item, i) =>
            '_placeholder' in item ? `placeholder-${item.date}` :
            '_stats' in item       ? `stats-${(item as StatsRow).date}` :
            `${(item as RoomDaySchedule).room.id}-${i}`
          }
          ListFooterComponent={paginationFooter}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => {
            if ('_stats' in item) {
              const { statsRooms } = item as StatsRow;
              const dayStatItems = [
                { value: statsRooms.filter(r => { const s = statusOverrides[r.room.id] ?? r.room.status; return s === 'UNCLEANED' || s === 'DEEP_CLEAN'; }).length, label: 'Rooms dirty today' },
                { value: statsRooms.filter(r => r.checkInTime !== null).length,                              label: 'Early check-in today' },
                { value: statsRooms.filter(r => r.lateCheckout && r.hasCheckoutToday).length,                label: 'Late check-out today' },
                { value: statsRooms.filter(r => r.room.isClosed).length,                                     label: 'Out of order today' },
                { value: statsRooms.filter(r => r.room.notes !== null).length,                               label: 'Issue reported today' },
              ];
              return (
                <View style={{ position: 'relative' }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 0, gap: 24 }}>
                    {dayStatItems.map((stat, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                      </View>
                    ))}
                  </ScrollView>
                  <View pointerEvents="none" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, flexDirection: 'row' }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(242,243,243,0)'    }} />
                    <View style={{ flex: 1, backgroundColor: 'rgba(242,243,243,0.3)'  }} />
                    <View style={{ flex: 1, backgroundColor: 'rgba(242,243,243,0.6)'  }} />
                    <View style={{ flex: 1, backgroundColor: 'rgba(242,243,243,0.85)' }} />
                    <View style={{ flex: 1, backgroundColor: 'rgba(242,243,243,1)'    }} />
                  </View>
                </View>
              );
            }
            if ('_placeholder' in item) {
              return (
                <View style={{ paddingVertical: 28, alignItems: 'center' }}>
                  <ActivityIndicator color={ORANGE} />
                </View>
              );
            }
            const roomItem = item as RoomDaySchedule;
            const effectiveStatus = statusOverrides[roomItem.room.id] ?? roomItem.room.status;
            const noteKey = roomItem.reservationId ?? roomItem.room.id;
            const bedConfig = roomItem.bedConfiguration;
            return (
              <RoomRow
                item={roomItem}
                status={effectiveStatus}
                note={notes[noteKey] ?? ''}
                bedConfig={bedConfig}
                flags={flags}
                onNotePress={() => openNotesSheet(roomItem, noteKey)}
                onStatusPress={(rect) => openStatusDropdown(roomItem.room.id, effectiveStatus, rect)}
                assignedTo={assignments[roomItem.room.id] ?? null}
                onAssignPress={() => openAssignModal(roomItem.room.id)}
              />
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          SectionSeparatorComponent={({ leadingItem }) =>
            leadingItem != null ? <View style={{ height: 16 }} /> : null
          }
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
          data={singleRooms}
          keyExtractor={item => item.room.id}
          ListHeaderComponent={<StatsStrip rooms={statsRooms} statusOverrides={statusOverrides} />}
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
                onNotePress={() => openNotesSheet(item, noteKey)}
                onStatusPress={(rect) => openStatusDropdown(item.room.id, effectiveStatus, rect)}
                assignedTo={assignments[item.room.id] ?? null}
                onAssignPress={() => openAssignModal(item.room.id)}
              />
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
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={styles.notesSheetSectionLabel}>Staff note</Text>
                  {!notesSheetEditing && notesSheetKey && notes[notesSheetKey] && (
                    <TouchableOpacity onPress={() => { setNotesSheetDraft(notes[notesSheetKey!] ?? ''); setNotesSheetEditing(true); }}>
                      <Ionicons name="pencil-outline" size={16} color={ORANGE} />
                    </TouchableOpacity>
                  )}
                </View>
                {notesSheetEditing ? (
                  <>
                    <TextInput
                      style={styles.notesSheetInput}
                      value={notesSheetDraft}
                      onChangeText={setNotesSheetDraft}
                      multiline
                      autoFocus
                      placeholder="Add a note for housekeeping..."
                      placeholderTextColor={COLORS.Black[600]}
                      textAlignVertical="top"
                    />
                    <View style={styles.notesSheetSaveRow}>
                      <TouchableOpacity onPress={() => setNotesSheetEditing(false)}>
                        <Text style={styles.notesSheetCancel}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.notesSheetSaveBtn} onPress={saveSheetNote}>
                        <Text style={styles.notesSheetSaveBtnText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : notesSheetKey && notes[notesSheetKey] ? (
                  <Text style={styles.notesSheetBody}>{notes[notesSheetKey]}</Text>
                ) : (
                  <TouchableOpacity onPress={() => { setNotesSheetDraft(''); setNotesSheetEditing(true); }}>
                    <Text style={styles.addNoteText}>+ Add staff note</Text>
                  </TouchableOpacity>
                )}
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
      <SortSheet
        visible={sortModalVisible}
        sort={sort}
        onSortChange={setSort}
        onClose={() => setSortModalVisible(false)}
      />

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
      <FilterSheet
        visible={filterSheetVisible}
        filters={filters}
        onFiltersChange={setFilters}
        onClose={() => setFilterSheetVisible(false)}
      />


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
      <AutomationsSheet
        visible={autoSheetVisible}
        onClose={() => setAutoSheetVisible(false)}
        deepCleanDays={deepCleanDays}
        onDeepCleanDaysChange={setDeepCleanDays}
        nightlyResetOccupied={nightlyResetOccupied}
        onNightlyResetChange={setNightlyResetOccupied}
        resetAfterCheckout={resetAfterCheckout}
        onResetAfterCheckoutChange={setResetAfterCheckout}
        resetAfterClosure={resetAfterClosure}
        onResetAfterClosureChange={setResetAfterClosure}
      />

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

    </View>

    {/* ── Select dates overlay ── */}
    <DatePickerOverlay
      visible={modalVisible}
      today={today}
      onApply={(start, end) => setDateRange({ start, end })}
      onClose={() => setModalVisible(false)}
    />
    </SafeAreaView>
  );
}
