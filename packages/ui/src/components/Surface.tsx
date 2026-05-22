import type { ReactNode } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';

type SurfaceProps = {
  /** Surface level: 0 = base canvas, 1-3 = progressively elevated. */
  level?: 0 | 1 | 2 | 3;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/**
 * Foilio Surface. Renders a background-tinted View using the current theme's
 * elevation levels. In dark mode, depth comes from surface color, not shadow.
 */
export function Surface({ level = 0, style, children }: SurfaceProps) {
  const theme = useTheme();

  const backgroundColor =
    level === 0
      ? theme.colors.bgBase
      : level === 1
        ? theme.colors.bgElevated1
        : level === 2
          ? theme.colors.bgElevated2
          : theme.colors.bgElevated3;

  return <View style={[{ backgroundColor }, style]}>{children}</View>;
}
