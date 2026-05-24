import { ReportSheet } from '@/components/ReportSheet';
import { useBlockedUserIdSet } from '@/hooks/useBlockUser';
import {
  type CommentWithAuthor,
  useAddComment,
  useComments,
  useDeleteComment,
} from '@/hooks/useComments';
import { useAuthStore } from '@/stores/auth';
import { Avatar, Surface, Text, useTheme } from '@foilio/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Flag, MessageCircle, Send, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BinderCommentsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const viewerId = useAuthStore((s) => s.user?.id);
  const { data: rawComments, isLoading } = useComments(id);
  const blockedIds = useBlockedUserIdSet();
  const comments = rawComments?.filter((c) => !blockedIds.has(c.user_id));
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const [draft, setDraft] = useState('');

  const onSend = async () => {
    const trimmed = draft.trim();
    if (!id || !trimmed) return;
    if (trimmed.length > 500) {
      Alert.alert('Too long', 'Comments are limited to 500 characters.');
      return;
    }
    try {
      await addComment.mutateAsync({ binder_id: id, body: trimmed });
      setDraft('');
    } catch (e) {
      const err = e as { message?: string };
      Alert.alert("Couldn't post", err.message ?? 'Try again.');
    }
  };

  const onDelete = (comment: CommentWithAuthor) => {
    Alert.alert('Delete comment?', 'This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment.mutateAsync({ id: comment.id, binder_id: comment.binder_id });
          } catch (e) {
            const err = e as { message?: string };
            Alert.alert("Couldn't delete", err.message ?? 'Try again.');
          }
        },
      },
    ]);
  };

  return (
    <Surface level={0} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.borderSubtle,
            }}
          >
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <ArrowLeft size={20} color={theme.colors.textPrimary} strokeWidth={2} />
            </Pressable>
            <Text variant="heading3">Comments</Text>
            <View style={{ width: 20 }} />
          </View>

          {isLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={theme.colors.textTertiary} />
            </View>
          ) : !comments || comments.length === 0 ? (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 40,
                gap: 12,
              }}
            >
              <MessageCircle size={48} color={theme.colors.textTertiary} strokeWidth={1.6} />
              <Text variant="display2" align="center">
                No comments yet
              </Text>
              <Text variant="body" tone="secondary" align="center">
                Be the first to say something nice.
              </Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingVertical: 8 }}
              renderItem={({ item }) => (
                <CommentRow
                  comment={item}
                  isOwn={item.user_id === viewerId}
                  onDelete={() => onDelete(item)}
                />
              )}
            />
          )}

          {/* Composer */}
          {viewerId && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                gap: 8,
                paddingHorizontal: 16,
                paddingTop: 8,
                paddingBottom: insets.bottom + 8,
                borderTopWidth: 1,
                borderTopColor: theme.colors.borderSubtle,
                backgroundColor: theme.colors.bgBase,
              }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  backgroundColor: theme.colors.bgElevated1,
                  borderWidth: 1,
                  borderColor: theme.colors.borderSubtle,
                }}
              >
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Add a comment…"
                  placeholderTextColor={theme.colors.textTertiary}
                  multiline
                  maxLength={500}
                  style={{
                    color: theme.colors.textPrimary,
                    fontSize: 15,
                    maxHeight: 100,
                  }}
                />
              </View>
              <Pressable
                onPress={onSend}
                disabled={!draft.trim() || addComment.isPending}
                style={({ pressed }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: draft.trim()
                    ? theme.colors.textPrimary
                    : theme.colors.bgElevated2,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Send
                  size={16}
                  color={draft.trim() ? theme.colors.bgBase : theme.colors.textTertiary}
                  strokeWidth={2}
                />
              </Pressable>
            </View>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Surface>
  );
}

function CommentRow({
  comment,
  isOwn,
  onDelete,
}: {
  comment: CommentWithAuthor;
  isOwn: boolean;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const [reportOpen, setReportOpen] = useState(false);
  const handleLabel = comment.author.display_name?.trim() || `@${comment.author.handle}`;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 10,
      }}
    >
      <Pressable onPress={() => router.push(`/users/${comment.author.id}`)} hitSlop={4}>
        <Avatar source={comment.author.avatar_url} name={handleLabel} size={32} />
      </Pressable>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text variant="bodySmall" style={{ fontWeight: '600' }}>
            {handleLabel}
          </Text>
          <Text variant="caption" tone="tertiary">
            {timeAgo(comment.created_at)}
          </Text>
        </View>
        <Text variant="body">{comment.body}</Text>
      </View>
      {isOwn ? (
        <Pressable onPress={onDelete} hitSlop={6} style={{ padding: 4 }}>
          <Trash2 size={14} color={theme.colors.textTertiary} strokeWidth={1.8} />
        </Pressable>
      ) : (
        <Pressable onPress={() => setReportOpen(true)} hitSlop={6} style={{ padding: 4 }}>
          <Flag size={14} color={theme.colors.textTertiary} strokeWidth={1.8} />
        </Pressable>
      )}
      <ReportSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="comment"
        targetId={comment.id}
        targetLabel={`Comment by ${handleLabel}`}
      />
    </View>
  );
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w`;
  const mo = Math.floor(d / 30);
  return `${mo}mo`;
}
