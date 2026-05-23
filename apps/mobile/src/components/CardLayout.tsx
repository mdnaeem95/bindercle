import type { CardWithExtras } from '@/hooks/useCards';
import type { BinderLayout } from '@/lib/validators/binder';
import { CardThumbnail, useTheme } from '@foilio/ui';
import { View } from 'react-native';

type CardLayoutProps = {
  layout: BinderLayout;
  cards: CardWithExtras[];
  onCardPress: (cardId: string) => void;
};

/**
 * Dispatcher that renders the card grid for a binder, choosing the
 * layout component based on `binder.layout_type`.
 *
 * The four layouts are deliberately distinct in *feeling*, not just in
 * grid columns — collection layout is a primary curation tool, not chrome.
 */
export function CardLayout({ layout, cards, onCardPress }: CardLayoutProps) {
  switch (layout) {
    case 'nine_pocket':
      return <NinePocketLayout cards={cards} onCardPress={onCardPress} />;
    case 'scrapbook':
      return <ScrapbookLayout cards={cards} onCardPress={onCardPress} />;
    case 'spread':
      return <SpreadLayout cards={cards} onCardPress={onCardPress} />;
    default:
      return <GridLayout cards={cards} onCardPress={onCardPress} />;
  }
}

// ---------------------------------------------------------------------
// Grid — 3-column, equal sizes. The current default.
// ---------------------------------------------------------------------

function GridLayout({
  cards,
  onCardPress,
}: { cards: CardWithExtras[]; onCardPress: (id: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {cards.map((card) => (
        <View key={card.id} style={{ width: '31.5%' }}>
          <CardThumbnail
            name={card.name}
            photoUrl={card.photos[0]?.url ?? card.tcg_card?.image_small ?? null}
            photoCount={card.photos.length}
            caption={card.caption}
            onPress={() => onCardPress(card.id)}
          />
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------
// NinePocket — mimics real binder pages. 3×3 with a soft "pocket"
// frame around each card. Cards group into pages of 9.
// ---------------------------------------------------------------------

function NinePocketLayout({
  cards,
  onCardPress,
}: { cards: CardWithExtras[]; onCardPress: (id: string) => void }) {
  const theme = useTheme();
  const pages: CardWithExtras[][] = [];
  for (let i = 0; i < cards.length; i += 9) {
    pages.push(cards.slice(i, i + 9));
  }

  return (
    <View style={{ gap: 16 }}>
      {pages.map((page, idx) => (
        <View
          key={`page-${idx}-${page[0]?.id ?? idx}`}
          style={{
            padding: 12,
            borderRadius: 16,
            backgroundColor: theme.colors.bgElevated1,
            borderWidth: 1,
            borderColor: theme.colors.borderSubtle,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {Array.from({ length: 9 }).map((_, slotIdx) => {
              const card = page[slotIdx];
              return (
                <View
                  key={card?.id ?? `slot-${slotIdx}`}
                  style={{
                    width: '31.5%',
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

// ---------------------------------------------------------------------
// Scrapbook — irregular sizes + slight per-card rotation. Playful,
// hand-arranged feel.
// ---------------------------------------------------------------------

function ScrapbookLayout({
  cards,
  onCardPress,
}: { cards: CardWithExtras[]; onCardPress: (id: string) => void }) {
  // Hash each card id into a deterministic pseudo-random rotation and width
  const hashed = (id: string, salt: number) => {
    let h = salt;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return h;
  };

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
      {cards.map((card) => {
        const rot = (hashed(card.id, 1) % 9) - 4; // -4° to +4°
        const widthPct = 38 + (hashed(card.id, 2) % 18); // 38% to 56%
        return (
          <View
            key={card.id}
            style={{
              width: `${widthPct}%`,
              transform: [{ rotate: `${rot}deg` }],
            }}
          >
            <CardThumbnail
              name={card.name}
              photoUrl={card.photos[0]?.url ?? card.tcg_card?.image_small ?? null}
              photoCount={card.photos.length}
              caption={card.caption}
              onPress={() => onCardPress(card.id)}
            />
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------
// Spread — one large hero + the rest in small thumbnails below.
// Optimized for binders with a clear centerpiece card.
// ---------------------------------------------------------------------

function SpreadLayout({
  cards,
  onCardPress,
}: { cards: CardWithExtras[]; onCardPress: (id: string) => void }) {
  const [hero, ...rest] = cards;
  if (!hero) {
    return null;
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: '70%' }}>
          <CardThumbnail
            name={hero.name}
            photoUrl={hero.photos[0]?.url ?? hero.tcg_card?.image_small ?? null}
            photoCount={hero.photos.length}
            caption={hero.caption}
            onPress={() => onCardPress(hero.id)}
          />
        </View>
      </View>
      {rest.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {rest.map((card) => (
            <View key={card.id} style={{ width: '23%' }}>
              <CardThumbnail
                name={card.name}
                photoUrl={card.photos[0]?.url ?? card.tcg_card?.image_small ?? null}
                photoCount={card.photos.length}
                caption={card.caption}
                onPress={() => onCardPress(card.id)}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
