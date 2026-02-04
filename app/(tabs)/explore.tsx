import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Compass } from 'lucide-react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { COLORS } from '@/src/utils/constants';
import { useAuthStore } from '@/src/stores/authStore';
import { useFeedStore } from '@/src/stores/feedStore';
import {
  PostCard,
  CreatePostButton,
  FeedScopeToggle,
} from '@/src/components/Feed';
import type { Post } from '@/src/types';

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const router = useRouter();

  const { user } = useAuthStore();
  const {
    posts,
    scope,
    isLoading,
    isRefreshing,
    hasMore,
    setScope,
    fetchPosts,
    loadMore,
    refresh,
    toggleLike,
    removePost,
  } = useFeedStore();

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostPress = useCallback(
    (post: Post) => {
      router.push(`/posts/${post.id}`);
    },
    [router]
  );

  const handleLike = useCallback(
    async (postId: string) => {
      if (!user) {
        Alert.alert('Sign In Required', 'Please sign in to like posts.');
        return;
      }
      try {
        await toggleLike(postId);
      } catch {
        Alert.alert('Error', 'Failed to update like.');
      }
    },
    [user, toggleLike]
  );

  const handleComment = useCallback(
    (post: Post) => {
      router.push(`/posts/${post.id}`);
    },
    [router]
  );

  const handleDelete = useCallback(
    async (postId: string) => {
      Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removePost(postId);
            } catch {
              Alert.alert('Error', 'Failed to delete post.');
            }
          },
        },
      ]);
    },
    [removePost]
  );

  const handleCreatePost = useCallback(() => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to create posts.');
      return;
    }
    router.push('/posts/create');
  }, [user, router]);

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        post={item}
        isDark={isDark}
        currentUserId={user?.id}
        onPress={() => handlePostPress(item)}
        onLike={() => handleLike(item.id)}
        onComment={() => handleComment(item)}
        onDelete={() => handleDelete(item.id)}
      />
    ),
    [isDark, user, handlePostPress, handleLike, handleComment, handleDelete]
  );

  const renderEmptyList = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Compass color={colors.textSecondary} size={48} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {scope === 'friends' ? 'No posts from friends' : 'No posts yet'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {scope === 'friends'
            ? 'Add friends to see their posts here'
            : 'Be the first to share something!'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Explore</Text>
        <FeedScopeToggle
          scope={scope}
          onScopeChange={setScope}
          isDark={isDark}
        />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={[
          styles.listContent,
          posts.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmptyList}
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={COLORS.accent}
          />
        }
      />

      {user && <CreatePostButton onPress={handleCreatePost} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
