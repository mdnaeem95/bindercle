/**
 * Foilio accent palette.
 *
 * Twelve curated, playful tints designed to work over the Holo Luxe dark
 * canvas. Each accent has three forms:
 *
 * - `solid`  — the brand-saturated form, used as a tint on title text /
 *              icons / progress indicators.
 * - `soft`   — a low-saturation companion for surfaces (border tints,
 *              subtle backgrounds).
 * - `glow`   — a semi-transparent form for layering (binder-card overlay,
 *              cover-image atmosphere wash).
 *
 * Keep the set bounded — users pick a vibe, not a free hex code that could
 * clash with the rest of the UI. Add new accents to BOTH this map AND the
 * `accent_color_values` CHECK constraint in supabase migrations.
 */

export const ACCENT_COLORS = [
  'pink',
  'mint',
  'cherry',
  'lemon',
  'lavender',
  'sky',
  'peach',
  'sage',
  'rose',
  'coral',
  'aqua',
  'butter',
] as const;

export type AccentColor = (typeof ACCENT_COLORS)[number];

export const ACCENT_PALETTE: Record<
  AccentColor,
  { solid: string; soft: string; glow: string; label: string }
> = {
  pink: {
    solid: '#FFB3D9',
    soft: '#693955',
    glow: 'rgba(255, 179, 217, 0.18)',
    label: 'Cotton candy',
  },
  mint: { solid: '#A8E6CF', soft: '#385C4E', glow: 'rgba(168, 230, 207, 0.18)', label: 'Mint' },
  cherry: { solid: '#FF7373', soft: '#6B2929', glow: 'rgba(255, 115, 115, 0.18)', label: 'Cherry' },
  lemon: { solid: '#FFE793', soft: '#5C522E', glow: 'rgba(255, 231, 147, 0.18)', label: 'Lemon' },
  lavender: {
    solid: '#C7B8FF',
    soft: '#473F6B',
    glow: 'rgba(199, 184, 255, 0.18)',
    label: 'Lavender',
  },
  sky: { solid: '#8FD3FF', soft: '#2D4D66', glow: 'rgba(143, 211, 255, 0.18)', label: 'Sky' },
  peach: { solid: '#FFCBA1', soft: '#6B4A33', glow: 'rgba(255, 203, 161, 0.18)', label: 'Peach' },
  sage: { solid: '#B5CDA3', soft: '#475539', glow: 'rgba(181, 205, 163, 0.18)', label: 'Sage' },
  rose: { solid: '#FFA0B4', soft: '#6B3D49', glow: 'rgba(255, 160, 180, 0.18)', label: 'Rose' },
  coral: { solid: '#FF9580', soft: '#6B3E33', glow: 'rgba(255, 149, 128, 0.18)', label: 'Coral' },
  aqua: { solid: '#8FE5DA', soft: '#2D5953', glow: 'rgba(143, 229, 218, 0.18)', label: 'Aqua' },
  butter: { solid: '#FFE0A8', soft: '#5C4A2A', glow: 'rgba(255, 224, 168, 0.18)', label: 'Butter' },
};

export function accentSolid(accent: AccentColor | null | undefined): string | null {
  if (!accent) return null;
  return ACCENT_PALETTE[accent]?.solid ?? null;
}

export function accentGlow(accent: AccentColor | null | undefined): string | null {
  if (!accent) return null;
  return ACCENT_PALETTE[accent]?.glow ?? null;
}
