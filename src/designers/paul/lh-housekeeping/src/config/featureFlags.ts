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

  /** Single-date variant: hides the calendar icon and date range bottom sheet
   *  so the week strip is the only date selector. Single-day view only. */
  singleDateSelector: false,
} as const;

export default FLAGS;
