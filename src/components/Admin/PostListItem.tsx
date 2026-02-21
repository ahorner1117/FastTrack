import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Image as ImageIcon, Eye, EyeOff, Trash2, Heart, MessageCircle } from 'lucide-react-native';
import type { Post } from '@/src/types';
import { COLORS } from '@/src/utils/constants';

interface PostListItemProps {
  post: Post;
  isDark: boolean;
  onHide: (postId: string) => void;
  onUnhide: (postId: string) => void;
  onDelete: (postId: string) => void;
}

export function PostListItem({
  post,
  isDark,
  onHide,
  onUnhide,
  onDelete,
}: PostListItemProps) {
  const textColor = isDark ? COLORS.dark.text : '#000000';
  const secondaryColor = isDark ? COLORS.dark.textSecondary : '#666666';
  const borderColor = isDark ? COLORS.dark.border : '#E0E0E0';
  const isHidden = (post as any).is_hidden === true;

  const handleHide = () => {
    Alert.prompt(
      'Hide Post',
      'Enter reason for hiding this post:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Hide',
          style: 'destructive',
          onPress: (reason: string | undefined) => {
            if (reason && reason.trim()) {
              onHide(post.id);
            } else {
              Alert.alert('Error', 'Please provide a reason');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleUnhide = () => {
    Alert.alert('Unhide Post', 'Restore this post to the feed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unhide',
        onPress: () => onUnhide(post.id),
      },
    ]);
  };

  const handleDelete = () => {
    Alert.prompt(
      'Delete Post',
      'Permanently delete this post? This action cannot be undone.\n\nEnter reason:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: (reason: string | undefined) => {
            if (reason && reason.trim()) {
              onDelete(post.id);
            } else {
              Alert.alert('Error', 'Please provide a reason');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  return (
    <View style={[styles.container, { borderBottomColor: borderColor }]}>
      <View style={styles.imageContainer}>
        {post.image_url ? (
          <Image source={{ uri: post.image_url }} style={styles.image} />
        ) : (
          <View
            style={[
              styles.imagePlaceholder,
              { backgroundColor: secondaryColor + '30' },
            ]}
          >
            <ImageIcon size={24} color={secondaryColor} />
          </View>
        )}
      </View>

      <View style={styles.content}>
        {isHidden && (
          <View style={[styles.hiddenBadge, { backgroundColor: COLORS.error }]}>
            <EyeOff size={12} color="#FFFFFF" />
            <Text style={styles.hiddenText}>Hidden</Text>
          </View>
        )}

        {post.caption && (
          <Text
            style={[styles.caption, { color: textColor }]}
            numberOfLines={2}
          >
            {post.caption}
          </Text>
        )}

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Heart size={14} color={secondaryColor} />
            <Text style={[styles.statText, { color: secondaryColor }]}>
              {post.likes_count || 0}
            </Text>
          </View>
          <View style={styles.statItem}>
            <MessageCircle size={14} color={secondaryColor} />
            <Text style={[styles.statText, { color: secondaryColor }]}>
              {post.comments_count || 0}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        {isHidden ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.accent + '20' }]}
            onPress={handleUnhide}
          >
            <Eye size={18} color={COLORS.accent} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: COLORS.warning + '20' },
            ]}
            onPress={handleHide}
          >
            <EyeOff size={18} color={COLORS.warning} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: COLORS.error + '20', marginTop: 8 },
          ]}
          onPress={handleDelete}
        >
          <Trash2 size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  imageContainer: {
    marginRight: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  hiddenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
    gap: 4,
  },
  hiddenText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
  },
  actions: {
    marginLeft: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
