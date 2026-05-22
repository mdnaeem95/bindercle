import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme';
import { radius, spacing, typography } from '../tokens';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  /** Render an icon to the left of the label. */
  leadingIcon?: ReactNode;
  /** Render an icon to the right of the label. */
  trailingIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

const SIZES: Record<
  ButtonSize,
  { height: number; paddingHorizontal: number; variant: keyof typeof typography }
> = {
  sm: { height: 36, paddingHorizontal: spacing[5], variant: 'bodySmall' },
  md: { height: 48, paddingHorizontal: spacing[6], variant: 'body' },
  lg: { height: 56, paddingHorizontal: spacing[7], variant: 'bodyLarge' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leadingIcon,
  trailingIcon,
  style,
  children,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const { height, paddingHorizontal, variant: textVariant } = SIZES[size];
  const isDisabled = disabled || loading;

  const palette = (() => {
    switch (variant) {
      case 'primary':
        return {
          bg: theme.colors.textPrimary,
          bgPressed: theme.colors.textSecondary,
          fg: theme.colors.bgBase,
          border: 'transparent',
        };
      case 'secondary':
        return {
          bg: theme.colors.bgElevated2,
          bgPressed: theme.colors.bgElevated3,
          fg: theme.colors.textPrimary,
          border: theme.colors.borderDefault,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          bgPressed: theme.colors.bgElevated1,
          fg: theme.colors.textPrimary,
          border: 'transparent',
        };
      case 'destructive':
        return {
          bg: theme.semantic.error,
          bgPressed: theme.semantic.error,
          fg: theme.colors.bgBase,
          border: 'transparent',
        };
    }
  })();

  return (
    <Pressable
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        {
          height,
          paddingHorizontal,
          borderRadius: radius.lg,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: palette.border,
          backgroundColor: pressed ? palette.bgPressed : palette.bg,
          opacity: isDisabled ? 0.5 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing[3],
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {leadingIcon && <View>{leadingIcon}</View>}
          <Text
            variant={textVariant}
            style={{
              color: palette.fg,
              fontFamily: typography[textVariant].fontFamily,
              fontWeight: '600',
            }}
          >
            {children}
          </Text>
          {trailingIcon && <View>{trailingIcon}</View>}
        </>
      )}
    </Pressable>
  );
}
