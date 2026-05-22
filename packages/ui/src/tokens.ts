/**
 * Foilio design tokens.
 * Source of truth: BRAND.md (§4 Color, §5 Typography, §10 Motion, §11 Tokens).
 * Update this file if BRAND.md changes — they must stay in sync.
 */

export const colors = {
  // Dark mode (default)
  dark: {
    bgBase: '#0A0A0F',
    bgElevated1: '#14141A',
    bgElevated2: '#1F1F28',
    bgElevated3: '#2A2A33',
    borderSubtle: '#2A2A33',
    borderDefault: '#3A3A45',
    textPrimary: '#F8F8F2',
    textSecondary: '#B5B5B8',
    textTertiary: '#6E6E76',
    textDisabled: '#4A4A52',
  },
  // Light mode (secondary — shared web links, accessibility)
  light: {
    bgBase: '#FBFAF7',
    bgElevated1: '#FFFFFF',
    bgElevated2: '#F0EFEA',
    bgElevated3: '#E5E4DD',
    borderSubtle: '#D8D6CF',
    borderDefault: '#D8D6CF',
    textPrimary: '#0A0A0F',
    textSecondary: '#4A4A52',
    textTertiary: '#8B8B92',
    textDisabled: '#B5B5B8',
  },
  // Holo gradient — constant across modes (the signature)
  holo: {
    stop1: '#FF00C8', // hot pink
    stop2: '#FFB800', // gold
    stop3: '#00E5FF', // electric cyan
    stop4: '#7B5FFF', // deep violet
    defaultAngle: 120,
  },
  // Semantic — calibrated for dark mode primary
  semantic: {
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',
  },
} as const;

export const holoStops = [
  colors.holo.stop1,
  colors.holo.stop2,
  colors.holo.stop3,
  colors.holo.stop4,
] as const;

export const fontFamilies = {
  sans: 'Geist',
  sansMedium: 'Geist-Medium',
  sansSemibold: 'Geist-Semibold',
  serif: 'InstrumentSerif',
  serifItalic: 'InstrumentSerif-Italic',
  mono: 'GeistMono',
} as const;

export const typography = {
  display1: {
    fontFamily: fontFamilies.serifItalic,
    fontSize: 56,
    lineHeight: 64,
    fontWeight: '400',
    letterSpacing: -0.56,
  },
  display2: {
    fontFamily: fontFamilies.serif,
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '400',
    letterSpacing: -0.4,
  },
  heading1: {
    fontFamily: fontFamilies.sansSemibold,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '600',
    letterSpacing: -0.32,
  },
  heading2: {
    fontFamily: fontFamilies.sansSemibold,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: -0.24,
  },
  heading3: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '500',
  },
  bodyLarge: {
    fontFamily: fontFamilies.sans,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400',
  },
  body: {
    fontFamily: fontFamilies.sans,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodySmall: {
    fontFamily: fontFamilies.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  caption: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  mono: {
    fontFamily: fontFamilies.mono,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
} as const;

export type TypographyVariant = keyof typeof typography;

export const spacing = {
  0: 0,
  1: 2,
  2: 4,
  3: 8,
  4: 12,
  5: 16,
  6: 20,
  7: 24,
  8: 32,
  9: 40,
  10: 48,
  11: 64,
  12: 80,
  13: 96,
  14: 128,
} as const;

export type SpacingToken = keyof typeof spacing;

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

export const elevation = {
  0: 'none' as const,
  1: { offsetX: 0, offsetY: 1, blur: 2, color: 'rgba(0, 0, 0, 0.3)' },
  2: { offsetX: 0, offsetY: 4, blur: 12, color: 'rgba(0, 0, 0, 0.35)' },
  3: { offsetX: 0, offsetY: 12, blur: 32, color: 'rgba(0, 0, 0, 0.4)' },
  4: { offsetX: 0, offsetY: 24, blur: 64, color: 'rgba(0, 0, 0, 0.5)' },
} as const;

export const opacity = {
  0: 0,
  5: 0.05,
  10: 0.1,
  20: 0.2,
  40: 0.4,
  60: 0.6,
  80: 0.8,
  100: 1,
} as const;

export const zIndex = {
  base: 0,
  raised: 10,
  overlay: 100,
  modal: 1000,
  toast: 10000,
} as const;

export const motion = {
  duration: {
    instant: 100,
    fast: 200,
    standard: 350,
    deliberate: 500,
    hero: 800,
  },
  easing: {
    standard: [0.4, 0.0, 0.2, 1] as const,
    emphasized: [0.2, 0.0, 0, 1] as const,
    exit: [0.4, 0.0, 1, 1] as const,
  },
  spring: {
    default: { damping: 20, stiffness: 200 },
    gyro: { damping: 20, stiffness: 90 },
  },
} as const;
