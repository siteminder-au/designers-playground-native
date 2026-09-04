import type { RoomGroup } from './index';

// Static fallback reservations shown when the shared si_reservations table has
// nothing for the visible window (the DB isn't kept populated day-to-day, the
// same reason the Housekeeping screen has its own mock dataset). Purely
// illustrative — doesn't need to line up with Housekeeping's mock guest data.
// Dates are relative to `today` so the grid always shows something regardless
// of when the prototype is viewed.

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export function buildMockCalendarGroups(today: string): RoomGroup[] {
  const d = (n: number) => addDays(today, n);

  return [
    {
      type: 'Standard Room',
      unallocatedCount: 0,
      rooms: [
        {
          id: 'mock-cal-101', number: '101', status: 'UNCLEANED',
          reservations: [
            { id: 'mock-res-1', guestName: 'Michael Jordan', checkIn: d(-2), checkOut: d(1),  adults: 2, reservationStatus: 'CONFIRMED' },
            { id: 'mock-res-2', guestName: 'Kevin Durant',    checkIn: d(2),  checkOut: d(5),  adults: 1, reservationStatus: 'CONFIRMED' },
          ],
        },
        {
          id: 'mock-cal-102', number: '102', status: 'CLEANED',
          reservations: [
            { id: 'mock-res-3', guestName: 'Steph Curry',    checkIn: d(0), checkOut: d(3), adults: 2, reservationStatus: 'CONFIRMED' },
            { id: 'mock-res-4', guestName: 'Klay Thompson',  checkIn: d(4), checkOut: d(6), adults: 1, reservationStatus: 'TENTATIVE' },
          ],
        },
      ],
    },
    {
      type: 'Deluxe Suite',
      unallocatedCount: 0,
      rooms: [
        {
          id: 'mock-cal-201', number: '201', status: 'DEEP_CLEAN',
          reservations: [
            { id: 'mock-res-5', guestName: 'LeBron James', checkIn: d(-1), checkOut: d(4), adults: 4, reservationStatus: 'CONFIRMED' },
          ],
        },
        {
          id: 'mock-cal-202', number: '202', status: 'AWAITING_INSPECTION',
          reservations: [
            { id: 'mock-res-6', guestName: 'Luka Doncic',   checkIn: d(1), checkOut: d(2), adults: 2, reservationStatus: 'TENTATIVE' },
            { id: 'mock-res-7', guestName: 'Nikola Jokic',  checkIn: d(3), checkOut: d(7), adults: 3, reservationStatus: 'CONFIRMED' },
          ],
        },
      ],
    },
    {
      type: 'Family Room',
      unallocatedCount: 0,
      rooms: [
        {
          id: 'mock-cal-301', number: '301', status: 'SKIP_CLEANING',
          reservations: [
            { id: 'mock-res-8', guestName: 'Giannis Antetokounmpo', checkIn: d(-3), checkOut: d(2), adults: 5, reservationStatus: 'CONFIRMED' },
          ],
        },
        {
          id: 'mock-cal-302', number: '302', status: 'CLEANED',
          reservations: [
            { id: 'mock-res-9', guestName: 'Jayson Tatum', checkIn: d(2), checkOut: d(9), adults: 4, reservationStatus: 'CONFIRMED' },
          ],
        },
      ],
    },
    {
      type: 'Bridge Room',
      unallocatedCount: 0,
      rooms: [
        {
          id: 'mock-cal-401', number: '401', status: 'UNCLEANED',
          reservations: [
            { id: 'mock-res-10', guestName: 'Damian Lillard',  checkIn: d(0), checkOut: d(1), adults: 1, reservationStatus: 'TENTATIVE' },
            { id: 'mock-res-11', guestName: 'Anthony Edwards', checkIn: d(5), checkOut: d(8), adults: 2, reservationStatus: 'CONFIRMED' },
          ],
        },
      ],
    },
  ];
}
