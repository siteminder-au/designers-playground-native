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

// 20-room property. The first 8 match the Figma sample exactly; the rest are
// invented to round out a believable property, spread across all 5 statuses.
const MOCK_ROOM_INPUTS: MockRoomInput[] = [
  // ── Dirty (deep) ──
  { id: 'mock-suite-2', number: 'Suite 2', type: 'Deluxe Suite', status: 'DEEP_CLEAN',
    guestName: 'Giannis Antetekoumnpo', adults: 2, children: 1, infants: 0, hasCheckInToday: true, hasCheckoutToday: false },
  { id: 'mock-suite-4', number: 'Suite 4', type: 'Deluxe Suite', status: 'DEEP_CLEAN',
    guestName: 'Emma Chen', adults: 2, children: 0, infants: 0, hasCheckInToday: true, hasCheckoutToday: true },
  { id: 'mock-room-7', number: '7', type: 'Bridge Room', status: 'DEEP_CLEAN',
    guestName: "Liam O'Connor", adults: 1, children: 0, infants: 0, hasCheckInToday: false, hasCheckoutToday: false },

  // ── Dirty (standard) ──
  { id: 'mock-room-1', number: '1', type: 'Standard Room', status: 'UNCLEANED',
    guestName: 'Alice Foster', adults: 2, children: 2, infants: 0, hasCheckInToday: true, hasCheckoutToday: false },
  { id: 'mock-room-2', number: '2', type: 'Standard Room', status: 'UNCLEANED',
    guestName: 'Peter George', adults: 2, children: 1, infants: 1, hasCheckInToday: true, hasCheckoutToday: true },
  { id: 'mock-room-3', number: '3', type: 'Standard Room', status: 'UNCLEANED',
    guestName: 'Maria Gonzalez', adults: 1, children: 0, infants: 0, hasCheckInToday: true, hasCheckoutToday: false },
  { id: 'mock-room-4', number: '4', type: 'Standard Room', status: 'UNCLEANED',
    guestName: 'Tom Bradley', adults: 2, children: 0, infants: 0, hasCheckInToday: false, hasCheckoutToday: true },
  { id: 'mock-room-5', number: '5', type: 'Standard Room', status: 'UNCLEANED',
    guestName: null, adults: 0, children: 0, infants: 0, hasCheckInToday: false, hasCheckoutToday: false },

  // ── Skip clean ──
  { id: 'mock-room-12', number: '12', type: 'Family Room', status: 'SKIP_CLEANING',
    guestName: 'Jalen Hurts', adults: 2, children: 0, infants: 0, hasCheckInToday: true, hasCheckoutToday: true },
  { id: 'mock-room-15', number: '15', type: 'Family Room', status: 'SKIP_CLEANING',
    guestName: 'Jalen Smurts', adults: 3, children: 0, infants: 0, hasCheckInToday: false, hasCheckoutToday: false },
  { id: 'mock-room-8', number: '8', type: 'Family Room', status: 'SKIP_CLEANING',
    guestName: 'Sofia Ramirez', adults: 2, children: 2, infants: 0, hasCheckInToday: true, hasCheckoutToday: false },
  { id: 'mock-room-10', number: '10', type: 'Family Room', status: 'SKIP_CLEANING',
    guestName: 'Noah Williams', adults: 4, children: 0, infants: 0, hasCheckInToday: false, hasCheckoutToday: false },

  // ── Inspection needed ──
  { id: 'mock-room-6', number: '6', type: 'Bridge Room', status: 'AWAITING_INSPECTION',
    guestName: null, adults: 0, children: 0, infants: 0, hasCheckInToday: false, hasCheckoutToday: false },
  { id: 'mock-room-13', number: '13', type: 'Bridge Room', status: 'AWAITING_INSPECTION',
    guestName: null, adults: 0, children: 0, infants: 0, hasCheckInToday: false, hasCheckoutToday: false },

  // ── Cleaned ──
  { id: 'mock-room-11', number: '11', type: 'Bridge Room', status: 'CLEANED',
    guestName: 'AJ Brown', adults: 2, children: 0, infants: 0, hasCheckInToday: true, hasCheckoutToday: false },
  { id: 'mock-room-9', number: '9', type: 'Bridge Room', status: 'CLEANED',
    guestName: 'Marcus Chen', adults: 2, children: 0, infants: 0, hasCheckInToday: false, hasCheckoutToday: true },
  { id: 'mock-room-14', number: '14', type: 'Standard Room', status: 'CLEANED',
    guestName: 'Olivia Martinez', adults: 1, children: 0, infants: 0, hasCheckInToday: true, hasCheckoutToday: false },
  { id: 'mock-room-16', number: '16', type: 'Standard Room', status: 'CLEANED',
    guestName: 'Ethan Walker', adults: 2, children: 1, infants: 0, hasCheckInToday: false, hasCheckoutToday: true },
  { id: 'mock-room-17', number: '17', type: 'Bridge Room', status: 'CLEANED',
    guestName: null, adults: 0, children: 0, infants: 0, hasCheckInToday: false, hasCheckoutToday: false },
  { id: 'mock-penthouse', number: 'Penthouse', type: 'Penthouse Suite', status: 'CLEANED',
    guestName: 'Ava Thompson', adults: 2, children: 0, infants: 0, hasCheckInToday: false, hasCheckoutToday: false },
];

// Default room-note text — matches the Figma card footers exactly for the
// first 8 rooms; the rest are invented for variety. Any note a demoer adds
// via the Notes sheet (on-device only, see useLocalNotes) takes precedence
// over these once saved.
export const MOCK_ROOM_NOTES: Record<string, string> = {
  'mock-room-1':  'Need new linen sheets, current ones have been ripped',
  'mock-room-2':  'Please refill the shiraz bottles',
  'mock-room-12': 'A/C in the room is broken',
  'mock-room-11': 'Please do not allow Jalen Hurts into his room',
  'mock-suite-4': 'VIP guest — please prioritize turnaround',
  'mock-room-3':  'Guest requested extra towels twice this week',
  'mock-room-8':  'Crib requested for the room',
  'mock-room-13': 'Plumbing inspected, waiting on sign-off',
  'mock-room-16': 'Minor stain on the carpet near the window',
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
