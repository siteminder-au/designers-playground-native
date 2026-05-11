import { Dimensions } from 'react-native';
import type { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { RoomStatus } from '../../context/HousekeepingStatus';
import { COLORS } from '../../config/colors';
import CleanSvg from '../../../assets/Clean.svg';
import DirtySvg from '../../../assets/Dirty.svg';
import InspectionSvg from '../../../assets/Inspection.svg';
import SnoozeSvg from '../../../assets/Snooze.svg';

// ── Core data interfaces ───────────────────────────────────────────────────────

export interface RoomDaySchedule {
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

export interface DaySchedule {
  date: string;
  rooms: RoomDaySchedule[];
}

// ── SectionList row union types ────────────────────────────────────────────────

export type PlaceholderRow = { _placeholder: true; date: string };
export type StatsRow       = { _stats: true; date: string; statsRooms: RoomDaySchedule[] };
export type ScheduleRow    = RoomDaySchedule | PlaceholderRow | StatsRow;

// ── Misc ──────────────────────────────────────────────────────────────────────

export type BadgeRect = { x: number; y: number; width: number; height: number };

// ── App-level constants ────────────────────────────────────────────────────────

export const ORANGE       = '#e8722a';
export const NUM_DAYS     = 5;
export const DAYS_PER_PAGE = 5;
export const WINDOW_HEIGHT = Dimensions.get('window').height;
export const HOUSEKEEPERS  = ['Maria S.', 'James T.', 'Jacqueline W.'];

// ── Status config maps ────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<RoomStatus, {
  label: string; bg: string; border: string; text: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
}> = {
  CLEANED:             { label: 'Clean',               bg: '#9AE0BD',         border: '#258548',         text: '#258548',         icon: 'auto-awesome'    },
  UNCLEANED:           { label: 'Needs clean',         bg: '#f1bfbf',         border: '#b81919',         text: '#b81919',         icon: 'auto-awesome'    },
  DEEP_CLEAN:          { label: 'Needs deep clean',    bg: '#f1bfbf',         border: '#b81919',         text: '#b81919',         icon: 'auto-awesome'    },
  SKIP_CLEANING:       { label: 'Skip clean',          bg: '#fef9c3',         border: '#d97706',         text: '#a16207',         icon: 'do-not-disturb'  },
  AWAITING_INSPECTION: { label: 'Awaiting inspection', bg: COLORS.Blue[600],  border: COLORS.Blue[200],  text: COLORS.Blue[200],  icon: 'auto-fix-high'   },
};

export const STATUS_SVG_ICON: Partial<Record<RoomStatus, React.FC<{ width?: number; height?: number }>>> = {
  CLEANED:             CleanSvg,
  UNCLEANED:           DirtySvg,
  DEEP_CLEAN:          DirtySvg,
  AWAITING_INSPECTION: InspectionSvg,
  SKIP_CLEANING:       SnoozeSvg,
};

// 'symbol' variant — MaterialCommunityIcons with housekeeping-semantic meaning
export type SymbolEntry =
  | { set: 'MI';  name: React.ComponentProps<typeof MaterialIcons>['name'];          color: string; tint: string }
  | { set: 'MCI'; name: React.ComponentProps<typeof MaterialCommunityIcons>['name']; color: string; tint: string };

export const STATUS_SYMBOL: Record<RoomStatus, SymbolEntry> = {
  CLEANED:             { set: 'MI',  name: 'auto-awesome',      color: '#258548',        tint: '#9AE0BD'        },
  UNCLEANED:           { set: 'MI',  name: 'cleaning-services', color: '#b81919',        tint: '#f1bfbf'        },
  DEEP_CLEAN:          { set: 'MCI', name: 'broom',             color: '#b81919',        tint: '#f1bfbf'        },
  SKIP_CLEANING:       { set: 'MCI', name: 'sleep',             color: '#d97706',        tint: '#fef9c3'        },
  AWAITING_INSPECTION: { set: 'MI',  name: 'auto-fix-high',     color: COLORS.Blue[200], tint: COLORS.Blue[600] },
};

// 'abbr' variant — text label is primary, border colour is secondary
export const STATUS_ABBR: Record<RoomStatus, { label: string; fullLabel: string; color: string }> = {
  CLEANED:             { label: 'CLN', fullLabel: 'Clean',               color: '#258548'        },
  UNCLEANED:           { label: 'DRT', fullLabel: 'Needs clean',         color: '#b81919'        },
  DEEP_CLEAN:          { label: 'DPC', fullLabel: 'Needs deep clean',    color: '#b81919'        },
  SKIP_CLEANING:       { label: 'SKP', fullLabel: 'Skip Clean',          color: '#d97706'        },
  AWAITING_INSPECTION: { label: 'AWI', fullLabel: 'Awaiting inspection', color: COLORS.Blue[200] },
};

export const STATUS_SORT_ORDER: Record<RoomStatus, number> = {
  UNCLEANED:           0,
  DEEP_CLEAN:          1,
  SKIP_CLEANING:       2,
  AWAITING_INSPECTION: 3,
  CLEANED:             4,
};


// ── Sort ──────────────────────────────────────────────────────────────────────

export type SortField     = 'priority' | 'room_number' | 'room_type' | 'occupancy' | 'guest_count' | 'notes' | 'cleanliness';
export type SortDirection = 'asc' | 'desc';
export interface SortState { field: SortField; direction: SortDirection }

export const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'priority',    label: 'Priority'          },
  { value: 'cleanliness', label: 'Cleaning status'   },
  { value: 'notes',       label: 'Room notes'        },
  { value: 'occupancy',   label: 'Room status'       },
  { value: 'room_number', label: 'Room name'         },
  { value: 'room_type',   label: 'Room type'         },
  { value: 'guest_count', label: 'Number of guests'  },
];

export const DEFAULT_SORT: SortState = { field: 'room_number', direction: 'asc' };

// ── Filter ────────────────────────────────────────────────────────────────────

export interface FilterState {
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

export const ROOM_TYPE_OPTIONS      = ['Bridge Room', 'Deluxe Suite', 'Family Room'];
export const ROOM_STATUS_OPTIONS    = ['Occupied', 'Unoccupied', 'Check-in only', 'Check-out only', 'Check-out/in', 'Closed'];
export const CLEANING_STATUS_OPTIONS = ['Clean', 'Need cleaning', 'Need deep cleaning', 'Skip cleaning', 'Awaiting inspection'];

export const CLEANING_STATUS_MAP: Record<string, RoomStatus | null> = {
  'Clean':               'CLEANED',
  'Need cleaning':       'UNCLEANED',
  'Need deep cleaning':  'DEEP_CLEAN',
  'Skip cleaning':       'SKIP_CLEANING',
  'Awaiting inspection': 'AWAITING_INSPECTION',
};

export const DEFAULT_FILTERS: FilterState = {
  statuses: [], roomTypes: [], roomStatuses: [], cleaningStatuses: [],
  includeStaffNotes: false, includeGuestComments: false, includeExtras: false,
  lateCheckout: false, earlyCheckout: false,
};
