// Paul-side demo overlay for the Reservations page.
//
// Si's si_reservations data is anchored to a fixed BASE_DATE, so on any
// real-world date past that window the Reservations page renders empty.
// This module produces a deterministic set of mock reservations anchored to
// "today" so customer demos always show a populated list, regardless of when
// the prototype is opened.
//
// Scoped exclusively to the `todayReservations` resolver — never injected
// into `housekeepingSchedule` or `calendarData`. Mock IDs are prefixed with
// `paul-mock-` so the client can detect them and disable interactive CTAs.
//
// Nothing here writes to the shared Postgres tables. Si's web prototype is
// unaffected.

export const MOCK_ID_PREFIX = 'paul-mock-';

function addDaysISO(isoDate, n) {
  const d = new Date(isoDate + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function mock(overrides) {
  return {
    id: overrides.id,
    roomId: overrides.roomId ?? null,
    guestName: overrides.guestName,
    checkIn: overrides.checkIn,
    checkOut: overrides.checkOut,
    adults: overrides.adults ?? 1,
    children: overrides.children ?? 0,
    infants: overrides.infants ?? 0,
    reservationStatus: 'CONFIRMED',
    guestStatus: overrides.guestStatus,
    isUnallocated: overrides.roomId == null,
    outstandingBalance: null,
    paymentExpired: overrides.paymentExpired ?? false,
    roomDisplayName: overrides.roomDisplayName ?? null,
    lateCheckout: false,
    earlyCheckout: false,
    checkInTime: null,
    checkOutTime: null,
    guestComments: null,
    extraItems: [],
    bedConfiguration: null,
  };
}

// Deterministic demo set. Date offsets relative to `today` are anchored at
// request time, so the same shape of demo plays out for any real-world day.
export function demoReservationsForToday(today) {
  return [
    // ── Checking in today ─────────────────────────────────────────────────
    mock({
      id: `${MOCK_ID_PREFIX}ci-1`, roomId: 'br-1', roomDisplayName: 'Room 1',
      guestName: 'Alice Foster', adults: 2,
      checkIn: today, checkOut: addDaysISO(today, 7),
      guestStatus: 'CONFIRMED',
    }),
    mock({
      id: `${MOCK_ID_PREFIX}ci-2`, roomId: 'br-4', roomDisplayName: 'Room 4',
      guestName: 'Yasmin Ellis', adults: 1,
      checkIn: today, checkOut: addDaysISO(today, 6),
      guestStatus: 'CONFIRMED', paymentExpired: true,
    }),
    mock({
      id: `${MOCK_ID_PREFIX}ci-3`, roomId: 'br-8', roomDisplayName: 'Room 8',
      guestName: 'Fiona King', adults: 2, children: 1,
      checkIn: today, checkOut: addDaysISO(today, 7),
      guestStatus: 'CONFIRMED', paymentExpired: true,
    }),
    mock({
      id: `${MOCK_ID_PREFIX}ci-4`, roomId: 'ds-2', roomDisplayName: 'Suite 2',
      guestName: 'Marcus Chen', adults: 2,
      checkIn: today, checkOut: addDaysISO(today, 3),
      guestStatus: 'CONFIRMED',
    }),
    mock({
      id: `${MOCK_ID_PREFIX}ci-5`, roomId: null, roomDisplayName: null,
      guestName: 'Hannah Webb', adults: 1,
      checkIn: today, checkOut: addDaysISO(today, 2),
      guestStatus: 'CONFIRMED',
    }),

    // ── Checking out today (currently checked in) ─────────────────────────
    mock({
      id: `${MOCK_ID_PREFIX}co-1`, roomId: 'br-2', roomDisplayName: 'Room 2',
      guestName: 'David Park', adults: 2,
      checkIn: addDaysISO(today, -4), checkOut: today,
      guestStatus: 'CHECKED_IN',
    }),
    mock({
      id: `${MOCK_ID_PREFIX}co-2`, roomId: 'fr-1', roomDisplayName: 'Family Room 1',
      guestName: 'The Rodriguez Family', adults: 2, children: 2,
      checkIn: addDaysISO(today, -3), checkOut: today,
      guestStatus: 'CHECKED_IN',
    }),

    // ── Stay-throughs (in-house, mid-stay) ────────────────────────────────
    mock({
      id: `${MOCK_ID_PREFIX}sth-1`, roomId: 'br-3', roomDisplayName: 'Room 3',
      guestName: 'Rachel Xavier', adults: 1,
      checkIn: addDaysISO(today, -2), checkOut: addDaysISO(today, 5),
      guestStatus: 'CHECKED_IN',
    }),
    mock({
      id: `${MOCK_ID_PREFIX}sth-2`, roomId: 'br-5', roomDisplayName: 'Room 5',
      guestName: 'Harold Nash', adults: 2,
      checkIn: addDaysISO(today, -1), checkOut: addDaysISO(today, 4),
      guestStatus: 'CHECKED_IN',
    }),
    mock({
      id: `${MOCK_ID_PREFIX}sth-3`, roomId: 'br-6', roomDisplayName: 'Room 6',
      guestName: 'Paula Vega', adults: 1, children: 1,
      checkIn: addDaysISO(today, -3), checkOut: addDaysISO(today, 2),
      guestStatus: 'CHECKED_IN',
    }),
    mock({
      id: `${MOCK_ID_PREFIX}sth-4`, roomId: 'ds-1', roomDisplayName: 'Suite 1',
      guestName: 'Sean Turner', adults: 2,
      checkIn: addDaysISO(today, -5), checkOut: addDaysISO(today, 3),
      guestStatus: 'CHECKED_IN',
    }),
    mock({
      id: `${MOCK_ID_PREFIX}sth-5`, roomId: 'fr-3', roomDisplayName: 'Family Room 3',
      guestName: 'The Bennett Family', adults: 2, children: 1, infants: 1,
      checkIn: addDaysISO(today, -2), checkOut: addDaysISO(today, 6),
      guestStatus: 'CHECKED_IN',
    }),

    // ── Already checked out today ─────────────────────────────────────────
    mock({
      id: `${MOCK_ID_PREFIX}done-1`, roomId: 'br-9', roomDisplayName: 'Room 9',
      guestName: 'Owen Turner', adults: 1,
      checkIn: addDaysISO(today, -2), checkOut: today,
      guestStatus: 'CHECKED_OUT',
    }),
  ];
}
