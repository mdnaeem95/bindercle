import { Pressable, type StyleProp, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

type ChipGroupOption<T extends string> = {
  value: T;
  label: string;
};

type ChipGroupProps<T extends string> = {
  options: ChipGroupOption<T>[];
  value?: T;
  onChange: (next: T | undefined) => void;
  /** Allow deselecting by tapping the active chip. */
  clearable?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Single-select chip group.
 *
 * Useful for short option lists (≤ 8 values) where a dropdown would be overkill.
 * For longer lists, prefer a sheet or a native Picker.
 */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  clearable = true,
  style,
}: ChipGroupProps<T>) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 6,
        },
        style,
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              if (selected && clearable) onChange(undefined);
              else onChange(option.value);
            }}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: selected ? theme.colors.textPrimary : theme.colors.borderDefault,
              backgroundColor: selected
                ? theme.colors.textPrimary
                : pressed
                  ? theme.colors.bgElevated2
                  : 'transparent',
            })}
          >
            <Text
              variant="caption"
              style={{ color: selected ? theme.colors.bgBase : theme.colors.textPrimary }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
