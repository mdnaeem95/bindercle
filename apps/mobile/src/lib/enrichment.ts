/**
 * Display-layer enrichment.
 *
 * TCG APIs (especially TCGdex) return inconsistent data quality —
 * some cards have rarity, some don't; some have set names, some only
 * codes. These helpers normalize the messy real-world values into a
 * clean "show this or show nothing" output.
 */

const EMPTY_RARITY_MARKERS = new Set([
  'none',
  'n/a',
  'na',
  'unknown',
  'null',
  'undefined',
  '-',
  '—',
  '',
]);

/**
 * Normalize a rarity string. Returns null for any value that means
 * "we don't have rarity data" — including placeholder strings like
 * "None" / "N/A" that some API responses use instead of null.
 */
export function normalizeRarity(rarity?: string | null): string | null {
  if (rarity == null) return null;
  const trimmed = rarity.trim();
  if (EMPTY_RARITY_MARKERS.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

/**
 * Pick the best display string for a card's set.
 * Prefers the human-readable set name; falls back to the set code (which
 * we always have when a TCG card is linked).
 */
export function displaySetName(setName?: string | null, setCode?: string | null): string | null {
  const cleanName = setName?.trim();
  const cleanCode = setCode?.trim();
  if (cleanName && cleanName.toLowerCase() !== cleanCode?.toLowerCase()) {
    return cleanName;
  }
  if (cleanCode) return cleanCode;
  return null;
}
