import type { RoomStatus } from '../../context/HousekeepingStatus';

export interface RoomDaySchedule {
  isOccupied: boolean;
  hasCheckoutToday: boolean;
  hasCheckInToday: boolean;
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
  staffNote: string | null;
  room: { id: string; number: string; type: string; status: RoomStatus; notes: string | null; isClosed: boolean };
}

export interface DaySchedule {
  date: string;
  rooms: RoomDaySchedule[];
}

export interface StaffNote {
  id: string;
  roomId: string;
  author: string;
  text: string;
  reservationId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Room notes are an exploration that lives entirely on-device (AsyncStorage) —
// they are NOT read from or written to Si's shared si_staff_notes table. The
// shared DB is used only for read-only reservation/schedule data. Room notes
// are tied to the room (keyed by roomId), independent of the reservation, and
// carry a Housekeeping/Maintenance subcategory.
export const NOTE_CATEGORIES = ['Housekeeping', 'Maintenance'] as const;
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

export interface LocalNote {
  id: string;
  roomId: string;
  author: string;
  text: string;
  category: NoteCategory;
  createdAt: string;
  updatedAt: string;
}
