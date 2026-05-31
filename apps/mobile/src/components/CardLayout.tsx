import type { CardWithExtras } from '@/hooks/useCards';
import { BINDER_LAYOUT_COLUMNS, type BinderLayout } from '@/lib/validators/binder';
import { CardThumbnail, useTheme } from '@foilio/ui';
import { Plus } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

type CardLayoutProps = {
  layout: BinderLayout;
  cards: CardWithExtras[];
  onCardPress: (cardId: string) => void;
  /** When provided, empty pockets become tap targets that call this with the slot index. */
  onEmptySlotPress?: (position: number) => void;
};

/**
 * Renders the cards on a page as a real binder spread — 4 / 9 / 16 pockets
 * per spread. Pockets are visible (dashed border, fixed aspect) so empty
 * slots look like waiting-to-be-filled binder pockets, not missing UI.
 *
 * Cards are positioned by their explicit `position` field. Gaps are valid —
 * a card at position 0 with the next at position 4 shows slots 1, 2, 3 as
 * empty pockets in between. When more cards exist than fit in one spread,
 * they roll over onto additional spreads stacked vertically, same as
 * flipping the next page in a physical binder.
 *
 * `onEmptySlotPress` (when supplied) is fired with the slot's absolute
 * position whenever the owner taps an empty pocket — that's the primary
 * add-card affordance.
 */
export function CardLayout({ layout, cards, onCardPress, onEmptySlotPress }: CardLayoutProps) {
  const columns = BINDER_LAYOUT_COLUMNS[layout];
  const slotsPerSpread = columns * columns;
  return (
    <PocketSpreads
      cards={cards}
      columns={columns}
      slotsPerSpread={slotsPerSpread}
      onCardPress={onCardPress}
      onEmptySlotPress={onEmptySlotPress}
    />
  );
}

function PocketSpreads({
  cards,
  columns,
  slotsPerSpread,
  onCardPress,
  onEmptySlotPress,
}: {
  cards: CardWithExtras[];
  columns: number;
  slotsPerSpread: number;
  onCardPress: (id: string) => void;
  onEmptySlotPress?: (position: number) => void;
}) {
  const theme = useTheme();

  const cardByPosition = new Map<number, CardWithExtras>();
  let maxPosition = -1;
  for (const c of cards) {
    cardByPosition.set(c.position, c);
    if (c.position > maxPosition) maxPosition = c.position;
  }

  const spreadCount = maxPosition < 0 ? 1 : Math.floor(maxPosition / slotsPerSpread) + 1;
  const rowsPerSpread = Math.ceil(slotsPerSpread / columns);

  return (
    <View style={{ gap: 16 }}>
      {Array.from({ length: spreadCount }).map((_, spreadIdx) => (
        <View
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton, spreads never reorder
          key={`spread-${spreadIdx}`}
          style={{
            padding: 12,
            borderRadius: 16,
            backgroundColor: theme.colors.bgElevated1,
            borderWidth: 1,
            borderColor: theme.colors.borderSubtle,
            gap: 6,
          }}
        >
          {Array.from({ length: rowsPerSpread }).map((_, rowIdx) => (
            <View
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton, rows never reorder
              key={`row-${spreadIdx}-${rowIdx}`}
              style={{ flexDirection: 'row', gap: 6 }}
            >
              {Array.from({ length: columns }).map((_, colIdx) => {
                const slotIdx = rowIdx * columns + colIdx;
                const position = spreadIdx * slotsPerSpread + slotIdx;
                const card = cardByPosition.get(position);
                const slotStyle = {
                  flex: 1,
                  aspectRatio: 63 / 88,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderStyle: 'dashed' as const,
                  borderColor: theme.colors.borderSubtle,
                  backgroundColor: theme.colors.bgBase,
                  overflow: 'hidden' as const,
                };

                if (card) {
                  return (
                    <View key={card.id} style={slotStyle}>
                      <CardThumbnail
                        name={card.name}
                        photoUrl={card.photos[0]?.url ?? card.tcg_card?.image_small ?? null}
                        photoCount={card.photos.length}
                        caption={card.caption}
                        onPress={() => onCardPress(card.id)}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </View>
                  );
                }

                if (onEmptySlotPress) {
                  return (
                    <Pressable
                      key={`slot-${position}`}
                      onPress={() => onEmptySlotPress(position)}
                      style={({ pressed }) => [
                        slotStyle,
                        {
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: pressed
                            ? theme.colors.bgElevated2
                            : slotStyle.backgroundColor,
                        },
                      ]}
                    >
                      <Plus size={20} color={theme.colors.textTertiary} strokeWidth={1.8} />
                    </Pressable>
                  );
                }

                return <View key={`slot-${position}`} style={slotStyle} />;
              })}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
