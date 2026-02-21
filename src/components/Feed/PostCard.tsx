import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Dimensions,
  Alert,
} from 'react-native';
import { Heart, MessageCircle, Trash2, MoreVertical, Flag } from 'lucide-react-native';
import { COLORS } from '@/src/utils/constants';
import { MentionText } from '@/src/utils/mentions';
import { ReportModal } from './ReportModal';
import { reportPost } from '@/src/services/reportingService';
import type { Post } from '@/src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  isDark: boolean;
  currentUserId?: string;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onDelete?: () => void;
  onUserPress?: () => void;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatTime(ms: number): string {
  const seconds = ms / 1000;
  return seconds.toFixed(2) + 's';
}

function PostCardComponent({
  post,
  isDark,
  currentUserId,
  onPress,
  onLike,
  onComment,
  onDelete,
  onUserPress,
}: PostCardProps) {
  const colors = isDark ? COLORS.dark : COLORS.light;
  const isOwner = currentUserId === post.user_id;
  const displayName = post.profile?.display_name || 'Unknown User';
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const handleMoreOptions = () => {
    const options = isOwner
      ? [{ text: 'Delete', onPress: onDelete, style: 'destructive' as const }]
      : [{ text: 'Report', onPress: () => setReportModalVisible(true) }];

    Alert.alert('Post Options', undefined, [
      ...options,
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleReportSubmit = async (reason: string, description?: string) => {
    try {
      await reportPost(post.id, reason, description);
      Alert.alert(
        'Report Submitted',
        'Thank you for your report. Our moderation team will review it shortly.'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit report');
      throw error;
    }
  };

  return (
    <Pressable
      style={[styles.container, { backgroundColor: colors.surface }]}
      onPress={onPress}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.userInfo} onPress={onUserPress}>
          <View
            style={[styles.avatar, { backgroundColor: colors.surfaceElevated }]}
          >
            {post.profile?.avatar_url ? (
              <Image
                source={{ uri: post.profile.avatar_url, cache: 'force-cache' }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={[styles.avatarText, { color: colors.text }]}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.headerTextContainer}>
            <View style={styles.headerTopRow}>
              <Text style={[styles.displayName, { color: colors.text }]}>
                {displayName}
              </Text>
              <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                {formatTimeAgo(post.created_at)}
              </Text>
            </View>
            {post.location_name && (
              <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
                {post.location_name}
              </Text>
            )}
          </View>
        </Pressable>
        <Pressable onPress={handleMoreOptions} hitSlop={8}>
          <MoreVertical color={colors.textSecondary} size={20} />
        </Pressable>
      </View>

      <ReportModal
        visible={reportModalVisible}
        isDark={isDark}
        type="post"
        onClose={() => setReportModalVisible(false)}
        onSubmit={handleReportSubmit}
      />

      {/* Image */}
      <Image
        source={{ uri: post.image_url, cache: 'force-cache' }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Run info if attached */}
      {post.run && post.run.zero_to_sixty_time && (
        <View style={[styles.runInfo, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={[styles.runTime, { color: COLORS.accent }]}>
            0-60: {formatTime(post.run.zero_to_sixty_time)}
          </Text>
          {post.run.vehicle_name && (
            <Text style={[styles.runVehicle, { color: colors.textSecondary }]}>
              {post.run.vehicle_name}
            </Text>
          )}
        </View>
      )}

      {/* Caption */}
      {post.caption && (
        <MentionText style={styles.caption} isDark={isDark}>
          {post.caption}
        </MentionText>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={onLike}>
          <Heart
            color={post.is_liked ? '#FF4444' : colors.textSecondary}
            fill={post.is_liked ? '#FF4444' : 'transparent'}
            size={22}
          />
          <Text
            style={[
              styles.actionCount,
              { color: post.is_liked ? '#FF4444' : colors.textSecondary },
            ]}
          >
            {post.likes_count}
          </Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={onComment}>
          <MessageCircle color={colors.textSecondary} size={22} />
          <Text style={[styles.actionCount, { color: colors.textSecondary }]}>
            {post.comments_count}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 1,
  },
  locationText: {
    fontSize: 12,
    marginTop: 1,
  },
  image: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_WIDTH - 32,
    backgroundColor: '#1a1a1a',
  },
  runInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  runTime: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  runVehicle: {
    fontSize: 13,
  },
  caption: {
    paddingHorizontal: 12,
    paddingTop: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    padding: 12,
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export const PostCard = React.memo(PostCardComponent);
