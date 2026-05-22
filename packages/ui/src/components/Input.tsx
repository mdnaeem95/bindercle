import { type ReactNode, forwardRef, useState } from 'react';
import { type StyleProp, TextInput, type TextInputProps, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { fontFamilies, radius, spacing, typography } from '../tokens';
import { Text } from './Text';

type InputProps = Omit<TextInputProps, 'style'> & {
  /** Label displayed above the field. */
  label?: string;
  /** Help text below the field. */
  hint?: string;
  /** Error message — when present, the field renders in error state. */
  error?: string;
  /** Right-aligned char count: maxLength must be set for this to render. */
  showCharCount?: boolean;
  /** Optional adornment rendered to the left of the input. */
  leadingAdornment?: ReactNode;
  /** Optional adornment rendered to the right of the input. */
  trailingAdornment?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    hint,
    error,
    showCharCount,
    leadingAdornment,
    trailingAdornment,
    containerStyle,
    value,
    maxLength,
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.semantic.error
    : focused
      ? theme.colors.textPrimary
      : theme.colors.borderDefault;

  return (
    <View style={[{ gap: spacing[3] }, containerStyle]}>
      {label && (
        <Text variant="caption" tone="secondary">
          {label}
        </Text>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 48,
          paddingHorizontal: spacing[5],
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor,
          backgroundColor: theme.colors.bgElevated1,
          gap: spacing[3],
        }}
      >
        {leadingAdornment}
        <TextInput
          ref={ref}
          value={value}
          maxLength={maxLength}
          placeholderTextColor={theme.colors.textTertiary}
          selectionColor={theme.colors.textPrimary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={{
            flex: 1,
            color: theme.colors.textPrimary,
            fontFamily: fontFamilies.sans,
            fontSize: typography.body.fontSize,
            lineHeight: typography.body.lineHeight,
            paddingVertical: 0, // RN adds default vertical padding
          }}
          {...rest}
        />
        {trailingAdornment}
      </View>

      {(error || hint || (showCharCount && maxLength)) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {error ? (
            <Text variant="caption" style={{ color: theme.semantic.error }}>
              {error}
            </Text>
          ) : hint ? (
            <Text variant="caption" tone="tertiary">
              {hint}
            </Text>
          ) : (
            <View />
          )}
          {showCharCount && maxLength && (
            <Text variant="caption" tone="tertiary">
              {value?.length ?? 0}/{maxLength}
            </Text>
          )}
        </View>
      )}
    </View>
  );
});
