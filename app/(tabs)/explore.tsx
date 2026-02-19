import React, { useEffect, useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Compass } from 'lucide-react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { COLORS } from '@/src/utils/constants';
import { useAuthStore } from '@/src/stores/authStore';
import { useFeedStore } from '@/src/stores/feedStore';
import { useSearchStore } from '@/src/stores/searchStore';
import {
  CreatePostButton,
  SearchBar,
  UserSearchCard,
} from '@/src/components/Feed';
import { PostGrid } from '@/src/components/Profile/PostGrid';
import type { Post, UserSearchResult } from '@/src/types';

type SearchTab = 'users' | 'posts';

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const router = useRouter();

  const { user } = useAuthStore();
  const {
    explorePosts,
    isLoadingExplore,
    isRefreshingExplore,
    hasMoreExplore,
    fetchExplorePosts,
    loadMoreExplore,
    refreshExplore,
  } = useFeedStore();

  const {
    query,
    activeTab,
    userResults,
    postResults,
    isSearching,
    hasSearched,
    setQuery,
    setActiveTab,
    search,
    clear,
  } = useSearchStore();

  const isSearchActive = query.length > 0 || hasSearched;

  useEffect(() => {
    fetchExplorePosts();
  }, [fetchExplorePosts]);

  const handlePostPress = useCallback(
    (post: Post) => {
      router.push(`/posts/${post.id}`);
    },
    [router]
  );

  const handleUserPress = useCallback(
    (userId: string) => {
      router.push(`/user/${userId}`);
    },
    [router]
  );

  const handleCreatePost = useCallback(() => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to create posts.');
      return;
    }
    router.push('/posts/create');
  }, [user, router]);

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      search();
    }
  }, [query, search]);

  const handleClearSearch = useCallback(() => {
    clear();
  }, [clear]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Explore</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={handleSearch}
          onClear={handleClearSearch}
          isDark={isDark}
        />
      </View>

      {isSearchActive ? (
        <>
          {/* Search tab toggle */}
          <View style={styles.searchTabsContainer}>
            <Pressable
              style={[
                styles.searchTab,
                activeTab === 'users' && {
                  borderBottomColor: COLORS.accent,
                  borderBottomWidth: 2,
                },
              ]}
              onPress={() => setActiveTab('users')}
            >
              <Text
                style={[
                  styles.searchTabText,
                  {
                    color:
                      activeTab === 'users'
                        ? colors.text
                        : colors.textSecondary,
                  },
                  activeTab === 'users' && styles.searchTabTextActive,
                ]}
              >
                Users
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.searchTab,
                activeTab === 'posts' && {
                  borderBottomColor: COLORS.accent,
                  borderBottomWidth: 2,
                },
              ]}
              onPress={() => setActiveTab('posts')}
            >
              <Text
                style={[
                  styles.searchTabText,
                  {
                    color:
                      activeTab === 'posts'
                        ? colors.text
                        : colors.textSecondary,
                  },
                  activeTab === 'posts' && styles.searchTabTextActive,
                ]}
              >
                Vehicles
              </Text>
            </Pressable>
          </View>

          {isSearching ? (
            <View style={styles.searchLoadingContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
          ) : activeTab === 'users' ? (
            <FlatList
              data={userResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }: { item: UserSearchResult }) => (
                <UserSearchCard
                  user={item}
                  isDark={isDark}
                  onPress={() => handleUserPress(item.id)}
                />
              )}
              contentContainerStyle={[
                styles.searchListContent,
                userResults.length === 0 && styles.emptyListContent,
              ]}
              ListEmptyComponent={
                hasSearched ? (
                  <View style={styles.emptyContainer}>
                    <Text
                      style={[
                        styles.emptySubtitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      No users found
                    </Text>
                  </View>
                ) : null
              }
            />
          ) : (
            <PostGrid
              posts={postResults}
              isDark={isDark}
              onPostPress={handlePostPress}
            />
          )}
        </>
      ) : (
        <PostGrid
          posts={explorePosts}
          isDark={isDark}
          onPostPress={handlePostPress}
          isLoading={isLoadingExplore}
          onEndReached={hasMoreExplore ? loadMoreExplore : undefined}
        />
      )}

      {user && !isSearchActive && <CreatePostButton onPress={handleCreatePost} />}
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
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  searchTabText: {
    fontSize: 15,
  },
  searchTabTextActive: {
    fontWeight: '600',
  },
  searchListContent: {
    padding: 16,
  },
  searchLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
