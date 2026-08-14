/**
 * Feature flags for demo/presentation purposes.
 * Toggle these to switch between design explorations inside the Payment
 * details (card list) screen.
 */
const FLAGS = {
  /**
   * Set up Tap to Pay entry-point variant — how the Payment details screen
   * surfaces the "set up Tap to Pay" prompt above the card list, all within
   * the checkout flow itself (Apple 5.3.7 — a trigger to enable Tap to Pay
   * at the point of relevance, rather than a generic top-of-page unit):
   *  - 'row': default. Plain text row — icon, label, arrow — with body copy
   *    below.
   *  - 'button': outlined full-width pill button — more visual commitment.
   *  - 'banner': tinted callout box with a headline and short body copy.
   *  - 'badge': small pill, lowest-key discovery.
   */
  tapToPaySetupVariant: 'row' as 'row' | 'button' | 'banner' | 'badge',
} as const;

export default FLAGS;
