import { query } from '../../db/pool.js';

const BASE_DATE_MS = Date.UTC(2026, 3, 21);

function dayToISO(day) {
  return new Date(BASE_DATE_MS + day * 86_400_000).toISOString().slice(0, 10);
}

const ROOM_IDS = [
  'br-1', 'br-2', 'br-3', 'br-4', 'br-5', 'br-6', 'br-7', 'br-8', 'br-9', 'br-10',
  'ds-1', 'ds-2', 'ds-3', 'ds-4', 'ds-5',
  'fr-1', 'fr-2', 'fr-3', 'fr-4', 'fr-5', 'fr-6', 'fr-7',
];

const ROOM_META = {
  br: { label: 'Room',        type: 'Bridge Room',  floor: 1, bedConfiguration: 'Twin Beds' },
  ds: { label: 'Suite',       type: 'Deluxe Suite', floor: 2, bedConfiguration: 'King Bed' },
  fr: { label: 'Family Room', type: 'Family Room',  floor: 3, bedConfiguration: 'Multiple Beds' },
};

const CALENDAR_TO_HK_ID = {
  'Room 1': 'br-1', 'Room 2': 'br-2', 'Room 3': 'br-3', 'Room 4': 'br-4', 'Room 5': 'br-5',
  'Room 6': 'br-6', 'Room 7': 'br-7', 'Room 8': 'br-8', 'Room 9': 'br-9', 'Room 10': 'br-10',
  'Suite 1': 'ds-1', 'Suite 2': 'ds-2', 'Suite 3': 'ds-3', 'Suite 4': 'ds-4', 'Suite 5': 'ds-5',
  'Family Room 1': 'fr-1', 'Family Room 2': 'fr-2', 'Family Room 3': 'fr-3',
  'Family Room 4': 'fr-4', 'Family Room 5': 'fr-5', 'Family Room 6': 'fr-6', 'Family Room 7': 'fr-7',
};

const CLEANING_DB_TO_GQL = {
  'cleaned':              'CLEANED',
  'need-cleaning':        'UNCLEANED',
  'need-deep-cleaning':   'DEEP_CLEAN',
  'skipped-cleaning':     'SKIP_CLEANING',
  'awaiting-inspection':  'AWAITING_INSPECTION',
};

const CLEANING_GQL_TO_DB = Object.fromEntries(
  Object.entries(CLEANING_DB_TO_GQL).map(([db, gql]) => [gql, db])
);

function buildRoom(roomId, dbStatus) {
  const meta = ROOM_META[roomId.split('-')[0]] ?? { label: roomId, type: 'Other', floor: 0, bedConfiguration: 'Standard' };
  const num = roomId.split('-')[1];
  return {
    id: roomId,
    number: `${meta.label} ${num}`,
    floor: meta.floor,
    type: meta.type,
    status: CLEANING_DB_TO_GQL[dbStatus] ?? 'UNCLEANED',
    assignedTo: null,
    notes: null,
    bedConfiguration: meta.bedConfiguration,
    isClosed: false,
  };
}

