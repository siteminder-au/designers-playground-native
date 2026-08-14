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
   *  - 'hero': full-screen announcement shown on entry (Apple 5.3.2/5.3.3 —
   *    recommended full-screen splash, shown to all eligible users at least once).
   *  - 'chip': persistent, non-dismissible row — always discoverable, doesn't
   *    rely on a promotional unit the user hasn't already closed (Apple 5.3.6 —
   *    a way to enable Tap to Pay outside of one-off communications).
   */
  tapToPayEntryVariant: 'banner' as 'banner' | 'hero' | 'chip',
} as const;

export default FLAGS;
