import { rooms, reservations } from './mockData.js';

function withRoom(r) {
  return { ...r, room: rooms.find(room => room.id === r.roomId) };
}

export const resolvers = {
  Query: {
    rooms: () => rooms,

    housekeepingReport: (_, { date }) => {
      const reportDate = date ?? new Date().toISOString().split('T')[0];
      const summary = {
        total: rooms.length,
        cleaned: rooms.filter(r => r.status === 'CLEANED').length,
        uncleaned: rooms.filter(r => r.status === 'UNCLEANED').length,
        skipCleaning: rooms.filter(r => r.status === 'SKIP_CLEANING').length,
      };
      return { date: reportDate, rooms, summary };
    },

    reservations: (_, { startDate, endDate }) => {
      return reservations
        .filter(r => r.checkIn <= endDate && r.checkOut >= startDate)
        .map(withRoom);
    },

    calendarData: (_, { startDate, endDate }) => {
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

    housekeepingSchedule: (_, { startDate, endDate }) => {
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

    todayReservations: (_, { date }) => {
      const today = date ?? new Date().toISOString().split('T')[0];

      const checkingOut = reservations
        .filter(r => r.checkOut === today && r.guestStatus === 'CHECKED_IN')
        .map(withRoom);

      const checkingIn = reservations
        .filter(r => r.checkIn === today && r.guestStatus === 'CONFIRMED')
        .map(withRoom);

      const checkedOut = reservations
        .filter(r => r.checkOut === today && r.guestStatus === 'CHECKED_OUT')
        .map(withRoom);

      const inhouse = reservations
        .filter(r => r.checkIn < today && r.checkOut > today && r.guestStatus === 'CHECKED_IN')
        .map(withRoom);

      const counts = {
        unallocated: [...checkingIn].filter(r => r.isUnallocated).length,
        confirmed: checkingIn.length,
        checkedIn: inhouse.length + checkingOut.length,
        checkedOut: checkedOut.length,
      };

      return { checkingOut, checkingIn, checkedOut, inhouse, counts };
    },
  },

  Mutation: {
    updateRoomStatus: (_, { roomId, status }) => {
      const room = rooms.find(r => r.id === roomId);
      if (!room) throw new Error(`Room ${roomId} not found`);
      room.status = status;
      return room;
    },
  },
};
