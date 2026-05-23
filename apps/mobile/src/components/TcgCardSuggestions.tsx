import { useTcgCardSearch } from '@/hooks/useTcgCardSearch';
import type { TcgApiCard, TcgGame } from '@/lib/pokemonTcg';
import { Button, ChipGroup, Text, useTheme } from '@foilio/ui';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';

type TcgCardSuggestionsProps = {
  query: string;
  onSelect: (card: TcgApiCard) => void;
  /** Override the max height of the scrollable suggestion list (in px). */
  maxHeight?: number;
};

const GAME_OPTIONS: { value: TcgGame; label: string }[] = [
  { value: 'pokemon', label: 'EN' },
  { value: 'pokemon-japan', label: 'JP' },
];

/**
 * Inline autocomplete dropdown.
 *
 * Renders an EN/JP chip toggle, a scrollable result list (debounced
 * infinite-query against TCG Price Lookup via our Edge Function), and a
 * Load-more button when more pages are available.
 *
 * Shows nothing until the query is at least 2 characters.
 */
export function TcgCardSuggestions({ query, onSelect, maxHeight = 360 }: TcgCardSuggestionsProps) {
  const theme = useTheme();
  const [game, setGame] = useState<TcgGame>('pokemon');

  const { cards, total, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useTcgCardSearch(query, game);

  if (query.trim().length < 2) return null;

  return (
    <View
      style={{
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
        backgroundColor: theme.colors.bgElevated1,
        overflow: 'hidden',
      }}
    >
      {/* EN / JP toggle */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.borderSubtle,
          gap: 8,
        }}
      >
        <ChipGroup
          clearable={false}
          value={game}
          onChange={(next) => next && setGame(next)}
          options={GAME_OPTIONS}
        />
        {total > 0 && (
          <Text variant="caption" tone="tertiary">
            {cards.length} of {total}
          </Text>
        )}
      </View>

      {isFetching && cards.length === 0 ? (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <ActivityIndicator color={theme.colors.textTertiary} />
        </View>
      ) : cards.length === 0 ? (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <Text variant="caption" tone="tertiary">
            no matches in {game === 'pokemon' ? 'English' : 'Japanese'} sets
          </Text>
        </View>
      ) : (
        <ScrollView style={{ maxHeight }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
          {cards.map((card, index) => (
            <Pressable
              key={card.id}
              onPress={() => onSelect(card)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 10,
                gap: 12,
                backgroundColor: pressed ? theme.colors.bgElevated2 : 'transparent',
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: theme.colors.borderSubtle,
              })}
            >
              {card.images?.small ? (
                <Image
                  source={{ uri: card.images.small }}
                  style={{
                    width: 44,
                    height: 60,
                    borderRadius: 4,
                    backgroundColor: theme.colors.bgElevated2,
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: 44,
                    height: 60,
                    borderRadius: 4,
                    backgroundColor: theme.colors.bgElevated2,
                  }}
                />
              )}
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="body" numberOfLines={1}>
                  {card.name}
                </Text>
                <Text variant="caption" tone="tertiary" numberOfLines={1}>
                  {card.set.name} · #{card.number}
                </Text>
                {card.variant && (
                  <Text variant="caption" tone="secondary" numberOfLines={1}>
                    {card.variant}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}

          {hasNextPage && (
            <View style={{ padding: 12 }}>
              <Button
                variant="ghost"
                size="sm"
                loading={isFetchingNextPage}
                disabled={isFetchingNextPage}
                onPress={() => fetchNextPage()}
              >
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
