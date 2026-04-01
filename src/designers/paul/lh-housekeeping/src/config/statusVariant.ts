/**
 * STATUS_VARIANT controls how room cleaning status is rendered across screens.
 * All variants use colour as a secondary reinforcer only — shape or text carries
 * the primary signal so the UI works for colour-blind users.
 *
 *  'icon'   — original: pastel bg pill (icon + label + chevron) in Housekeeping;
 *             Ionicons icon next to room number in Calendar.
 *
 *  'symbol' — Housekeeping-semantic icons (sparkles / alert / moon) housed in a
 *             fixed-size container so all icons appear visually consistent.
 *             Container shape is controlled by SYMBOL_CONTAINER below.
 *             Calendar: icon in container beside room number.
 *             Housekeeping: container + label text + chevron on neutral bg.
 *
 *  'abbr'   — Short text abbreviation pill ("CLN" / "UNC" / "SKP").
 *             Text label is the primary signal; a coloured left border is secondary.
 */
export type StatusVariant = 'icon' | 'symbol' | 'abbr';
export const STATUS_VARIANT: StatusVariant = 'symbol';

/**
 * SYMBOL_CONTAINER applies when STATUS_VARIANT === 'symbol'.
 * Controls the shape of the fixed-size icon wrapper.
 *
 *  'circle'         — tinted filled circle
 *  'rounded-square' — tinted filled rounded square (app-icon feel)
 *  'chip'           — fixed-height pill; shows icon + label in Housekeeping,
 *                     icon only in Calendar (space-constrained)
 */
export type SymbolContainer = 'circle' | 'rounded-square' | 'chip';
export const SYMBOL_CONTAINER: SymbolContainer = 'circle';
