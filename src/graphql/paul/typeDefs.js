export const typeDefs = `#graphql

  enum RoomStatus {
    CLEANED
    UNCLEANED
    SKIP_CLEANING
  }

  enum ReservationStatus {
    CONFIRMED
    TENTATIVE
  }

  enum GuestStatus {
    CONFIRMED
    CHECKED_IN
    CHECKED_OUT
  }

  type Room {
    id: ID!
    number: String!
    floor: Int!
    type: String!
    status: RoomStatus!
    assignedTo: String
    notes: String
    bedConfiguration: String!
  }

  type Reservation {
    id: ID!
    room: Room!
    guestName: String!
    checkIn: String!
    checkOut: String!
    adults: Int!
    reservationStatus: ReservationStatus!
    guestStatus: GuestStatus!
    isUnallocated: Boolean!
    outstandingBalance: Float
    paymentExpired: Boolean!
    roomDisplayName: String
  }

  type HousekeepingSummary {
    total: Int!
    cleaned: Int!
    uncleaned: Int!
    skipCleaning: Int!
  }

  type HousekeepingReport {
    date: String!
    rooms: [Room!]!
    summary: HousekeepingSummary!
  }

  type CalendarReservation {
    id: ID!
    guestName: String!
    checkIn: String!
    checkOut: String!
    adults: Int!
    reservationStatus: ReservationStatus!
  }

  type CalendarRoom {
    id: ID!
    number: String!
    status: RoomStatus!
    reservations: [CalendarReservation!]!
  }

  type RoomGroup {
    type: String!
    rooms: [CalendarRoom!]!
    unallocatedCount: Int!
  }

  type ReservationCounts {
    unallocated: Int!
    confirmed: Int!
    checkedIn: Int!
    checkedOut: Int!
  }

  type TodayReservations {
    checkingOut: [Reservation!]!
    checkingIn: [Reservation!]!
    checkedOut: [Reservation!]!
    inhouse: [Reservation!]!
    counts: ReservationCounts!
  }

  type RoomDaySchedule {
    room: Room!
    isOccupied: Boolean!
    guestCount: Int!
    adults: Int!
    children: Int!
    infants: Int!
    reservationId: String
    guestName: String
    checkIn: String
    checkOut: String
    lateCheckout: Boolean!
    bedConfiguration: String!
  }

  type DaySchedule {
    date: String!
    rooms: [RoomDaySchedule!]!
  }

  type Query {
    housekeepingReport(date: String): HousekeepingReport!
    reservations(startDate: String!, endDate: String!): [Reservation!]!
    rooms: [Room!]!
    calendarData(startDate: String!, endDate: String!): [RoomGroup!]!
    todayReservations(date: String): TodayReservations!
    housekeepingSchedule(startDate: String!, endDate: String!): [DaySchedule!]!
  }

  type Mutation {
    updateRoomStatus(roomId: ID!, status: RoomStatus!): Room!
  }
`;
