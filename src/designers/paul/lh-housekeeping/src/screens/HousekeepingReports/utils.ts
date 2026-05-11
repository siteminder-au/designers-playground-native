import { RoomStatus } from '../../context/HousekeepingStatus';
import {
  RoomDaySchedule, SortState, FilterState,
  STATUS_SORT_ORDER, CLEANING_STATUS_MAP,
} from './types';

// ── Priority sort ─────────────────────────────────────────────────────────────

// Returns priority bucket 1 (most urgent) → 7 (not actionable)
export function getPriority(
  item: RoomDaySchedule,
  date: string,
  notes: Record<string, string>,
  overrides: Record<string, RoomStatus>,
): number {
  const noteKey = item.reservationId ?? item.room.id;
  const effectiveStatus = overrides[item.room.id] ?? item.room.status;
  const hasNotes = !!(notes[noteKey] || item.room.notes || item.guestComments || item.extraItems.length > 0);

  if (item.room.isClosed) return 7;
  const hasIncomingGuest = item.guestName !== null && !item.isOccupied;
  const hasOutgoing = item.hasCheckoutToday;
  if ((effectiveStatus === 'CLEANED' || effectiveStatus === 'SKIP_CLEANING') && !hasIncomingGuest && !hasOutgoing) return 7;
  if (item.lateCheckout && item.isOccupied) return 6;
  if (!item.isOccupied && item.checkIn === date && item.checkInTime !== null) return 1;
  if (item.hasCheckoutToday && item.guestName !== null && item.checkIn === date) return 2;
  if (item.isOccupied) return 3;
  if (hasNotes) return 4;
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
        const pA = getPriority(a, date, notes, overrides);
        const pB = getPriority(b, date, notes, overrides);
        if (pA !== pB) { result = pB - pA; break; }
        if (a.checkInTime && b.checkInTime) {
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
        const hasStaffA  = !!(notes[keyA] || a.room.notes);
        const hasGuestA  = !!a.guestComments;
        const hasExtrasA = a.extraItems.length > 0;
        const hasStaffB  = !!(notes[keyB] || b.room.notes);
        const hasGuestB  = !!b.guestComments;
        const hasExtrasB = b.extraItems.length > 0;
        const countA = (hasStaffA ? 1 : 0) + (hasGuestA ? 1 : 0) + (hasExtrasA ? 1 : 0);
        const countB = (hasStaffB ? 1 : 0) + (hasGuestB ? 1 : 0) + (hasExtrasB ? 1 : 0);
        if (countA !== countB) { result = countA - countB; break; }
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

// ── Filter ────────────────────────────────────────────────────────────────────

export function getRoomStatusCategory(item: RoomDaySchedule, date: string): string {
  if (item.room.isClosed)       return 'Closed';
  const isCheckIn   = item.checkIn === date;
  const hasCheckout = item.hasCheckoutToday;
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
      const hasStaffNote    = !!(notes[noteKey] || item.room.notes);
      const hasGuestComment = !!item.guestComments;
      const hasExtras       = item.extraItems.length > 0;
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
  if (filters.statuses.length > 0)  n++;
  if (filters.includeStaffNotes)    n++;
  if (filters.includeGuestComments) n++;
  if (filters.includeExtras)        n++;
  if (filters.lateCheckout)         n++;
  if (filters.earlyCheckout)        n++;
  return n;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export function formatLong(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDayStrip(dateStr: string): { day: string; date: number } {
  const d = new Date(dateStr + 'T12:00:00');
  return {
    day:  d.toLocaleDateString('en-AU', { weekday: 'short' }).toUpperCase(),
    date: d.getDate(),
  };
}

export function formatSectionHeader(dateStr: string, today: string): string {
  if (dateStr === today) return `TODAY  ·  ${formatLong(dateStr)}`;
  if (dateStr === addDays(today, 1)) return `TOMORROW  ·  ${formatLong(dateStr)}`;
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.toLocaleDateString('en-AU', { weekday: 'short' }).toUpperCase()}  ·  ${formatLong(dateStr)}`;
}

export function formatCardDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

// Derives a stable 8-digit booking reference from any reservation ID string
export function toBookingRef(id: string): string {
  let h = 5381;
  for (let i = 0; i < id.length; i++) {
    h = (((h << 5) + h) ^ id.charCodeAt(i)) >>> 0;
  }
  return String(10000000 + (h % 90000000));
}

// "14:00" → "2pm", "11:30" → "11:30am"
export function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`;
}
