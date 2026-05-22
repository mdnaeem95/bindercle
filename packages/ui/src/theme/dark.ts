import { colors } from '../tokens';

export const darkTheme = {
  mode: 'dark' as const,
  colors: colors.dark,
  holo: colors.holo,
  semantic: colors.semantic,
};

export type Theme = typeof darkTheme;
