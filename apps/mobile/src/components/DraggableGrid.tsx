import { useTheme } from '@foilio/ui';
import { type ReactNode, useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
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

const DEFAULT_COLUMNS = 3;
const DEFAULT_GAP = 8;
const DEFAULT_ASPECT = 63 / 88;

type Props<T> = {
  items: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  containerWidth: number;
  onOrderChange: (ids: string[]) => void;
  columns?: number;
  /** If `cellHeight` isn't provided, height is derived as `cellWidth / aspectRatio`. */
  aspectRatio?: number;
  /** Explicit cell height in px, used when content isn't a strict aspect-ratio image. */
  cellHeight?: number;
  gap?: number;
};

/**
 * iOS Springboard–style draggable grid. Long-press an item to pick it up;
 * others shuffle around to make space. Everything wiggles subtly while in
 * this mode so it's clear the layout is editable.
 *
 * Layout is computed from `containerWidth`, `columns`, and either
 * `aspectRatio` or an explicit `cellHeight` for non-aspect items.
 */
export function DraggableGrid<T>({
  items,
  keyExtractor,
  renderItem,
  containerWidth,
  onOrderChange,
  columns = DEFAULT_COLUMNS,
  aspectRatio = DEFAULT_ASPECT,
  cellHeight: explicitCellHeight,
  gap = DEFAULT_GAP,
}: Props<T>) {
  const cellWidth = (containerWidth - gap * (columns - 1)) / columns;
  const cellHeight = explicitCellHeight ?? cellWidth / aspectRatio;
  const rowStride = cellHeight + gap;
  const colStride = cellWidth + gap;
  const rowCount = Math.max(1, Math.ceil(items.length / columns));
  const containerHeight = rowCount * rowStride - gap;

  const positions = useSharedValue<Record<string, number>>(
    Object.fromEntries(items.map((item, i) => [keyExtractor(item), i])),
  );

  useEffect(() => {
    positions.value = Object.fromEntries(items.map((item, i) => [keyExtractor(item), i]));
  }, [items, keyExtractor, positions]);

  const commitOrder = (next: Record<string, number>) => {
    const ordered = Object.entries(next)
      .sort((a, b) => a[1] - b[1])
      .map(([id]) => id);
    onOrderChange(ordered);
  };

  return (
    <View
      style={{
        width: containerWidth,
        height: containerHeight,
        position: 'relative',
      }}
    >
      {items.map((item, idx) => {
        const id = keyExtractor(item);
        return (
          <DraggableCell
            key={id}
            id={id}
            index={idx}
            positions={positions}
            cellWidth={cellWidth}
            cellHeight={cellHeight}
            rowStride={rowStride}
            colStride={colStride}
            columns={columns}
            itemCount={items.length}
            commitOrder={commitOrder}
          >
            {renderItem(item)}
          </DraggableCell>
        );
      })}
    </View>
  );
}

type CellProps = {
  id: string;
  index: number;
  positions: SharedValue<Record<string, number>>;
  cellWidth: number;
  cellHeight: number;
  rowStride: number;
  colStride: number;
  columns: number;
  itemCount: number;
  commitOrder: (positions: Record<string, number>) => void;
  children: ReactNode;
};

function DraggableCell({
  id,
  index,
  positions,
  cellWidth,
  cellHeight,
  rowStride,
  colStride,
  columns,
  itemCount,
  commitOrder,
  children,
}: CellProps) {
  const theme = useTheme();

  const isDragging = useSharedValue(false);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const wiggle = useSharedValue(0);

  useEffect(() => {
    // Stagger start so the wiggle isn't synchronised across items.
    const offset = (index * 90) % 360;
    wiggle.value = -1.2;
    wiggle.value = withDelay(offset, withRepeat(withTiming(1.2, { duration: 170 }), -1, true));
    return () => {
      cancelAnimation(wiggle);
      wiggle.value = 0;
    };
  }, [index, wiggle]);

  const animatedStyle = useAnimatedStyle(() => {
    const slot = positions.value[id] ?? 0;
    const col = slot % columns;
    const row = Math.floor(slot / columns);
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

      const startSlot = positions.value[id] ?? 0;
      const startCol = startSlot % columns;
      const startRow = Math.floor(startSlot / columns);
      const centerX = startCol * colStride + cellWidth / 2 + e.translationX;
      const centerY = startRow * rowStride + cellHeight / 2 + e.translationY;

      const newCol = Math.max(0, Math.min(columns - 1, Math.floor(centerX / colStride)));
      const newRow = Math.max(0, Math.floor(centerY / rowStride));
      const newSlot = Math.min(itemCount - 1, Math.max(0, newRow * columns + newCol));

      if (newSlot !== startSlot) {
        const next: Record<string, number> = { ...positions.value };
        for (const otherId in next) {
          if (otherId === id) continue;
          const slot = next[otherId] ?? 0;
          if (startSlot < newSlot && slot > startSlot && slot <= newSlot) {
            next[otherId] = slot - 1;
          } else if (startSlot > newSlot && slot >= newSlot && slot < startSlot) {
            next[otherId] = slot + 1;
          }
        }
        next[id] = newSlot;
        positions.value = next;
      }
    })
    .onEnd(() => {
      isDragging.value = false;
      dragX.value = withSpring(0, { damping: 20, stiffness: 240 });
      dragY.value = withSpring(0, { damping: 20, stiffness: 240 });
      runOnJS(commitOrder)(positions.value);
    });

  const baseStyle: ViewStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: cellWidth,
    height: cellHeight,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: theme.colors.bgElevated1,
    shadowColor: '#000',
  };

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[baseStyle, animatedStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
}
