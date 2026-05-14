import type { RoomStatus } from '../../../context/HousekeepingStatus';
import type { RoomDaySchedule } from '../types';

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

export const ROOM_TYPE_OPTIONS = ['Bridge Room', 'Deluxe Suite', 'Family Room'];
export const ROOM_STATUS_OPTIONS = ['Occupied', 'Unoccupied', 'Check-in only', 'Check-out only', 'Check-out/in', 'Closed'];
export const CLEANING_STATUS_OPTIONS = ['Clean', 'Need cleaning', 'Need deep cleaning', 'Skip cleaning', 'Awaiting inspection'];

const CLEANING_STATUS_MAP: Record<string, RoomStatus | null> = {
  'Clean':               'CLEANED',
  'Need cleaning':       'UNCLEANED',
  'Need deep cleaning':  'DEEP_CLEAN',
  'Skip cleaning':       'SKIP_CLEANING',
  'Awaiting inspection': 'AWAITING_INSPECTION',
};

export const DEFAULT_FILTERS: FilterState = { statuses: [], roomTypes: [], roomStatuses: [], cleaningStatuses: [], includeStaffNotes: false, includeGuestComments: false, includeExtras: false, lateCheckout: false, earlyCheckout: false };

export function getRoomStatusCategory(item: RoomDaySchedule, date: string): string {
  if (item.room.isClosed)       return 'Closed';
  const isCheckIn     = item.checkIn === date;
  const hasCheckout   = item.hasCheckoutToday;
  if (isCheckIn && hasCheckout) return 'Check-out/in';
  if (isCheckIn)                return 'Check-in only';
  if (hasCheckout)              return 'Check-out only';
  if (!item.isOccupied)         return 'Unoccupied';
  return 'Occupied';
}

export function applyFilters(
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

export function activeFilterCount(filters: FilterState): number {
  let n = 0;
  if (filters.statuses.length > 0) n++;
  if (filters.includeStaffNotes) n++;
  if (filters.includeGuestComments) n++;
  if (filters.includeExtras) n++;
  if (filters.lateCheckout) n++;
  if (filters.earlyCheckout) n++;
  return n;
}
