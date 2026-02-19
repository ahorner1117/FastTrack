import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { COLORS } from '@/src/utils/constants';
import { NotificationCard } from '@/src/components/Notifications';
import { useNotificationStore } from '@/src/stores/notificationStore';
import { useFriendsStore } from '@/src/stores/friendsStore';
import type { NotificationItem } from '@/src/types';

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const router = useRouter();

  const { notifications, readIds, isLoading, fetchNotifications, markAsRead } =
    useNotificationStore();
  const { acceptRequest, rejectRequest } = useFriendsStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRefresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleAccept = async (friendshipId: string) => {
    try {
      await acceptRequest(friendshipId);
      fetchNotifications();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept request');
    }
  };

  const handleReject = (friendshipId: string) => {
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
              await rejectRequest(friendshipId);
              fetchNotifications();
            } catch (err: any) {
              Alert.alert(
                'Error',
                err.message || 'Failed to decline request'
              );
            }
          },
        },
      ]
    );
  };

  const handlePress = (notification: NotificationItem) => {
    markAsRead(notification.id);
    if (notification.type === 'friend_request') {
      router.push(`/user/${notification.actor_id}`);
    } else if (notification.post_id) {
      router.push(`/posts/${notification.post_id}`);
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <NotificationCard
      notification={item}
      isDark={isDark}
      isRead={readIds.has(item.id)}
      onPress={() => handlePress(item)}
      onAccept={
        item.type === 'friend_request' && item.friendship_id
          ? () => handleAccept(item.friendship_id!)
          : undefined
      }
      onReject={
        item.type === 'friend_request' && item.friendship_id
          ? () => handleReject(item.friendship_id!)
          : undefined
      }
    />
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Bell color={colors.textSecondary} size={48} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No notifications yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        When someone likes your post, comments, or sends a friend request, it
        will appear here
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyListContent,
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
