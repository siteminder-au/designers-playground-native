import type { RoomStatus } from '../../context/HousekeepingStatus';
import type { RoomDaySchedule } from './types';

// Static "no shared database" dataset — mirrors the sample rooms shown in the
// Figma frame (LH Mobile Housekeeping Enhancements Initiative, node
// 737:28827) exactly, so the screen looks identical every day without
// needing Si's shared si_reservations/si_room_cleaning tables kept populated.
// Used when the "Live data" demo flag is off.

type MockRoomInput = {
  id: string;
  number: string;
  type: string;
  status: RoomStatus;
  guestName: string | null;
  adults: number;
  children: number;
  infants: number;
  hasCheckInToday: boolean;
  hasCheckoutToday: boolean;
};

const MOCK_ROOM_INPUTS: MockRoomInput[] = [
  { id: 'mock-suite-2', number: 'Suite 2', type: 'Deluxe Suite', status: 'DEEP_CLEAN',
    guestName: 'Giannis Antetekoumnpo', adults: 2, children: 1, infants: 0, hasCheckInToday: true, hasCheckoutToday: false },
  { id: 'mock-room-1', number: '1', type: 'Standard Room', status: 'UNCLEANED',
    guestName: 'Alice Foster', adults: 2, children: 2, infants: 0, hasCheckInToday: true, hasCheckoutToday: false },
  { id: 'mock-room-2', number: '2', type: 'Standard Room', status: 'UNCLEANED',
    guestName: 'Peter George', adults: 2, children: 1, infants: 1, hasCheckInToday: true, hasCheckoutToday: true },
  { id: 'mock-room-12', number: '12', type: 'Family Room', status: 'SKIP_CLEANING',
    guestName: 'Jalen Hurts', adults: 2, children: 0, infants: 0, hasCheckInToday: true, hasCheckoutToday: true },
  { id: 'mock-room-15', number: '15', type: 'Family Room', status: 'SKIP_CLEANING',
    guestName: 'Jalen Smurts', adults: 3, children: 0, infants: 0, hasCheckInToday: false, hasCheckoutToday: false },
  { id: 'mock-room-6', number: '6', type: 'Bridge Room', status: 'AWAITING_INSPECTION',
    guestName: null, adults: 0, children: 0, infants: 0, hasCheckInToday: false, hasCheckoutToday: false },
  { id: 'mock-room-11', number: '11', type: 'Bridge Room', status: 'CLEANED',
    guestName: 'AJ Brown', adults: 2, children: 0, infants: 0, hasCheckInToday: true, hasCheckoutToday: false },
  { id: 'mock-room-9', number: '9', type: 'Bridge Room', status: 'CLEANED',
    guestName: 'Marcus Chen', adults: 2, children: 0, infants: 0, hasCheckInToday: false, hasCheckoutToday: true },
];

// Default room-note text — matches the Figma card footers exactly. Any note a
// demoer adds via the Notes sheet (on-device only, see useLocalNotes) takes
// precedence over these once saved.
export const MOCK_ROOM_NOTES: Record<string, string> = {
  'mock-room-1':  'Need new linen sheets, current ones have been ripped',
  'mock-room-2':  'Please refill the shiraz bottles',
  'mock-room-12': 'A/C in the room is broken',
  'mock-room-11': 'Please do not allow Jalen Hurts into his room',
};

export function buildMockRooms(today: string): RoomDaySchedule[] {
  return MOCK_ROOM_INPUTS.map((input): RoomDaySchedule => {
    const isOccupied = input.guestName !== null;
    return {
      isOccupied,
      hasCheckoutToday: input.hasCheckoutToday,
      hasCheckInToday: input.hasCheckInToday,
      guestCount: input.adults + input.children + input.infants,
      adults: input.adults,
      children: input.children,
      infants: input.infants,
      reservationId: isOccupied ? `MOCK-${input.id}` : null,
      guestName: input.guestName,
      checkIn: input.hasCheckInToday ? today : null,
      checkOut: input.hasCheckoutToday ? today : null,
      checkInTime: null,
      checkOutTime: null,
      lateCheckout: false,
      earlyCheckout: false,
      bedConfiguration: '',
      guestComments: null,
      extraItems: [],
      staffNote: null,
      room: { id: input.id, number: input.number, type: input.type, status: input.status, notes: null, isClosed: false },
    };
  });
}
