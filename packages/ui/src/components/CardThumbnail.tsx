import { Image, Pressable, type StyleProp, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { radius } from '../tokens';
import { Text } from './Text';

type CardThumbnailProps = {
  /** Card name, used as a fallback if no photo is provided. */
  name: string;
  /** Front photo URL. */
  photoUrl?: string | null;
  /** Number of photos attached (>1 shows a badge). */
  photoCount?: number;
  onPress?: () => void;
  /** Standard Pokemon TCG aspect — 63:88 ≈ 0.716. */
  aspectRatio?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Foilio CardThumbnail.
 *
 * Used in the card grid inside a binder detail view. Renders the card photo
 * at the standard TCG aspect ratio. Shows a badge if multiple photos exist.
 */
export function CardThumbnail({
  name,
  photoUrl,
  photoCount = 0,
  onPress,
  aspectRatio = 63 / 88,
  style,
}: CardThumbnailProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          aspectRatio,
          borderRadius: radius.md,
          overflow: 'hidden',
          backgroundColor: theme.colors.bgElevated1,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open card ${name}`}
    >
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.bgElevated2,
            padding: 8,
          }}
        >
          <Text variant="caption" tone="secondary" align="center" numberOfLines={3}>
            {name}
          </Text>
        </View>
      )}

      {photoCount > 1 && (
        <View
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            backgroundColor: 'rgba(10,10,15,0.7)',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 999,
          }}
        >
          <Text variant="caption" style={{ color: '#F8F8F2' }}>
            {photoCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
