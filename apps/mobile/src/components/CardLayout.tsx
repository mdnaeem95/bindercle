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
 * per spread depending on the layout. Pockets are visible (dashed border,
 * fixed aspect) so empty slots look like waiting-to-be-filled binder pockets,
 * not missing UI.
 *
 * Cards fill row-major (left → right, then wrap top → bottom). When there
 * are more cards than pockets-per-spread, they roll over onto additional
 * spreads stacked vertically — same pattern as flipping the next page in a
 * physical binder.
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
  // Width % per pocket, with a small gap between them. (`gap` ≈ 2% of row.)
  const pocketWidthPct = (100 - (columns - 1) * 2) / columns;
  const pocketWidth = `${pocketWidthPct}%` as const;

  // Chunk cards into spreads — each spread is one "binder page worth" of pockets.
  const spreads: CardWithExtras[][] = [];
  if (cards.length === 0) {
    spreads.push([]);
  } else {
    for (let i = 0; i < cards.length; i += slotsPerSpread) {
      spreads.push(cards.slice(i, i + slotsPerSpread));
    }
  }

  return (
    <View style={{ gap: 16 }}>
      {spreads.map((spread, spreadIdx) => (
        <View
          key={`spread-${spreadIdx}-${spread[0]?.id ?? spreadIdx}`}
          style={{
            padding: 12,
            borderRadius: 16,
            backgroundColor: theme.colors.bgElevated1,
            borderWidth: 1,
            borderColor: theme.colors.borderSubtle,
          }}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {Array.from({ length: slotsPerSpread }).map((_, slotIdx) => {
              const card = spread[slotIdx];
              return (
                <View
                  key={card?.id ?? `slot-${spreadIdx}-${slotIdx}`}
                  style={{
                    width: pocketWidth,
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
        </View>
      ))}
    </View>
  );
}
