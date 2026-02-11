import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { COLORS } from '@/src/utils/constants';
import { MentionText } from '@/src/utils/mentions';
import type { PostComment } from '@/src/types';

interface CommentCardProps {
  comment: PostComment;
  isDark: boolean;
  currentUserId?: string;
  onDelete?: () => void;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

export function CommentCard({
  comment,
  isDark,
  currentUserId,
  onDelete,
}: CommentCardProps) {
  const colors = isDark ? COLORS.dark : COLORS.light;
  const isOwner = currentUserId === comment.user_id;
  const displayName = comment.profile?.display_name || 'Unknown User';

  return (
    <View style={styles.container}>
      <View
        style={[styles.avatar, { backgroundColor: colors.surfaceElevated }]}
      >
        <Text style={[styles.avatarText, { color: colors.text }]}>
          {displayName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.displayName, { color: colors.text }]}>
            {displayName}
          </Text>
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {formatTimeAgo(comment.created_at)}
          </Text>
        </View>
        <MentionText style={styles.text} isDark={isDark}>
          {comment.content}
        </MentionText>
      </View>
      {isOwner && onDelete && (
        <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteButton}>
          <Trash2 color={colors.textSecondary} size={16} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 10,
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  displayName: {
    fontSize: 13,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    padding: 4,
  },
});
