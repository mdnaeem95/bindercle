import { Pressable, type StyleProp, View, type ViewStyle } from 'react-native';
import { ACCENT_COLORS, ACCENT_PALETTE, type AccentColor } from '../accentColors';
import { useTheme } from '../theme';
import { Text } from './Text';

type AccentPickerProps = {
  value: AccentColor | null;
  onChange: (next: AccentColor | null) => void;
  /** Section label rendered above the swatches. */
  label?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * AccentPicker — a horizontal grid of solid color circles, one per
 * curated palette entry. Tap to select; tap again to clear.
 */
export function AccentPicker({ value, onChange, label, style }: AccentPickerProps) {
  const theme = useTheme();

  return (
    <View style={[{ gap: 12 }, style]}>
      {label && (
        <Text variant="caption" tone="secondary">
          {label}
        </Text>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {ACCENT_COLORS.map((color) => {
          const selected = value === color;
          const palette = ACCENT_PALETTE[color];
          return (
            <Pressable
              key={color}
              onPress={() => onChange(selected ? null : color)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={palette.label}
              accessibilityState={{ selected }}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: palette.solid,
                borderWidth: selected ? 3 : 0,
                borderColor: theme.colors.textPrimary,
                opacity: pressed ? 0.7 : 1,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            />
          );
        })}
      </View>
    </View>
  );
}
