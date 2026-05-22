import type { ReactNode } from 'react';
import { Text as RNText, type StyleProp, type TextStyle } from 'react-native';
import { useTheme } from '../theme';
import { type TypographyVariant, typography } from '../tokens';

type TextProps = {
  variant?: TypographyVariant;
  tone?: 'primary' | 'secondary' | 'tertiary' | 'disabled';
  align?: 'left' | 'center' | 'right';
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  children: ReactNode;
};

/**
 * Foilio Text primitive. Maps semantic variants from BRAND.md §5 to a styled RN Text.
 *
 * Body copy is always Geist. Instrument Serif is for *moments*, not paragraphs.
 * Numbers in card metadata → use `variant="mono"` for Geist Mono with tabular figures.
 */
export function Text({
  variant = 'body',
  tone = 'primary',
  align = 'left',
  style,
  numberOfLines,
  children,
}: TextProps) {
  const theme = useTheme();
  const variantStyle = typography[variant];

  const color =
    tone === 'primary'
      ? theme.colors.textPrimary
      : tone === 'secondary'
        ? theme.colors.textSecondary
        : tone === 'tertiary'
          ? theme.colors.textTertiary
          : theme.colors.textDisabled;

  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily: variantStyle.fontFamily,
          fontSize: variantStyle.fontSize,
          lineHeight: variantStyle.lineHeight,
          fontWeight: variantStyle.fontWeight as TextStyle['fontWeight'],
          textAlign: align,
          color,
        },
        'letterSpacing' in variantStyle ? { letterSpacing: variantStyle.letterSpacing } : null,
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
