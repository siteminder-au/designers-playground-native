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

// 20 rooms total, matching the count of Housekeeping's own mock dataset.
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
        {
          id: 'mock-cal-103', number: '103', status: 'CLEANED',
          reservations: [
            { id: 'mock-res-12', guestName: 'Kobe Bryant', checkIn: d(-2), checkOut: d(1), adults: 2, reservationStatus: 'CONFIRMED' },
          ],
        },
        {
          id: 'mock-cal-104', number: '104', status: 'SKIP_CLEANING',
          reservations: [
            { id: 'mock-res-13', guestName: 'Magic Johnson', checkIn: d(1), checkOut: d(4), adults: 1, reservationStatus: 'TENTATIVE' },
          ],
        },
        {
          id: 'mock-cal-105', number: '105', status: 'AWAITING_INSPECTION',
          reservations: [
            { id: 'mock-res-14', guestName: 'Larry Bird', checkIn: d(3), checkOut: d(6), adults: 2, reservationStatus: 'CONFIRMED' },
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
        {
          id: 'mock-cal-203', number: '203', status: 'CLEANED',
          reservations: [
            { id: 'mock-res-15', guestName: 'Shaquille O’Neal', checkIn: d(-1), checkOut: d(2), adults: 3, reservationStatus: 'CONFIRMED' },
          ],
        },
        {
          id: 'mock-cal-204', number: '204', status: 'UNCLEANED',
          reservations: [
            { id: 'mock-res-16', guestName: 'Tim Duncan', checkIn: d(2), checkOut: d(5), adults: 2, reservationStatus: 'TENTATIVE' },
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
        {
          id: 'mock-cal-303', number: '303', status: 'DEEP_CLEAN',
          reservations: [
            { id: 'mock-res-17', guestName: 'Kawhi Leonard', checkIn: d(0), checkOut: d(3), adults: 4, reservationStatus: 'CONFIRMED' },
          ],
        },
        {
          id: 'mock-cal-304', number: '304', status: 'AWAITING_INSPECTION',
          reservations: [
            { id: 'mock-res-18', guestName: 'Chris Paul', checkIn: d(4), checkOut: d(7), adults: 3, reservationStatus: 'CONFIRMED' },
          ],
        },
        {
          id: 'mock-cal-305', number: '305', status: 'UNCLEANED',
          reservations: [
            { id: 'mock-res-19', guestName: 'James Harden', checkIn: d(-2), checkOut: d(2), adults: 5, reservationStatus: 'TENTATIVE' },
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
        {
          id: 'mock-cal-402', number: '402', status: 'CLEANED',
          reservations: [
            { id: 'mock-res-20', guestName: 'Russell Westbrook', checkIn: d(0), checkOut: d(2), adults: 1, reservationStatus: 'CONFIRMED' },
          ],
        },
        {
          id: 'mock-cal-403', number: '403', status: 'SKIP_CLEANING',
          reservations: [
            { id: 'mock-res-21', guestName: 'Joel Embiid', checkIn: d(3), checkOut: d(5), adults: 2, reservationStatus: 'TENTATIVE' },
          ],
        },
        {
          id: 'mock-cal-404', number: '404', status: 'DEEP_CLEAN',
          reservations: [
            { id: 'mock-res-22', guestName: 'Devin Booker', checkIn: d(-1), checkOut: d(1), adults: 1, reservationStatus: 'CONFIRMED' },
          ],
        },
        {
          id: 'mock-cal-405', number: '405', status: 'UNCLEANED',
          reservations: [
            { id: 'mock-res-23', guestName: 'Ja Morant', checkIn: d(1), checkOut: d(3), adults: 2, reservationStatus: 'CONFIRMED' },
          ],
        },
        {
          id: 'mock-cal-406', number: '406', status: 'AWAITING_INSPECTION',
          reservations: [
            { id: 'mock-res-24', guestName: 'Trae Young', checkIn: d(4), checkOut: d(8), adults: 3, reservationStatus: 'TENTATIVE' },
          ],
        },
      ],
    },
  ];
}
