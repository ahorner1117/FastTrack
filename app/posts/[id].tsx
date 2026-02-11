import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Heart, Trash2 } from 'lucide-react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { COLORS } from '@/src/utils/constants';
import { useAuthStore } from '@/src/stores/authStore';
import { useFeedStore } from '@/src/stores/feedStore';
import { CommentCard, CommentInput } from '@/src/components/Feed';
import type { PostComment } from '@/src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

export default function PostDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { user } = useAuthStore();
  const {
    currentPost,
    comments,
    isLoading,
    isLoadingComments,
    fetchPost,
    fetchComments,
    toggleLike,
    removePost,
    postComment,
    removeComment,
  } = useFeedStore();

  useEffect(() => {
    if (id) {
      fetchPost(id);
      fetchComments(id);
    }
  }, [id, fetchPost, fetchComments]);

  const handleLike = useCallback(async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to like posts.');
      return;
    }
    if (!id) return;
    try {
      await toggleLike(id);
    } catch {
      Alert.alert('Error', 'Failed to update like.');
    }
  }, [user, id, toggleLike]);

  const handleDelete = useCallback(() => {
    if (!id) return;
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removePost(id);
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to delete post.');
          }
        },
      },
    ]);
  }, [id, removePost, router]);

  const handleSubmitComment = useCallback(
    async (content: string) => {
      if (!user) {
        Alert.alert('Sign In Required', 'Please sign in to comment.');
        return;
      }
      if (!id) return;
      await postComment(id, content);
    },
    [user, id, postComment]
  );

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      Alert.alert(
        'Delete Comment',
        'Are you sure you want to delete this comment?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await removeComment(commentId);
              } catch {
                Alert.alert('Error', 'Failed to delete comment.');
              }
            },
          },
        ]
      );
    },
    [removeComment]
  );

  const renderComment = useCallback(
    ({ item }: { item: PostComment }) => (
      <CommentCard
        comment={item}
        isDark={isDark}
        currentUserId={user?.id}
        onDelete={() => handleDeleteComment(item.id)}
      />
    ),
    [isDark, user, handleDeleteComment]
  );

  const isOwner = user?.id === currentPost?.user_id;
  const displayName = currentPost?.profile?.display_name || 'Unknown User';

  const renderHeader = () => {
    if (!currentPost) return null;

    return (
      <View>
        {/* User Header */}
        <View style={styles.userHeader}>
          <Pressable
            style={styles.userInfo}
            onPress={() => router.push(`/user/${currentPost.user_id}`)}
          >
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.surfaceElevated },
              ]}
            >
              {currentPost.profile?.avatar_url ? (
                <Image
                  source={{ uri: currentPost.profile.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={[styles.avatarText, { color: colors.text }]}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View>
              <Text style={[styles.displayName, { color: colors.text }]}>
                {displayName}
              </Text>
              <Text
                style={[styles.timestamp, { color: colors.textSecondary }]}
              >
                {formatTimeAgo(currentPost.created_at)}
              </Text>
            </View>
          </Pressable>
          {isOwner && (
            <Pressable onPress={handleDelete} hitSlop={8}>
              <Trash2 color={colors.textSecondary} size={20} />
            </Pressable>
          )}
        </View>

        {/* Image */}
        <Image
          source={{ uri: currentPost.image_url }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Run info if attached */}
        {currentPost.run && currentPost.run.zero_to_sixty_time && (
          <View
            style={[
              styles.runInfo,
              { backgroundColor: colors.surfaceElevated },
            ]}
          >
            <Text style={[styles.runTime, { color: COLORS.accent }]}>
              0-60: {formatTime(currentPost.run.zero_to_sixty_time)}
            </Text>
            {currentPost.run.vehicle_name && (
              <Text
                style={[styles.runVehicle, { color: colors.textSecondary }]}
              >
                {currentPost.run.vehicle_name}
              </Text>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable style={styles.actionButton} onPress={handleLike}>
            <Heart
              color={currentPost.is_liked ? '#FF4444' : colors.textSecondary}
              fill={currentPost.is_liked ? '#FF4444' : 'transparent'}
              size={24}
            />
            <Text
              style={[
                styles.actionCount,
                {
                  color: currentPost.is_liked
                    ? '#FF4444'
                    : colors.textSecondary,
                },
              ]}
            >
              {currentPost.likes_count}
            </Text>
          </Pressable>
        </View>

        {/* Caption */}
        {currentPost.caption && (
          <View style={styles.captionContainer}>
            <Text style={[styles.captionName, { color: colors.text }]}>
              {displayName}
            </Text>
            <Text style={[styles.caption, { color: colors.text }]}>
              {currentPost.caption}
            </Text>
          </View>
        )}

        {/* Comments Header */}
        <View style={styles.commentsHeader}>
          <Text style={[styles.commentsTitle, { color: colors.textSecondary }]}>
            Comments ({currentPost.comments_count})
          </Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoadingComments) return null;

    return (
      <View style={styles.emptyComments}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No comments yet. Be the first!
        </Text>
      </View>
    );
  };

  if (isLoading && !currentPost) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Post',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Post',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={renderComment}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={styles.listContent}
          />

          {user && (
            <CommentInput isDark={isDark} onSubmit={handleSubmitComment} />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  displayName: {
    fontSize: 15,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 13,
    marginTop: 1,
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: '#1a1a1a',
  },
  runInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  runTime: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  runVehicle: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    padding: 14,
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCount: {
    fontSize: 15,
    fontWeight: '600',
  },
  captionContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  captionName: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  commentsHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  commentsTitle: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyComments: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
