import type { RoomDaySchedule } from '../types';

// Matches the Filters bottom sheet (LH Mobile Housekeeping Enhancements
// Initiative, Figma node 742:65449) — four sections: Reservation Status,
// Additional details, Room type, Guest details. Cleaning status is filtered
// separately via the tappable quick-filter chips above the room list.
export interface FilterState {
  roomStatuses: string[];
  hasRoomNotes: boolean;
  roomTypes: string[];
  guestDetails: string[];
}

export const ROOM_STATUS_OPTIONS = ['Check-in', 'Check-out', 'Check-out/in', 'Stay through', 'Vacant'];
export const ROOM_TYPE_OPTIONS = ['Bridge Room', 'Deluxe Suite', 'Family Room'];
export const GUEST_DETAIL_OPTIONS = ['With children', 'With infant'];

export const DEFAULT_FILTERS: FilterState = { roomStatuses: [], hasRoomNotes: false, roomTypes: [], guestDetails: [] };

export function getRoomStatusCategory(item: RoomDaySchedule, date: string): string {
  const isCheckIn   = item.checkIn === date;
  const hasCheckout = item.hasCheckoutToday;
  if (isCheckIn && hasCheckout) return 'Check-out/in';
  if (isCheckIn)                return 'Check-in';
  if (hasCheckout)              return 'Check-out';
  if (!item.isOccupied)         return 'Vacant';
  return 'Stay through';
}

export function applyFilters(
  rooms: RoomDaySchedule[],
  filters: FilterState,
  notes: Record<string, string>,
  date: string,
): RoomDaySchedule[] {
  const { roomStatuses, hasRoomNotes, roomTypes, guestDetails } = filters;
  if (!roomStatuses.length && !hasRoomNotes && !roomTypes.length && !guestDetails.length) return rooms;
  return rooms.filter(item => {
    if (roomStatuses.length > 0 && !roomStatuses.includes(getRoomStatusCategory(item, date))) return false;
    if (roomTypes.length > 0 && !roomTypes.includes(item.room.type)) return false;
    if (hasRoomNotes && !notes[item.room.id]) return false;
    if (guestDetails.length > 0) {
      const matches =
        (guestDetails.includes('With children') && item.children > 0) ||
        (guestDetails.includes('With infant')   && item.infants > 0);
      if (!matches) return false;
    }
    return true;
  });
}

export function activeFilterCount(filters: FilterState): number {
  let n = 0;
  if (filters.roomStatuses.length > 0) n++;
  if (filters.hasRoomNotes) n++;
  if (filters.roomTypes.length > 0) n++;
  if (filters.guestDetails.length > 0) n++;
  return n;
}
