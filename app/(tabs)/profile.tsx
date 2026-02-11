import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  TextInput,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Pencil, Check } from 'lucide-react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { COLORS } from '@/src/utils/constants';
import { useAuthStore } from '@/src/stores/authStore';
import { useVehicleStore } from '@/src/stores/vehicleStore';
import { useFriendsStore } from '@/src/stores/friendsStore';
import { getProfile, updateProfile } from '@/src/services/authService';
import { uploadAvatar, deleteAvatar } from '@/src/services/avatarService';
import { getUserPosts } from '@/src/services/postsService';
import { ProfileHeader } from '@/src/components/Profile/ProfileHeader';
import { PostGrid } from '@/src/components/Profile/PostGrid';
import { VehicleShowcase } from '@/src/components/Profile/VehicleShowcase';
import type { Post } from '@/src/types';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const router = useRouter();

  const { user, profile, setProfile } = useAuthStore();
  const vehicles = useVehicleStore((state) => state.vehicles);
  const { friends, pendingRequests, fetchAll: fetchFriends } = useFriendsStore();

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(profile?.bio || '');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadUserPosts = useCallback(async () => {
    if (!user) return;
    setIsLoadingPosts(true);
    try {
      const posts = await getUserPosts(user.id);
      setUserPosts(posts);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserPosts();
    fetchFriends();
  }, [loadUserPosts, fetchFriends]);

  useEffect(() => {
    setBioText(profile?.bio || '');
  }, [profile?.bio]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadUserPosts(), fetchFriends()]);
    if (user) {
      const updatedProfile = await getProfile(user.id);
      if (updatedProfile) setProfile(updatedProfile);
    }
    setIsRefreshing(false);
  }, [loadUserPosts, fetchFriends, user, setProfile]);

  const handlePickAvatar = async () => {
    Alert.alert('Profile Photo', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera access is needed to take photos.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            await handleUploadAvatar(result.assets[0].uri);
          }
        },
      },
      {
        text: 'Choose from Library',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            await handleUploadAvatar(result.assets[0].uri);
          }
        },
      },
      ...(profile?.avatar_url
        ? [
            {
              text: 'Remove Photo',
              style: 'destructive' as const,
              onPress: handleRemoveAvatar,
            },
          ]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const handleUploadAvatar = async (uri: string) => {
    if (!user) return;
    setIsUploadingAvatar(true);
    try {
      const { url, error } = await uploadAvatar(uri);
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
      if (url) {
        const updatedProfile = await getProfile(user.id);
        setProfile(updatedProfile);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload photo');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setIsUploadingAvatar(true);
    try {
      const success = await deleteAvatar();
      if (success) {
        const updatedProfile = await getProfile(user.id);
        setProfile(updatedProfile);
      } else {
        Alert.alert('Error', 'Failed to remove photo');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to remove photo');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveBio = async () => {
    if (!user) return;
    try {
      await updateProfile(user.id, { bio: bioText.trim() || null });
      const updatedProfile = await getProfile(user.id);
      setProfile(updatedProfile);
      setIsEditingBio(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update bio');
    }
  };

  const handlePostPress = useCallback(
    (post: Post) => {
      router.push(`/posts/${post.id}`);
    },
    [router]
  );

  const handleVehiclePress = useCallback(
    (vehicle: any) => {
      router.push(`/vehicles/${vehicle.id}`);
    },
    [router]
  );

  if (!profile) return null;

  const headerComponent = (
    <>
      <ProfileHeader
        profile={profile}
        isOwnProfile={true}
        isDark={isDark}
        postsCount={userPosts.length}
        friendsCount={friends.length}
        pendingRequestsCount={pendingRequests.length}
        isUploadingAvatar={isUploadingAvatar}
        onEditAvatar={handlePickAvatar}
        onSettings={() => router.push('/settings' as any)}
        onFriends={() => router.push('/(tabs)/friends' as any)}
      />

      {/* Bio edit section */}
      {isEditingBio ? (
        <View style={styles.bioEditContainer}>
          <TextInput
            style={[
              styles.bioInput,
              {
                backgroundColor: colors.surface,
                color: colors.text,
              },
            ]}
            value={bioText}
            onChangeText={setBioText}
            placeholder="Write something about yourself..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={150}
            autoFocus
          />
          <View style={styles.bioActions}>
            <Pressable
              style={styles.bioCancelButton}
              onPress={() => {
                setIsEditingBio(false);
                setBioText(profile.bio || '');
              }}
            >
              <Text style={[styles.bioCancelText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              style={[styles.bioSaveButton, { backgroundColor: COLORS.accent }]}
              onPress={handleSaveBio}
            >
              <Check color="#000000" size={16} />
              <Text style={styles.bioSaveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={styles.bioTapArea}
          onPress={() => setIsEditingBio(true)}
        >
          {!profile.bio && (
            <View style={styles.editBioHint}>
              <Pencil color={colors.textSecondary} size={12} />
              <Text style={[styles.editBioText, { color: colors.textSecondary }]}>
                Tap to add bio
              </Text>
            </View>
          )}
        </Pressable>
      )}

      <VehicleShowcase
        vehicles={vehicles}
        isDark={isDark}
        onVehiclePress={handleVehiclePress}
      />

      {/* Posts section header */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        POSTS
      </Text>
    </>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <PostGrid
        posts={userPosts}
        isDark={isDark}
        onPostPress={handlePostPress}
        isLoading={isLoadingPosts}
        ListHeaderComponent={headerComponent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginLeft: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  bioEditContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  bioInput: {
    padding: 12,
    borderRadius: 12,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  bioActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  bioCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bioCancelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bioSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bioSaveText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  bioTapArea: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  editBioHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editBioText: {
    fontSize: 13,
  },
});
