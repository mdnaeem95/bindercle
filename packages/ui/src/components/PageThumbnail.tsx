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
  /** Card image URLs to render in the mini-grid preview. Excess entries past
   *  the layout's slot count are ignored; nulls render as empty pockets. */
  previewUrls?: (string | null | undefined)[];
  /** Pocket columns — mirrors the page's layout. 2 = 4-pocket, 3 = 9-pocket,
   *  4 = 16-pocket. Mini-grid is square (columns × columns). Defaults to 3. */
  columns?: number;
  /** Optional accent for the page label (inherited from binder by default). */
  accentColor?: string | null;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Page thumbnail rendered in the binder detail's pages grid.
 *
 * Mirrors the page's actual pocket layout in miniature — 2×2 / 3×3 / 4×4.
 * Filled pockets show the card image, empty pockets show as dashed placeholders.
 * Page name + card count below.
 */
export function PageThumbnail({
  name,
  pageNumber,
  cardCount,
  previewUrls = [],
  columns = 3,
  accentColor,
  onPress,
  style,
}: PageThumbnailProps) {
  const theme = useTheme();
  const displayName = name.trim().length > 0 ? name : `Page ${pageNumber}`;
  const slotCount = columns * columns;
  const slots = previewUrls.slice(0, slotCount);

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
      {/* N×N mini binder page — filled = card image, empty = dashed pocket. */}
      <View style={{ gap: 4 }}>
        {Array.from({ length: columns }).map((_, rowIdx) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
          <View key={`row-${rowIdx}`} style={{ flexDirection: 'row', gap: 4 }}>
            {Array.from({ length: columns }).map((_, colIdx) => {
              const slotIdx = rowIdx * columns + colIdx;
              const url = slots[slotIdx];
              return (
                <View
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton
                  key={`slot-${slotIdx}`}
                  style={{
                    flex: 1,
                    aspectRatio: 63 / 88,
                    borderRadius: 4,
                    overflow: 'hidden',
                    backgroundColor: url ? theme.colors.bgElevated2 : 'transparent',
                    borderWidth: url ? 0 : 1,
                    borderStyle: 'dashed',
                    borderColor: theme.colors.borderSubtle,
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
        ))}
      </View>

      {/* Footer — single line, fixed height. Long names truncate so the
          enclosing grid keeps all thumbnails the same height. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text
          variant="bodySmall"
          numberOfLines={1}
          style={[{ flex: 1 }, accentColor ? { color: accentColor } : null]}
        >
          {displayName}
        </Text>
        <Text variant="caption" tone="tertiary" numberOfLines={1}>
          {cardCount} {cardCount === 1 ? 'card' : 'cards'}
        </Text>
      </View>
    </Pressable>
  );
}
