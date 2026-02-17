import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { COLORS } from '@/src/utils/constants';
import { useAuthStore } from '@/src/stores/authStore';
import { useFriendsStore } from '@/src/stores/friendsStore';
import { getUserProfile } from '@/src/services/userProfileService';
import { ProfileHeader } from '@/src/components/Profile/ProfileHeader';
import { PostGrid } from '@/src/components/Profile/PostGrid';
import { VehicleShowcase } from '@/src/components/Profile/VehicleShowcase';
import type { Post, UserProfileData } from '@/src/types';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const router = useRouter();

  const { user } = useAuthStore();
  const { sendRequest, acceptRequest, removeFriend } = useFriendsStore();

  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUserProfile(id);
      setProfileData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleAddFriend = async () => {
    if (!id || isActionLoading) return;
    setIsActionLoading(true);
    try {
      await sendRequest(id);
      setProfileData((prev) =>
        prev ? { ...prev, friendshipStatus: 'pending_sent' } : prev
      );
      Alert.alert('Success', 'Friend request sent!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send friend request');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAcceptFriend = async () => {
    if (!profileData?.friendshipId || isActionLoading) return;
    setIsActionLoading(true);
    try {
      await acceptRequest(profileData.friendshipId);
      setProfileData((prev) =>
        prev ? { ...prev, friendshipStatus: 'accepted' } : prev
      );
      Alert.alert('Success', 'Friend request accepted!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept friend request');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveFriend = () => {
    if (!profileData?.friendshipId) return;
    Alert.alert('Remove Friend', 'Are you sure you want to remove this friend?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeFriend(profileData.friendshipId!);
            setProfileData((prev) =>
              prev
                ? { ...prev, friendshipStatus: 'none', friendshipId: undefined }
                : prev
            );
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to remove friend');
          }
        },
      },
    ]);
  };

  const handlePostPress = useCallback(
    (post: Post) => {
      router.push(`/posts/${post.id}`);
    },
    [router]
  );

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '',
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

  if (error || !profileData) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Profile',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View
          style={[
            styles.errorContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error || 'Profile not found'}
          </Text>
        </View>
      </>
    );
  }

  const isOwnProfile = user?.id === id;

  const headerComponent = (
    <>
      <ProfileHeader
        profile={profileData.profile}
        isOwnProfile={isOwnProfile}
        isDark={isDark}
        postsCount={profileData.postsCount}
        friendshipStatus={profileData.friendshipStatus}
        isActionLoading={isActionLoading}
        onAddFriend={handleAddFriend}
        onAcceptFriend={handleAcceptFriend}
        onRemoveFriend={handleRemoveFriend}
      />

      {profileData.vehicles.length > 0 && (
        <VehicleShowcase
          vehicles={profileData.vehicles}
          isDark={isDark}
        />
      )}

      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        POSTS
      </Text>
    </>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: profileData.profile.display_name || 'Profile',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={[]}
      >
        <PostGrid
          posts={profileData.posts}
          isDark={isDark}
          onPostPress={handlePostPress}
          isLoading={false}
          ListHeaderComponent={headerComponent}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginLeft: 16,
    marginBottom: 8,
    marginTop: 8,
  },
});
