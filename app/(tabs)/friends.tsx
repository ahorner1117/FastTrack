import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { UserPlus, Bell, Users } from 'lucide-react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { COLORS } from '@/src/utils/constants';
import { useFriendsStore } from '@/src/stores/friendsStore';
import { useAuthStore } from '@/src/stores/authStore';
import { FriendCard } from '@/src/components/Friends';
import type { Friendship } from '@/src/types';

export default function FriendsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const { user } = useAuthStore();
  const {
    friends,
    pendingRequests,
    isLoading,
    fetchAll,
    removeFriend,
  } = useFriendsStore();

  useEffect(() => {
    fetchAll();
  }, []);

  const handleRefresh = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  const handleRemoveFriend = (friendship: Friendship) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFriend(friendship.id),
        },
      ]
    );
  };

  const getFriendProfile = (friendship: Friendship) => {
    // Return the profile that isn't the current user
    if (friendship.user_id === user?.id) {
      return friendship.friend_profile;
    }
    return friendship.user_profile;
  };

  const renderFriend = ({ item }: { item: Friendship }) => {
    const profile = getFriendProfile(item);
    if (!profile) return null;

    return (
      <FriendCard
        profile={profile}
        onRemove={() => handleRemoveFriend(item)}
        isDark={isDark}
      />
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Users color={colors.textSecondary} size={48} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No friends yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Add friends from your contacts to see their runs and compete on the leaderboard
      </Text>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: COLORS.accent }]}
        onPress={() => router.push('/friends/add' as any)}
      >
        <UserPlus color="#000000" size={20} />
        <Text style={styles.addButtonText}>Add Friends</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Friends</Text>
        <View style={styles.headerActions}>
          {pendingRequests.length > 0 && (
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: COLORS.accent }]}
              onPress={() => router.push('/friends/requests' as any)}
            >
              <Bell color="#000000" size={20} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequests.length}</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.headerButton,
              { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface },
            ]}
            onPress={() => router.push('/friends/add' as any)}
          >
            <UserPlus color={colors.text} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={renderFriend}
        contentContainerStyle={[
          styles.listContent,
          friends.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={COLORS.accent}
          />
        }
      />
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
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
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});
