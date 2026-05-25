import { Image, Pressable, type StyleProp, View, type ViewStyle } from 'react-native';
import { type AccentColor, accentSolid } from '../accentColors';
import { radius, spacing } from '../tokens';
import { Text } from './Text';

type BinderCardProps = {
  title: string;
  cardCount?: number;
  coverImageUrl?: string | null;
  isPublic?: boolean;
  /** Accent color — when set, becomes the binder's body color. */
  accent?: AccentColor | null;
  onPress?: () => void;
  /** Aspect ratio (width/height). Default 3:4 — closed-binder proportions. */
  aspectRatio?: number;
  style?: StyleProp<ViewStyle>;
};

const DEFAULT_BODY = '#2A2632';
const SPINE_TINT = 'rgba(0,0,0,0.32)';
const RING_TINT = 'rgba(255,255,255,0.35)';
const LABEL_TINT = 'rgba(0,0,0,0.34)';
const POCKET_TINT = 'rgba(0,0,0,0.22)';
const HIGHLIGHT_TINT = 'rgba(255,255,255,0.08)';

/**
 * A binder card styled to look like an actual closed binder.
 *
 * Layout (left → right):
 *   - Spine: ~8% of width, darker overlay. Slight inner shadow on its right
 *     edge sells the hinge.
 *   - Cover: the remaining width, body color from `accent` (or default deep
 *     plum). Three small "ring" dots near the top. A recessed "pocket window"
 *     centered on the cover holds the cover photo at TCG card aspect (63:88),
 *     the way Pokemon premier binders display a featured card. Below the
 *     pocket, a label plate carries the title + card count.
 *
 * Subtle outer shadow on the right edge implies page-thickness.
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
  const body = accentSolid(accent) ?? DEFAULT_BODY;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          aspectRatio,
          borderRadius: radius.lg,
          overflow: 'hidden',
          backgroundColor: body,
          opacity: pressed ? 0.92 : 1,
          // Soft depth — implies the binder has thickness
          shadowColor: '#000',
          shadowOpacity: 0.35,
          shadowRadius: 8,
          shadowOffset: { width: 2, height: 4 },
          elevation: 6,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open binder ${title}`}
    >
      {/* Spine — darker vertical strip on the left */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '8%',
          backgroundColor: SPINE_TINT,
        }}
      />
      {/* Hinge highlight — a thin vertical line at the spine/cover boundary */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: '8%',
          top: 0,
          bottom: 0,
          width: 1,
          backgroundColor: HIGHLIGHT_TINT,
        }}
      />

      {/* Cover content — everything to the right of the spine */}
      <View style={{ flex: 1, paddingLeft: '8%' }}>
        {/* Ring binder rings */}
        <View
          style={{
            flexDirection: 'row',
            gap: 14,
            paddingTop: spacing[3],
            paddingLeft: spacing[3],
          }}
        >
          {[0, 1, 2].map((i) => (
            <View
              key={`ring-${i}`}
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                backgroundColor: RING_TINT,
              }}
            />
          ))}
        </View>

        {/* Cover pocket — featured card displayed like a clear pocket on the front */}
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
          }}
        >
          <View
            style={{
              aspectRatio: 63 / 88,
              maxHeight: '100%',
              borderRadius: 4,
              overflow: 'hidden',
              backgroundColor: POCKET_TINT,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.06)',
              // Subtle inset shadow effect
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 1 },
            }}
          >
            {coverImageUrl ? (
              <Image
                source={{ uri: coverImageUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text variant="display2" align="center" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {title.slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Label plate — title + count, like a binder spine label on the cover */}
        <View
          style={{
            marginHorizontal: spacing[3],
            marginBottom: spacing[3],
            paddingVertical: spacing[2],
            paddingHorizontal: spacing[3],
            borderRadius: 4,
            backgroundColor: LABEL_TINT,
          }}
        >
          <Text
            variant="bodySmall"
            numberOfLines={1}
            style={{
              color: '#F8F8F2',
              fontWeight: '600',
            }}
          >
            {title}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[2],
              marginTop: 2,
            }}
          >
            {typeof cardCount === 'number' && (
              <Text variant="caption" style={{ color: 'rgba(248,248,242,0.7)' }}>
                {cardCount} {cardCount === 1 ? 'card' : 'cards'}
              </Text>
            )}
            {!isPublic && (
              <Text variant="caption" style={{ color: 'rgba(248,248,242,0.7)' }}>
                · Private
              </Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
