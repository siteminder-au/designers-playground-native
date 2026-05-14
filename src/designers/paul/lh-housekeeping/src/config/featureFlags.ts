/**
 * Feature flags for demo/presentation purposes.
 * Toggle these to show/hide UI elements on the Housekeeping screen.
 */
const FLAGS = {
  /** Guest name + ID card icon in the guest info row */
  showGuestName: true,

  /** Pax counts (adults, children, infants) in the guest info row */
  showGuestPax: true,

  /** Check-in / check-out dates in the guest info row */
  showGuestDates: true,

  /** Bed configuration row (only visible for extra bed / rollaway / king bed) */
  showBedConfig: true,

  /** Late checkout badge on room number row */
  showLateCheckout: true,

  /** 8-digit booking reference ID, pinned right in the guest info row */
  showReservationId: true,

  /**
   * Date selector variant — three options:
   *  - 'range'     : default. Date header + calendar icon → opens range bottom sheet.
   *  - 'strip'     : week strip below the header, no calendar icon, single-day only.
   *  - 'monthSheet': tap the date header → opens single-date month-calendar sheet.
   */
  dateSelectorVariant: 'range' as 'range' | 'strip' | 'monthSheet',

  /** Render the room stats row as tappable chips that filter the list,
   *  instead of the default static informational strip. */
  roomStatsChips: false,

  /** Compact card variant — hides guest name, reservation ID, PAX, and bed
   *  config from the room card (moves them into the Notes sheet) and re-anchors
   *  the check-in/out badge to the left side of the card. */
  compactCard: false,
} as const;

export default FLAGS;
