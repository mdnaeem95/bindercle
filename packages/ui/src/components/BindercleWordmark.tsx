import { Text as RNText, type StyleProp, type TextStyle } from 'react-native';
import { useTheme } from '../theme';
import { fontFamilies } from '../tokens';

type BindercleWordmarkProps = {
  size?: number;
  style?: StyleProp<TextStyle>;
};

/**
 * The Bindercle wordmark.
 *
 * `bindercle` in Geist Semibold, all lowercase, tracking -0.02em.
 *
 * Keep it clean. The holo motif lives elsewhere in the brand —
 * on cards, badges, premium indicators, milestones — not in the wordmark.
 * See BRAND.md §6 for the full logo system.
 */
export function BindercleWordmark({ size = 56, style }: BindercleWordmarkProps) {
  const theme = useTheme();

  return (
    <RNText
      style={[
        {
          fontFamily: fontFamilies.sansSemibold,
          fontSize: size,
          lineHeight: size * 1.1,
          letterSpacing: -size * 0.02,
          color: theme.colors.textPrimary,
          alignSelf: 'center',
        },
        style,
      ]}
    >
      bindercle
    </RNText>
  );
}
