import { useTcgCardSearch } from '@/hooks/useTcgCardSearch';
import type { TcgApiCard } from '@/lib/pokemonTcg';
import { Text, useTheme } from '@foilio/ui';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';

type TcgCardSuggestionsProps = {
  query: string;
  onSelect: (card: TcgApiCard) => void;
};

/**
 * Inline autocomplete dropdown for the Pokemon TCG card name field.
 * Renders nothing if the query is too short or no results.
 */
export function TcgCardSuggestions({ query, onSelect }: TcgCardSuggestionsProps) {
  const theme = useTheme();
  const { data: suggestions = [], isFetching } = useTcgCardSearch(query);

  if (query.trim().length < 2) return null;
  if (!isFetching && suggestions.length === 0) return null;

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
      {isFetching && suggestions.length === 0 && (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <ActivityIndicator color={theme.colors.textTertiary} />
        </View>
      )}

      {suggestions.map((card, index) => (
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
              {card.set.name} · {card.number}
            </Text>
            {card.rarity && (
              <Text variant="caption" tone="tertiary" numberOfLines={1}>
                {card.rarity}
              </Text>
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );
}