// Si stores times as "11:00 AM" / "2:00 PM". Convert to 24h "HH:MM" for downstream.
function to24h(time) {
  if (!time) return null;
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(time).trim());
  if (m) {
    let h = parseInt(m[1], 10);
    const isPm = m[3].toUpperCase() === 'PM';
    if (isPm && h !== 12) h += 12;
    if (!isPm && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m[2]}`;
  }
  return /^\d{1,2}:\d{2}$/.test(time) ? time : null;
}

// Si's thresholds: early check-in < 2pm, late check-out > 11am. Standard times
// (2pm/3pm check-in, 11am check-out) collapse to null so the UI shows the grey
// "Checking in" / "Checking out" badge; only special times surface in orange.
function asEarlyCheckIn(time24) {
  if (!time24) return null;
  const [h, m] = time24.split(':').map(Number);
  return h * 60 + m < 14 * 60 ? time24 : null;
}
function asLateCheckOut(time24) {
  if (!time24) return null;
  const [h, m] = time24.split(':').map(Number);
  return h * 60 + m > 11 * 60 ? time24 : null;
}

function buildReservation(data) {
  const isUnallocated = data.room === 'Unallocated';
  const checkIn = dayToISO(data.startDay);
  const checkOut = dayToISO(data.startDay + data.numberOfNights);

  let guestStatus = 'CONFIRMED';
  if (data.isCheckedOut) guestStatus = 'CHECKED_OUT';
  else if (data.isCheckedIn) guestStatus = 'CHECKED_IN';

  const checkInTime = asEarlyCheckIn(to24h(data.checkInTime));
  const checkOutTime = asLateCheckOut(to24h(data.checkOutTime));

  return {
    id: data.id,
    roomId: isUnallocated ? null : CALENDAR_TO_HK_ID[data.room] ?? null,
    guestName: data.guestName,
    checkIn,
    checkOut,
    adults: data.adults,
    children: data.children,
    infants: data.strollers,
    reservationStatus: 'CONFIRMED',
    guestStatus,
    isUnallocated,
    outstandingBalance: null,
    paymentExpired: data.isPaid === false,
    roomDisplayName: isUnallocated ? null : data.room,
    lateCheckout: checkOutTime !== null,
    earlyCheckout: checkInTime !== null,
    checkInTime,
    checkOutTime,
    guestComments: data.guestComment ?? null,
    extraItems: data.hasExtras ? ['Extras'] : [],
    bedConfiguration: null,
  };
}

async function loadRooms() {
  const { rows } = await query(
    'SELECT room_id, cleaning_status FROM si_room_cleaning'
  );
  const statusByRoom = new Map(rows.map(r => [r.room_id, r.cleaning_status]));
  return ROOM_IDS.map(id => buildRoom(id, statusByRoom.get(id)));
}

async function loadReservations() {
  const { rows } = await query('SELECT data FROM si_reservations');
  return rows.map(r => buildReservation(r.data));
}

function attachRoom(reservation, rooms) {
  const room = rooms.find(r => r.id === reservation.roomId);
  return { ...reservation, room };
}

export const resolvers = {
  Query: {
    rooms: () => loadRooms(),

    housekeepingReport: async (_, { date }) => {
      const reportDate = date ?? new Date().toISOString().split('T')[0];
      const rooms = await loadRooms();
      const summary = {
        total: rooms.length,
        cleaned: rooms.filter(r => r.status === 'CLEANED').length,
        uncleaned: rooms.filter(r => r.status === 'UNCLEANED').length,
        skipCleaning: rooms.filter(r => r.status === 'SKIP_CLEANING').length,
      };
      return { date: reportDate, rooms, summary };
    },

    reservations: async (_, { startDate, endDate }) => {
      const [rooms, reservations] = await Promise.all([loadRooms(), loadReservations()]);
      return reservations
        .filter(r => r.checkIn <= endDate && r.checkOut >= startDate)
        .map(r => attachRoom(r, rooms));
    },

    calendarData: async (_, { startDate, endDate }) => {
      const [rooms, reservations] = await Promise.all([loadRooms(), loadReservations()]);
      const typeMap = new Map();
      for (const room of rooms) {
        if (!typeMap.has(room.type)) typeMap.set(room.type, []);
        typeMap.get(room.type).push(room);
      }

      return Array.from(typeMap.entries()).map(([type, groupRooms]) => {
        const calendarRooms = groupRooms.map(room => {
          const roomReservations = reservations
            .filter(r => r.roomId === room.id && r.checkIn <= endDate && r.checkOut >= startDate)
            .map(r => ({
              id: r.id,
              guestName: r.guestName,
              checkIn: r.checkIn,
              checkOut: r.checkOut,
              adults: r.adults,
              reservationStatus: r.reservationStatus,
            }));
          return { id: room.id, number: room.number, status: room.status, reservations: roomReservations };
        });
        const unallocatedCount = calendarRooms.filter(r => r.reservations.length === 0).length;
        return { type, rooms: calendarRooms, unallocatedCount };
      });
    },

    housekeepingSchedule: async (_, { startDate, endDate }) => {
      const [rooms, reservations] = await Promise.all([loadRooms(), loadReservations()]);
      const days = [];
      let current = startDate;
      while (current <= endDate) {
        const dayRooms = rooms.map(room => {
          const res = reservations.find(
            r => r.roomId === room.id && r.checkIn <= current &&
                 (r.lateCheckout ? r.checkOut >= current : r.checkOut > current)
          );
          const hasCheckoutToday = reservations.some(
            r => r.roomId === room.id && r.checkOut === current
          );
          const hasCheckInToday = reservations.some(
            r => r.roomId === room.id && r.checkIn === current
          );
          return {
            room,
            isOccupied: !!res && res.guestStatus === 'CHECKED_IN',
            hasCheckoutToday,
            hasCheckInToday,
            guestCount: (res?.adults ?? 0) + (res?.children ?? 0) + (res?.infants ?? 0),
            adults:   res?.adults   ?? 0,
            children: res?.children ?? 0,
            infants:  res?.infants  ?? 0,
            reservationId: res?.id ?? null,
            guestName:     res?.guestName ?? null,
            checkIn:       res?.checkIn   ?? null,
            checkOut:      res?.checkOut  ?? null,
            checkInTime:   res?.checkInTime  ?? null,
            checkOutTime:  res?.checkOutTime ?? null,
            lateCheckout:  res?.lateCheckout  ?? false,
            earlyCheckout: res?.earlyCheckout ?? false,
            bedConfiguration: res?.bedConfiguration ?? room.bedConfiguration,
            guestComments: res?.guestComments ?? null,
            extraItems:    res?.extraItems    ?? [],
          };
        });
        days.push({ date: current, rooms: dayRooms });
        const d = new Date(current + 'T12:00:00');
        d.setDate(d.getDate() + 1);
        current = d.toISOString().split('T')[0];
      }
      return days;
    },

    todayReservations: async (_, { date }) => {
      const today = date ?? new Date().toISOString().split('T')[0];
      const [rooms, reservations] = await Promise.all([loadRooms(), loadReservations()]);

      const checkingOut = reservations
        .filter(r => r.checkOut === today && r.guestStatus === 'CHECKED_IN')
        .map(r => attachRoom(r, rooms));

      const checkingIn = reservations
        .filter(r => r.checkIn === today && r.guestStatus === 'CONFIRMED')
        .map(r => attachRoom(r, rooms));

      const checkedOut = reservations
        .filter(r => r.checkOut === today && r.guestStatus === 'CHECKED_OUT')
        .map(r => attachRoom(r, rooms));

      const inhouse = reservations
        .filter(r => r.checkIn < today && r.checkOut > today && r.guestStatus === 'CHECKED_IN')
        .map(r => attachRoom(r, rooms));

      const counts = {
        unallocated: checkingIn.filter(r => r.isUnallocated).length,
        confirmed: checkingIn.length,
        checkedIn: inhouse.length + checkingOut.length,
        checkedOut: checkedOut.length,
      };

      return { checkingOut, checkingIn, checkedOut, inhouse, counts };
    },

    staffNotes: async () => {
      const { rows } = await query(
        `SELECT id, room_id, author, text, tag, reservation_id, created_at, updated_at
         FROM si_staff_notes
         ORDER BY created_at ASC`,
      );
      return rows.map(buildStaffNote);
    },
  },

  Mutation: {
    updateRoomStatus: async (_, { roomId, status }) => {
      const dbStatus = CLEANING_GQL_TO_DB[status];
      if (!dbStatus) throw new Error(`Unknown RoomStatus: ${status}`);
      const { rows } = await query(
        `INSERT INTO si_room_cleaning (room_id, cleaning_status, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (room_id) DO UPDATE
           SET cleaning_status = EXCLUDED.cleaning_status,
               updated_at = NOW()
         RETURNING room_id, cleaning_status`,
        [roomId, dbStatus],
      );
      return buildRoom(rows[0].room_id, rows[0].cleaning_status);
    },

    addStaffNote: async (_, { id, roomId, author, text, tag, reservationId }) => {
      if (tag !== 'room' && tag !== 'guest') throw new Error(`Invalid tag: ${tag}`);
      // Idempotent on id per Si's contract — re-posting the same id is a no-op.
      await query(
        `INSERT INTO si_staff_notes (id, room_id, author, text, tag, reservation_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [id, roomId, author, text, tag, reservationId ?? null],
      );
      const { rows } = await query(
        `SELECT id, room_id, author, text, tag, reservation_id, created_at, updated_at
         FROM si_staff_notes WHERE id = $1`,
        [id],
      );
      return buildStaffNote(rows[0]);
    },

    updateStaffNote: async (_, { id, text }) => {
      const { rows } = await query(
        `UPDATE si_staff_notes
         SET text = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, room_id, author, text, tag, reservation_id, created_at, updated_at`,
        [text, id],
      );
      if (!rows[0]) throw new Error(`StaffNote ${id} not found`);
      return buildStaffNote(rows[0]);
    },
  },
};

function buildStaffNote(row) {
  return {
    id: row.id,
    roomId: row.room_id,
    author: row.author,
    text: row.text,
    tag: row.tag,
    reservationId: row.reservation_id,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}
