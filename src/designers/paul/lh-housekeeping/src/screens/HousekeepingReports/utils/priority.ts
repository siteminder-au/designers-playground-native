import type { RoomStatus } from '../../../context/HousekeepingStatus';
import type { RoomDaySchedule } from '../types';

export type SortField = 'priority' | 'room_number' | 'room_type' | 'occupancy' | 'guest_count' | 'notes' | 'cleanliness';
export type SortDirection = 'asc' | 'desc';
export interface SortState { field: SortField; direction: SortDirection }

export const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'priority',    label: 'Priority' },
  { value: 'cleanliness', label: 'Cleaning status' },
  { value: 'notes',       label: 'Room notes' },
  { value: 'occupancy',   label: 'Room status' },
  { value: 'room_number', label: 'Room name' },
  { value: 'room_type',   label: 'Room type' },
  { value: 'guest_count', label: 'Number of guests' },
];

export const DEFAULT_SORT: SortState = { field: 'priority', direction: 'desc' };

const STATUS_SORT_ORDER: Record<RoomStatus, number> = {
  UNCLEANED:           0,
  DEEP_CLEAN:          1,
  SKIP_CLEANING:       2,
  AWAITING_INSPECTION: 3,
  CLEANED:             4,
};

// Returns priority bucket 1 (most urgent) → 9 (cleaned/closed = not actionable)
export function getPriority(
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

export function sortRooms(
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
