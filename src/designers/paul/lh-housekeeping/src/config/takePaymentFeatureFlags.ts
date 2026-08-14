/**
 * Feature flags for demo/presentation purposes.
 * Toggle these to switch between design explorations inside the Take
 * Payment modal.
 */
const FLAGS = {
  /**
   * Set up Tap to Pay entry-point variant — how the Take Payment modal
   * surfaces the "set up Tap to Pay" prompt, all within the checkout flow
   * itself (Apple 5.3.7 — a trigger to enable Tap to Pay at the point of
   * relevance, rather than a generic top-of-page unit):
   *  - 'row': default. Plain text row above the amount field — icon, label,
   *    arrow.
   *  - 'button': outlined full-width pill button — more visual commitment.
   *  - 'banner': tinted callout box with a headline and short body copy.
   *  - 'badge': small pill next to the card details — lowest-key discovery.
   */
  tapToPaySetupVariant: 'row' as 'row' | 'button' | 'banner' | 'badge',
} as const;

export default FLAGS;
