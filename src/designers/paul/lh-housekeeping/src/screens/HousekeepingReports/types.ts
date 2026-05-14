import type { RoomStatus } from '../../context/HousekeepingStatus';

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

export interface StaffNote {
  id: string;
  roomId: string;
  author: string;
  text: string;
  tag: 'room' | 'guest';
  reservationId: string | null;
  createdAt: string;
  updatedAt: string;
}
