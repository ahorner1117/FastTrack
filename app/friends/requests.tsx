import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { Inbox } from 'lucide-react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { COLORS } from '@/src/utils/constants';
import { FriendRequestCard } from '@/src/components/Friends';
import { useFriendsStore } from '@/src/stores/friendsStore';
import type { Friendship } from '@/src/types';

export default function FriendRequestsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const {
    pendingRequests,
    isLoading,
    fetchPendingRequests,
    acceptRequest,
    rejectRequest,
  } = useFriendsStore();

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const handleAccept = async (friendship: Friendship) => {
    try {
      await acceptRequest(friendship.id);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept request');
    }
  };

  const handleReject = (friendship: Friendship) => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this friend request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectRequest(friendship.id);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to decline request');
            }
          },
        },
      ]
    );
  };

  const renderRequest = ({ item }: { item: Friendship }) => {
    const profile = item.user_profile;
    if (!profile) return null;

    return (
      <FriendRequestCard
        profile={profile}
        onAccept={() => handleAccept(item)}
        onReject={() => handleReject(item)}
        isDark={isDark}
      />
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Inbox color={colors.textSecondary} size={48} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No pending requests
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        When someone sends you a friend request, it will appear here
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={pendingRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequest}
        contentContainerStyle={[
          styles.listContent,
          pendingRequests.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchPendingRequests}
            tintColor={COLORS.accent}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
});
