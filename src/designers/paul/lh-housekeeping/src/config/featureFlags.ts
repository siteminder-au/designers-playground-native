/**
 * Feature flags for demo/presentation purposes.
 * Toggle these to show/hide UI elements on the Housekeeping screen.
 */
const FLAGS = {
  /** Live data — when on, the Housekeeping schedule/status/notes come from
   *  Si's shared si_reservations/si_room_cleaning tables (requires the shared
   *  DB to be kept populated). When off, the screen shows a fixed set of mock
   *  rooms/statuses matching the Figma design exactly, identical every day,
   *  with no shared-database dependency. */
  liveData: false,

  /** Guest name + ID card icon in the guest info row */
  showGuestName: true,

  /** Pax counts (adults, children, infants) in the guest info row */
  showGuestPax: true,

  /** Check-in / check-out dates in the guest info row */
  showGuestDates: true,

  /** Bed configuration row (only visible for extra bed / rollaway / king bed) */
  showBedConfig: false,

  /** Late checkout badge on room number row */
  showLateCheckout: true,

  /** 8-digit booking reference ID, pinned right in the guest info row */
  showReservationId: false,

  /** Icon on the cleaning status pill (brush, checkmark, etc.) */
  showStatusIcon: false,

  /**
   * Date selector variant — three options:
   *  - 'range'     : date header only, no calendar icon (range sheet has no
   *                  Top Nav entry point currently — kept for future rework).
   *  - 'strip'     : week strip below the header, single-day only.
   *  - 'monthSheet': default. Tap the date header → opens single-date month-calendar sheet.
   */
  dateSelectorVariant: 'monthSheet' as 'range' | 'strip' | 'monthSheet',

  /** Compact card variant — hides guest name, reservation ID, PAX, and bed
   *  config from the room card (moves them into the Notes sheet) and re-anchors
   *  the check-in/out badge to the left side of the card. */
  compactCard: false,

  /** Print button in the sort/filter toolbar (opens the print preview). */
  showPrint: false,

  /** Sort control in the toolbar (field + direction toggle). Off by default. */
  showSort: false,
} as const;

export default FLAGS;
