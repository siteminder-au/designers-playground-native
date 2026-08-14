/**
 * Feature flags for demo/presentation purposes.
 * Toggle these to switch between design explorations on the Reservations screen.
 */
const FLAGS = {
  /**
   * Tap to Pay entry-point variant — how the Reservations screen surfaces
   * the "set up Tap to Pay" prompt. More variants land here as they're
   * explored:
   *  - 'banner': default. Dismissible inline banner below the filter chips.
   */
  tapToPayEntryVariant: 'banner' as 'banner',
} as const;

export default FLAGS;
