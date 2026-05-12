import { query } from '../../db/pool.js';
import { ensureSchema } from './seed.js';

await ensureSchema();

const ROOM_COLS = `
  id,
  number,
  floor,
  type,
  status,
  assigned_to       AS "assignedTo",
  notes,
  bed_configuration AS "bedConfiguration"
`;

const RESERVATION_COLS = `
  id,
  room_id                                     AS "roomId",
  guest_name                                  AS "guestName",
  TO_CHAR(check_in,  'YYYY-MM-DD')            AS "checkIn",
  TO_CHAR(check_out, 'YYYY-MM-DD')            AS "checkOut",
  adults,
  children,
  infants,
  reservation_status                          AS "reservationStatus",
  guest_status                                AS "guestStatus",
  is_unallocated                              AS "isUnallocated",
  outstanding_balance                         AS "outstandingBalance",
  payment_expired                             AS "paymentExpired",
  room_display_name                           AS "roomDisplayName",
  late_checkout                               AS "lateCheckout",
  bed_configuration                           AS "bedConfiguration"
`;

async function loadRooms() {
  const { rows } = await query(`SELECT ${ROOM_COLS} FROM paul_rooms ORDER BY id::int`);
  return rows;
}

async function loadReservations() {
  const { rows } = await query(`SELECT ${RESERVATION_COLS} FROM paul_reservations`);
  return rows;
}

function withRoom(reservation, rooms) {
  return { ...reservation, room: rooms.find(room => room.id === reservation.roomId) };
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
        .map(r => withRoom(r, rooms));
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
          return {
            room,
            isOccupied: !!res,
            guestCount: (res?.adults ?? 0) + (res?.children ?? 0) + (res?.infants ?? 0),
            adults:   res?.adults   ?? 0,
            children: res?.children ?? 0,
            infants:  res?.infants  ?? 0,
            reservationId: res?.id ?? null,
            guestName:     res?.guestName ?? null,
            checkIn:       res?.checkIn   ?? null,
            checkOut:      res?.checkOut  ?? null,
            lateCheckout:  res?.lateCheckout  ?? false,
            bedConfiguration: res?.bedConfiguration ?? room.bedConfiguration,
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
        .map(r => withRoom(r, rooms));

      const checkingIn = reservations
        .filter(r => r.checkIn === today && r.guestStatus === 'CONFIRMED')
        .map(r => withRoom(r, rooms));

      const checkedOut = reservations
        .filter(r => r.checkOut === today && r.guestStatus === 'CHECKED_OUT')
        .map(r => withRoom(r, rooms));

      const inhouse = reservations
        .filter(r => r.checkIn < today && r.checkOut > today && r.guestStatus === 'CHECKED_IN')
        .map(r => withRoom(r, rooms));

      const counts = {
        unallocated: checkingIn.filter(r => r.isUnallocated).length,
        confirmed: checkingIn.length,
        checkedIn: inhouse.length + checkingOut.length,
        checkedOut: checkedOut.length,
      };

      return { checkingOut, checkingIn, checkedOut, inhouse, counts };
    },
  },

  Mutation: {
    updateRoomStatus: async (_, { roomId, status }) => {
      const { rows } = await query(
        `UPDATE paul_rooms SET status = $1 WHERE id = $2
         RETURNING ${ROOM_COLS}`,
        [status, roomId],
      );
      if (rows.length === 0) throw new Error(`Room ${roomId} not found`);
      return rows[0];
    },
  },
};
