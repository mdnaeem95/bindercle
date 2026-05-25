import type { CardWithExtras } from '@/hooks/useCards';
import { BINDER_LAYOUT_COLUMNS, type BinderLayout } from '@/lib/validators/binder';
import { useTheme } from '@foilio/ui';
import { useEffect } from 'react';
import { Image, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const POCKET_GAP = 6;
const SPREAD_PADDING = 12;
const CARD_ASPECT = 63 / 88;

type PositionsMap = Record<string, number>;

type Props = {
  layout: BinderLayout;
  cards: CardWithExtras[];
  containerWidth: number;
  onPositionsChange: (positions: PositionsMap) => void;
};

/**
 * Reorganize-mode view of a binder page. Same visual structure as
 * `CardLayout` (real layout with dashed empty pockets) but every
 * pocket containing a card is draggable.
 *
 * Drag semantics — long-press → drag to any slot in the same spread:
 *   - empty slot → card moves there
 *   - occupied slot → swap the two cards
 *
 * Cross-spread drag is intentionally out of scope; the target slot
 * is clamped to the spread the drag started in.
 */
export function BinderPageGrid({ layout, cards, containerWidth, onPositionsChange }: Props) {
  const theme = useTheme();
  const columns = BINDER_LAYOUT_COLUMNS[layout];
  const slotsPerSpread = columns * columns;

  const cardByPosition = new Map<number, CardWithExtras>();
  let maxPosition = -1;
  for (const c of cards) {
    cardByPosition.set(c.position, c);
    if (c.position > maxPosition) maxPosition = c.position;
  }
  const spreadCount = maxPosition < 0 ? 1 : Math.floor(maxPosition / slotsPerSpread) + 1;

  const innerWidth = containerWidth - SPREAD_PADDING * 2;
  const cellWidth = (innerWidth - POCKET_GAP * (columns - 1)) / columns;
  const cellHeight = cellWidth / CARD_ASPECT;

  // Shared positions map drives every cell; mutating it during drag
  // moves both the dragged card and its swap partner.
  const positions = useSharedValue<PositionsMap>(
    Object.fromEntries(cards.map((c) => [c.id, c.position])),
  );

  useEffect(() => {
    positions.value = Object.fromEntries(cards.map((c) => [c.id, c.position]));
  }, [cards, positions]);

  const commit = (next: PositionsMap) => {
    onPositionsChange(next);
  };

  return (
    <View style={{ gap: 16 }}>
      {Array.from({ length: spreadCount }).map((_, spreadIdx) => {
        const spreadOriginPosition = spreadIdx * slotsPerSpread;
        const spreadCards = cards.filter(
          (c) =>
            c.position >= spreadOriginPosition &&
            c.position < spreadOriginPosition + slotsPerSpread,
        );
        return (
          <View
            // biome-ignore lint/suspicious/noArrayIndexKey: spreads never reorder
            key={`spread-${spreadIdx}`}
            style={{
              padding: SPREAD_PADDING,
              borderRadius: 16,
              backgroundColor: theme.colors.bgElevated1,
              borderWidth: 1,
              borderColor: theme.colors.borderSubtle,
            }}
          >
            <View
              style={{
                position: 'relative',
                width: innerWidth,
                height:
                  Math.ceil(slotsPerSpread / columns) * cellHeight + (columns - 1) * POCKET_GAP,
              }}
            >
              {Array.from({ length: slotsPerSpread }).map((_, slotIdx) => (
                <EmptyPocket
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton, slots never reorder
                  key={`empty-${spreadIdx}-${slotIdx}`}
                  slotIdx={slotIdx}
                  columns={columns}
                  cellWidth={cellWidth}
                  cellHeight={cellHeight}
                />
              ))}

              {spreadCards.map((c) => (
                <DraggableCard
                  key={c.id}
                  card={c}
                  positions={positions}
                  spreadOriginPosition={spreadOriginPosition}
                  slotsPerSpread={slotsPerSpread}
                  columns={columns}
                  cellWidth={cellWidth}
                  cellHeight={cellHeight}
                  commit={commit}
                />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function EmptyPocket({
  slotIdx,
  columns,
  cellWidth,
  cellHeight,
}: {
  slotIdx: number;
  columns: number;
  cellWidth: number;
  cellHeight: number;
}) {
  const theme = useTheme();
  const col = slotIdx % columns;
  const row = Math.floor(slotIdx / columns);
  return (
    <View
      style={{
        position: 'absolute',
        left: col * (cellWidth + POCKET_GAP),
        top: row * (cellHeight + POCKET_GAP),
        width: cellWidth,
        height: cellHeight,
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.colors.borderSubtle,
        backgroundColor: theme.colors.bgBase,
      }}
    />
  );
}

type DraggableCardProps = {
  card: CardWithExtras;
  positions: SharedValue<PositionsMap>;
  spreadOriginPosition: number;
  slotsPerSpread: number;
  columns: number;
  cellWidth: number;
  cellHeight: number;
  commit: (positions: PositionsMap) => void;
};

function DraggableCard({
  card,
  positions,
  spreadOriginPosition,
  slotsPerSpread,
  columns,
  cellWidth,
  cellHeight,
  commit,
}: DraggableCardProps) {
  const theme = useTheme();
  const id = card.id;

  const isDragging = useSharedValue(false);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const wiggle = useSharedValue(0);

  useEffect(() => {
    const offset = (card.position * 90) % 360;
    wiggle.value = -1.2;
    wiggle.value = withDelay(offset, withRepeat(withTiming(1.2, { duration: 170 }), -1, true));
    return () => {
      cancelAnimation(wiggle);
      wiggle.value = 0;
    };
  }, [card.position, wiggle]);

  const colStride = cellWidth + POCKET_GAP;
  const rowStride = cellHeight + POCKET_GAP;

  const animatedStyle = useAnimatedStyle(() => {
    const position = positions.value[id] ?? card.position;
    const slotIdx = position - spreadOriginPosition;
    const col = slotIdx % columns;
    const row = Math.floor(slotIdx / columns);
    const targetX = col * colStride;
    const targetY = row * rowStride;

    if (isDragging.value) {
      return {
        transform: [
          { translateX: targetX + dragX.value },
          { translateY: targetY + dragY.value },
          { rotate: `${wiggle.value}deg` },
          { scale: 1.08 },
        ],
        zIndex: 100,
        shadowOpacity: 0.4,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 14,
      };
    }

    return {
      transform: [
        { translateX: withSpring(targetX, { damping: 20, stiffness: 240 }) },
        { translateY: withSpring(targetY, { damping: 20, stiffness: 240 }) },
        { rotate: `${wiggle.value}deg` },
        { scale: withSpring(1) },
      ],
      zIndex: 1,
      shadowOpacity: 0,
      elevation: 0,
    };
  });

  const pan = Gesture.Pan()
    .activateAfterLongPress(250)
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((e) => {
      dragX.value = e.translationX;
      dragY.value = e.translationY;
    })
    .onEnd(() => {
      const startPosition = positions.value[id] ?? card.position;
      const startSlot = startPosition - spreadOriginPosition;
      const startCol = startSlot % columns;
      const startRow = Math.floor(startSlot / columns);

      const centerX = startCol * colStride + cellWidth / 2 + dragX.value;
      const centerY = startRow * rowStride + cellHeight / 2 + dragY.value;

      const targetCol = Math.max(0, Math.min(columns - 1, Math.floor(centerX / colStride)));
      const rowsPerSpread = Math.ceil(slotsPerSpread / columns);
      const targetRow = Math.max(0, Math.min(rowsPerSpread - 1, Math.floor(centerY / rowStride)));
      const targetSlot = targetRow * columns + targetCol;
      const targetPosition = spreadOriginPosition + targetSlot;

      isDragging.value = false;
      dragX.value = 0;
      dragY.value = 0;

      if (targetPosition === startPosition) return;

      // Find who's currently at the target slot (if anyone).
      let displaced: string | null = null;
      for (const key in positions.value) {
        if (key === id) continue;
        if (positions.value[key] === targetPosition) {
          displaced = key;
          break;
        }
      }

      const next: PositionsMap = { ...positions.value };
      next[id] = targetPosition;
      if (displaced) next[displaced] = startPosition;
      positions.value = next;

      runOnJS(commit)(next);
    });

  const photoUrl = card.photos[0]?.url ?? card.tcg_card?.image_small ?? null;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            width: cellWidth,
            height: cellHeight,
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: theme.colors.bgElevated2,
            shadowColor: '#000',
          },
          animatedStyle,
        ]}
      >
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: theme.colors.bgElevated2 }} />
        )}
      </Animated.View>
    </GestureDetector>
  );
}
