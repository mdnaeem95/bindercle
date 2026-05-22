import { Image, type StyleProp, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { fontFamilies } from '../tokens';
import { Text } from './Text';

type AvatarProps = {
  /** Image URL (optional). When absent, renders initials. */
  source?: string | null;
  /** Display name or handle to derive fallback initials from. */
  name?: string | null;
  /** Diameter in pixels. */
  size?: number;
  style?: StyleProp<ViewStyle>;
};

function initialsOf(name?: string | null): string {
  if (!name) return '?';
  const trimmed = name.trim();
  if (!trimmed) return '?';
  // Take up to 2 letters: first of each word, or first 2 of single word
  const words = trimmed.split(/\s+/);
  const first = words[0];
  const second = words[1];
  if (words.length >= 2 && first && second && first[0] && second[0]) {
    return (first[0] + second[0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

/**
 * Foilio Avatar. Image when available; initials fallback over a neutral surface.
 */
export function Avatar({ source, name, size = 40, style }: AvatarProps) {
  const theme = useTheme();
  const fontSize = Math.max(10, Math.round(size * 0.4));

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.bgElevated2,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {source ? (
        <Image source={{ uri: source }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Text
          variant="body"
          style={{
            fontFamily: fontFamilies.sansSemibold,
            fontSize,
            lineHeight: fontSize * 1.1,
            color: theme.colors.textSecondary,
            fontWeight: '600',
          }}
        >
          {initialsOf(name)}
        </Text>
      )}
    </View>
  );
}
