import type { CardWithExtras } from '@/hooks/useCards';
import { BINDER_LAYOUT_COLUMNS, type BinderLayout } from '@/lib/validators/binder';
import { CardThumbnail, useTheme } from '@foilio/ui';
import { View } from 'react-native';

type CardLayoutProps = {
  layout: BinderLayout;
  cards: CardWithExtras[];
  onCardPress: (cardId: string) => void;
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
 */
export function CardLayout({ layout, cards, onCardPress }: CardLayoutProps) {
  const columns = BINDER_LAYOUT_COLUMNS[layout];
  const slotsPerSpread = columns * columns;
  return (
    <PocketSpreads
      cards={cards}
      columns={columns}
      slotsPerSpread={slotsPerSpread}
      onCardPress={onCardPress}
    />
  );
}

function PocketSpreads({
  cards,
  columns,
  slotsPerSpread,
  onCardPress,
}: {
  cards: CardWithExtras[];
  columns: number;
  slotsPerSpread: number;
  onCardPress: (id: string) => void;
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
                return (
                  <View
                    key={card?.id ?? `slot-${position}`}
                    style={{
                      flex: 1,
                      aspectRatio: 63 / 88,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderStyle: 'dashed',
                      borderColor: theme.colors.borderSubtle,
                      backgroundColor: theme.colors.bgBase,
                      overflow: 'hidden',
                    }}
                  >
                    {card && (
                      <CardThumbnail
                        name={card.name}
                        photoUrl={card.photos[0]?.url ?? card.tcg_card?.image_small ?? null}
                        photoCount={card.photos.length}
                        caption={card.caption}
                        onPress={() => onCardPress(card.id)}
                        style={{ width: '100%', height: '100%' }}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
