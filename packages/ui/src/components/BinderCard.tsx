import { Image, Pressable, type StyleProp, View, type ViewStyle } from 'react-native';
import { type AccentColor, accentGlow, accentSolid } from '../accentColors';
import { useTheme } from '../theme';
import { radius, spacing } from '../tokens';
import { Text } from './Text';

type BinderCardProps = {
  title: string;
  cardCount?: number;
  coverImageUrl?: string | null;
  isPublic?: boolean;
  /** Optional accent color — renders a soft glow border and tints the title. */
  accent?: AccentColor | null;
  onPress?: () => void;
  /** Aspect ratio (width/height). Default 3:4 — vertical, hero-friendly. */
  aspectRatio?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Foilio BinderCard.
 *
 * Used in the binder grid on the home screen and in profile views.
 * Cover image fills the card; title + card count overlay at the bottom.
 *
 * Empty cover renders the brand's neutral surface with the title centered.
 */
export function BinderCard({
  title,
  cardCount,
  coverImageUrl,
  isPublic = true,
  accent,
  onPress,
  aspectRatio = 3 / 4,
  style,
}: BinderCardProps) {
  const theme = useTheme();
  const accentTint = accentSolid(accent);
  const accentWash = accentGlow(accent);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          aspectRatio,
          borderRadius: radius.xl,
          overflow: 'hidden',
          backgroundColor: theme.colors.bgElevated1,
          opacity: pressed ? 0.85 : 1,
          borderWidth: accent ? 2 : 0,
          borderColor: accentTint ?? 'transparent',
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open binder ${title}`}
    >
      {coverImageUrl ? (
        <Image
          source={{ uri: coverImageUrl }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.bgElevated2,
          }}
        >
          <Text variant="display2" align="center" tone="tertiary">
            {title.slice(0, 1).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Accent wash — only renders when an accent is set */}
      {accentWash && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: accentWash,
          }}
        />
      )}

      {/* Gradient overlay for text legibility */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: spacing[5],
          backgroundColor: 'rgba(10,10,15,0.65)',
        }}
      >
        <Text variant="heading3" numberOfLines={2} style={{ color: accentTint ?? '#F8F8F2' }}>
          {title}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[3],
            marginTop: spacing[2],
          }}
        >
          {typeof cardCount === 'number' && (
            <Text variant="caption" style={{ color: '#B5B5B8' }}>
              {cardCount} {cardCount === 1 ? 'card' : 'cards'}
            </Text>
          )}
          {!isPublic && (
            <Text variant="caption" style={{ color: '#B5B5B8' }}>
              · Private
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
