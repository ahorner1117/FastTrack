import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Heart, MessageCircle, UserPlus, Check, X } from 'lucide-react-native';
import { COLORS } from '@/src/utils/constants';
import type { NotificationItem } from '@/src/types';

interface NotificationCardProps {
  notification: NotificationItem;
  isDark: boolean;
  isRead?: boolean;
  onPress: () => void;
  onAccept?: () => void;
  onReject?: () => void;
}

export function NotificationCard({
  notification,
  isDark,
  isRead = false,
  onPress,
  onAccept,
  onReject,
}: NotificationCardProps) {
  const colors = isDark ? COLORS.dark : COLORS.light;

  const initial = notification.actor_display_name.charAt(0).toUpperCase();

  const renderIcon = () => {
    switch (notification.type) {
      case 'friend_request':
        return <UserPlus color={COLORS.accent} size={14} />;
      case 'like':
        return <Heart color="#FF3B30" size={14} />;
      case 'comment':
        return <MessageCircle color="#007AFF" size={14} />;
    }
  };

  const renderMessage = () => {
    switch (notification.type) {
      case 'friend_request':
        return 'sent you a friend request';
      case 'like':
        return 'liked your post';
      case 'comment':
        return `commented: ${notification.comment_content}`;
    }
  };

  const timeAgo = getTimeAgo(notification.created_at);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.surface },
        !isRead && styles.unreadContainer,
        !isRead && { borderLeftColor: COLORS.accent },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {notification.actor_avatar_url ? (
          <Image
            source={{ uri: notification.actor_avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: COLORS.accent }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
        <View style={[styles.iconBadge, { backgroundColor: colors.surface }]}>
          {renderIcon()}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
          <Text style={styles.actorName}>{notification.actor_display_name}</Text>
          {' '}{renderMessage()}
        </Text>
        <View style={styles.timeRow}>
          {!isRead && <View style={styles.unreadDot} />}
          <Text style={[styles.time, { color: colors.textSecondary }]}>{timeAgo}</Text>
        </View>
      </View>

      {notification.type === 'friend_request' && onAccept && onReject ? (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.accent }]}
            onPress={onAccept}
          >
            <Check color="#000000" size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surfaceElevated }]}
            onPress={onReject}
          >
            <X color={colors.error} size={20} />
          </TouchableOpacity>
        </View>
      ) : notification.post_image_url ? (
        <Image
          source={{ uri: notification.post_image_url }}
          style={styles.postThumbnail}
        />
      ) : null}
    </TouchableOpacity>
  );
}

function getTimeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  unreadContainer: {
    opacity: 1,
  },
  avatarContainer: {
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    lineHeight: 19,
  },
  actorName: {
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  time: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginLeft: 8,
  },
});
