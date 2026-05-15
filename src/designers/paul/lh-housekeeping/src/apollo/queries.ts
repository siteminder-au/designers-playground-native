import { gql } from '@apollo/client';

export const GET_HOUSEKEEPING_REPORT = gql`
  query GetHousekeepingReport($date: String) {
    housekeepingReport(date: $date) {
      date
      summary {
        total
        cleaned
        uncleaned
        skipCleaning
      }
      rooms {
        id
        number
        floor
        type
        status
        assignedTo
        notes
      }
    }
  }
`;

export const GET_CALENDAR_DATA = gql`
  query GetCalendarData($startDate: String!, $endDate: String!) {
    calendarData(startDate: $startDate, endDate: $endDate) {
      type
      unallocatedCount
      rooms {
        id
        number
        status
        reservations {
          id
          guestName
          checkIn
          checkOut
          adults
          reservationStatus
        }
      }
    }
  }
`;

export const GET_HOUSEKEEPING_SCHEDULE = gql`
  query GetHousekeepingSchedule($startDate: String!, $endDate: String!) {
    housekeepingSchedule(startDate: $startDate, endDate: $endDate) {
      date
      rooms {
        isOccupied
        hasCheckoutToday
        hasCheckInToday
        guestCount
        adults
        children
        infants
        reservationId
        guestName
        checkIn
        checkOut
        checkInTime
        checkOutTime
        lateCheckout
        earlyCheckout
        bedConfiguration
        guestComments
        extraItems
        room {
          id
          number
          type
          status
          notes
          isClosed
        }
      }
    }
  }
`;

export const GET_TODAY_RESERVATIONS = gql`
  query GetTodayReservations($date: String) {
    todayReservations(date: $date) {
      counts {
        unallocated
        confirmed
        checkedIn
        checkedOut
      }
      checkingOut {
        id
        guestName
        checkIn
        checkOut
        adults
        guestStatus
        isUnallocated
        outstandingBalance
        paymentExpired
        roomDisplayName
      }
      checkingIn {
        id
        guestName
        checkIn
        checkOut
        adults
        guestStatus
        isUnallocated
        outstandingBalance
        paymentExpired
        roomDisplayName
      }
      checkedOut {
        id
        guestName
        checkIn
        checkOut
        adults
        guestStatus
        roomDisplayName
      }
      inhouse {
        id
        guestName
        checkIn
        checkOut
        adults
        guestStatus
        roomDisplayName
      }
    }
  }
`;

export const UPDATE_ROOM_STATUS = gql`
  mutation UpdateRoomStatus($roomId: ID!, $status: RoomStatus!) {
    updateRoomStatus(roomId: $roomId, status: $status) {
      id
      status
    }
  }
`;

export const GET_STAFF_NOTES = gql`
  query GetStaffNotes {
    staffNotes {
      id
      roomId
      author
      text
      tag
      reservationId
      createdAt
      updatedAt
    }
  }
`;

export const ADD_STAFF_NOTE = gql`
  mutation AddStaffNote($id: ID!, $roomId: ID!, $author: String!, $text: String!, $tag: String!, $reservationId: String) {
    addStaffNote(id: $id, roomId: $roomId, author: $author, text: $text, tag: $tag, reservationId: $reservationId) {
      id
      roomId
      author
      text
      tag
      reservationId
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_STAFF_NOTE = gql`
  mutation UpdateStaffNote($id: ID!, $text: String!) {
    updateStaffNote(id: $id, text: $text) {
      id
      text
      updatedAt
    }
  }
`;
