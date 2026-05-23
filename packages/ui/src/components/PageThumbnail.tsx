import { Image, Pressable, type StyleProp, View, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { radius } from '../tokens';
import { Text } from './Text';

type PageThumbnailProps = {
  /** Page name (e.g. "Page 1" or "Hat Pokemon"). */
  name: string;
  /** Index in binder, used as a fallback when name is empty. */
  pageNumber: number;
  cardCount: number;
  /** Up to 6 small card image URLs to render in a mini-grid preview. */
  previewUrls?: (string | null | undefined)[];
  /** Optional accent for the page label (inherited from binder by default). */
  accentColor?: string | null;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Page thumbnail rendered in the binder detail's pages grid.
 *
 * Shows a 3×2 mini preview of cards from the page, the page name (or
 * "Page N" fallback), and a card count. Optimized for a 2-column grid.
 */
export function PageThumbnail({
  name,
  pageNumber,
  cardCount,
  previewUrls = [],
  accentColor,
  onPress,
  style,
}: PageThumbnailProps) {
  const theme = useTheme();
  const displayName = name.trim().length > 0 ? name : `Page ${pageNumber}`;
  const slots = previewUrls.slice(0, 6);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          padding: 12,
          borderRadius: radius.lg,
          backgroundColor: theme.colors.bgElevated1,
          borderWidth: 1,
          borderColor: accentColor ?? theme.colors.borderSubtle,
          opacity: pressed ? 0.85 : 1,
          gap: 8,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${displayName}`}
    >
      {/* 3×2 mini grid — fixed length 6, stable indices */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        {Array.from({ length: 6 }).map((_, slotIdx) => {
          const url = slots[slotIdx];
          return (
            <View
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton, slots never reorder
              key={`slot-${slotIdx}`}
              style={{
                width: '31.5%',
                aspectRatio: 63 / 88,
                borderRadius: 4,
                overflow: 'hidden',
                backgroundColor: theme.colors.bgElevated2,
              }}
            >
              {url ? (
                <Image
                  source={{ uri: url }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : null}
            </View>
          );
        })}
      </View>

      {/* Footer */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="bodySmall" style={accentColor ? { color: accentColor } : undefined}>
          {displayName}
        </Text>
        <Text variant="caption" tone="tertiary">
          {cardCount} {cardCount === 1 ? 'card' : 'cards'}
        </Text>
      </View>
    </Pressable>
  );
}
