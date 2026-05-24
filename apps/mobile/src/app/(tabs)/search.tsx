import {
  type SearchBinder,
  type SearchUser,
  useSearchBinders,
  useSearchUsers,
} from '@/hooks/useSearch';
import { type AccentColor, Avatar, BinderCard, Surface, Text, useTheme } from '@foilio/ui';
import { router } from 'expo-router';
import { ArrowLeft, Search as SearchIcon, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const trimmed = query.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < 2;

  const { data: binders, isLoading: bindersLoading } = useSearchBinders(query);
  const { data: users, isLoading: usersLoading } = useSearchUsers(query);

  const loading = (bindersLoading || usersLoading) && trimmed.length >= 2;
  const hasResults = (binders?.length ?? 0) > 0 || (users?.length ?? 0) > 0;

  return (
    <Surface level={0} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header — search input lives here, no separate title */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.borderSubtle,
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={20} color={theme.colors.textPrimary} strokeWidth={2} />
          </Pressable>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: theme.colors.bgElevated1,
              borderRadius: 9999,
              paddingHorizontal: 14,
              height: 40,
            }}
          >
            <SearchIcon size={16} color={theme.colors.textTertiary} strokeWidth={1.8} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Search binders, people…"
              placeholderTextColor={theme.colors.textTertiary}
              style={{ flex: 1, color: theme.colors.textPrimary, fontSize: 15 }}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={6}>
                <X size={16} color={theme.colors.textTertiary} strokeWidth={1.8} />
              </Pressable>
            )}
          </View>
        </View>

        {trimmed.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              gap: 12,
            }}
          >
            <SearchIcon size={48} color={theme.colors.textTertiary} strokeWidth={1.6} />
            <Text variant="body" tone="secondary" align="center">
              Try a binder title, a Pokemon name, or someone's handle.
            </Text>
          </View>
        ) : tooShort ? (
          <View style={{ padding: 24 }}>
            <Text variant="caption" tone="tertiary">
              Keep typing — at least 2 characters.
            </Text>
          </View>
        ) : loading ? (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <ActivityIndicator color={theme.colors.textTertiary} />
          </View>
        ) : !hasResults ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              gap: 12,
            }}
          >
            <Text variant="display2" align="center">
              No matches
            </Text>
            <Text variant="body" tone="secondary" align="center">
              Nothing public matches "{trimmed}" yet.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 40 + insets.bottom,
              gap: 24,
            }}
          >
            {users && users.length > 0 && (
              <View style={{ gap: 8 }}>
                <Text variant="caption" tone="secondary" style={{ paddingHorizontal: 4 }}>
                  PEOPLE
                </Text>
                {users.map((u) => (
                  <UserRow key={u.id} user={u} />
                ))}
              </View>
            )}
            {binders && binders.length > 0 && (
              <View style={{ gap: 8 }}>
                <Text variant="caption" tone="secondary" style={{ paddingHorizontal: 4 }}>
                  BINDERS
                </Text>
                {chunk(binders, 2).map((row, rowIdx) => (
                  <View
                    key={`row-${rowIdx}-${row[0]?.id ?? rowIdx}`}
                    style={{ flexDirection: 'row', gap: 12 }}
                  >
                    {row.map((b) => (
                      <View key={b.id} style={{ flex: 1 }}>
                        <BinderResult binder={b} />
                      </View>
                    ))}
                    {row.length === 1 && <View style={{ flex: 1 }} />}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Surface>
  );
}

function UserRow({ user }: { user: SearchUser }) {
  const theme = useTheme();
  const label = user.display_name?.trim() || `@${user.handle}`;
  return (
    <Pressable
      onPress={() => router.push(`/users/${user.id}`)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 12,
        backgroundColor: pressed ? theme.colors.bgElevated2 : theme.colors.bgElevated1,
        borderWidth: 1,
        borderColor: theme.colors.borderSubtle,
      })}
    >
      <Avatar source={user.avatar_url} name={label} size={40} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>
          {label}
        </Text>
        <Text variant="caption" tone="tertiary" numberOfLines={1}>
          @{user.handle}
          {user.bio ? ` · ${user.bio}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

function BinderResult({ binder }: { binder: SearchBinder }) {
  const ownerLabel = binder.owner.display_name?.trim() || `@${binder.owner.handle}`;
  return (
    <View style={{ gap: 8 }}>
      <BinderCard
        title={binder.title}
        cardCount={binder.card_count}
        coverImageUrl={binder.cover_image_url}
        accent={(binder.accent_color as AccentColor | null) ?? null}
        onPress={() => router.push(`/binders/${binder.id}`)}
      />
      <Pressable
        onPress={() => router.push(`/users/${binder.owner.id}`)}
        hitSlop={6}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Avatar source={binder.owner.avatar_url} name={ownerLabel} size={18} />
        <Text variant="caption" tone="secondary" numberOfLines={1} style={{ flex: 1 }}>
          {ownerLabel}
        </Text>
      </Pressable>
    </View>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
