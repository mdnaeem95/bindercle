import { useTagSearch } from '@/hooks/useTagSearch';
import { Input, Text, useTheme } from '@foilio/ui';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

type TagPickerProps = {
  value: string[];
  onChange: (next: string[]) => void;
  /** Hard cap on tag count. Defaults to 10. */
  max?: number;
  /** Label rendered above the picker. */
  label?: string;
};

/**
 * Tag picker — inline chips + autocomplete dropdown + create-on-the-fly.
 *
 * - Type in the input → suggestions appear below
 * - Tap a suggestion → adds it as a chip
 * - Press Enter on text not in the list → creates and adds a new tag
 * - Tap a chip → removes it
 */
export function TagPicker({ value, onChange, max = 10, label }: TagPickerProps) {
  const theme = useTheme();
  const [draft, setDraft] = useState('');

  const { data: suggestions = [] } = useTagSearch(draft);

  const atCap = value.length >= max;

  const addTag = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed || atCap) return;
    if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...value, trimmed]);
    setDraft('');
  };

  const removeTag = (label: string) => {
    onChange(value.filter((v) => v !== label));
  };

  const filteredSuggestions = suggestions.filter(
    (s) => !value.some((v) => v.toLowerCase() === s.name.toLowerCase()),
  );

  const showCreateOption =
    draft.trim().length > 0 &&
    !filteredSuggestions.some((s) => s.name.toLowerCase() === draft.trim().toLowerCase()) &&
    !value.some((v) => v.toLowerCase() === draft.trim().toLowerCase());

  return (
    <View style={{ gap: 8 }}>
      {label && (
        <Text variant="caption" tone="secondary">
          {label}
        </Text>
      )}

      {/* Chips */}
      {value.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {value.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => removeTag(tag)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.bgElevated2,
                borderColor: theme.colors.borderDefault,
                borderWidth: 1,
                borderRadius: 9999,
                paddingHorizontal: 12,
                paddingVertical: 6,
                gap: 6,
              }}
            >
              <Text variant="caption">{tag}</Text>
              <Text variant="caption" tone="tertiary">
                ×
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Input */}
      <Input
        placeholder={atCap ? `Max ${max} tags` : 'Add a tag…'}
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={() => addTag(draft)}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!atCap}
        returnKeyType="done"
        hint={atCap ? undefined : 'Press return to add'}
      />

      {/* Suggestions */}
      {(filteredSuggestions.length > 0 || showCreateOption) && !atCap && (
        <View
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.borderSubtle,
            backgroundColor: theme.colors.bgElevated1,
            overflow: 'hidden',
          }}
        >
          {filteredSuggestions.map((suggestion) => (
            <Pressable
              key={suggestion.id}
              onPress={() => addTag(suggestion.name)}
              style={({ pressed }) => ({
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: pressed ? theme.colors.bgElevated2 : 'transparent',
              })}
            >
              <Text variant="body">{suggestion.name}</Text>
            </Pressable>
          ))}
          {showCreateOption && (
            <Pressable
              onPress={() => addTag(draft)}
              style={({ pressed }) => ({
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: pressed ? theme.colors.bgElevated2 : 'transparent',
                borderTopWidth: filteredSuggestions.length > 0 ? 1 : 0,
                borderTopColor: theme.colors.borderSubtle,
              })}
            >
              <Text variant="body">Create "{draft.trim()}"</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
