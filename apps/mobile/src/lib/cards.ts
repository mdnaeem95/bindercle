/**
 * Card display helpers.
 */

const HOLO_MARKERS = [
  'holo',
  'secret',
  'rainbow',
  'ultra',
  'full art',
  'gold',
  'hyper',
  'illustration',
  'alt',
  'special',
  'shiny',
] as const;

/**
 * Should this card visibly shimmer in the UI?
 *
 * Heuristic match against the rarity string from the TCG mirror or
 * user-entered text. Errs on the side of "shimmer" — better to over-tint
 * an unusual rare than to under-tint a card the user is showing off.
 */
export function isHolo(rarity?: string | null): boolean {
  if (!rarity) return false;
  const lower = rarity.toLowerCase();
  return HOLO_MARKERS.some((marker) => lower.includes(marker));
}
