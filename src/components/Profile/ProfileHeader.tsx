import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import {
  User,
  Settings,
  Users,
  UserPlus,
  Clock,
  Check,
  Camera,
} from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { COLORS } from '@/src/utils/constants';
import { MentionText } from '@/src/utils/mentions';
import type { Profile } from '@/src/types';

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile: boolean;
  isDark: boolean;
  postsCount: number;
  friendsCount?: number;
  pendingRequestsCount?: number;
  friendshipStatus?: 'none' | 'pending_sent' | 'pending_received' | 'accepted';
  isUploadingAvatar?: boolean;
  onEditAvatar?: () => void;
  onSettings?: () => void;
  onFriends?: () => void;
  onAddFriend?: () => void;
  onAcceptFriend?: () => void;
  onRemoveFriend?: () => void;
}

export function ProfileHeader({
  profile,
  isOwnProfile,
  isDark,
  postsCount,
  friendsCount = 0,
  pendingRequestsCount = 0,
  friendshipStatus = 'none',
  isUploadingAvatar = false,
  onEditAvatar,
  onSettings,
  onFriends,
  onAddFriend,
  onAcceptFriend,
  onRemoveFriend,
}: ProfileHeaderProps) {
  const colors = Colors[isDark ? 'dark' : 'light'];

  const renderFriendshipButton = () => {
    if (isOwnProfile) return null;

    switch (friendshipStatus) {
      case 'accepted':
        return (
          <Pressable
            style={[styles.friendButton, { backgroundColor: colors.surface }]}
            onPress={onRemoveFriend}
          >
            <Check color={COLORS.accent} size={16} />
            <Text style={[styles.friendButtonText, { color: colors.text }]}>
              Friends
            </Text>
          </Pressable>
        );
      case 'pending_sent':
        return (
          <View
            style={[styles.friendButton, { backgroundColor: colors.surface }]}
          >
            <Clock color={colors.textSecondary} size={16} />
            <Text
              style={[
                styles.friendButtonText,
                { color: colors.textSecondary },
              ]}
            >
              Pending
            </Text>
          </View>
        );
      case 'pending_received':
        return (
          <Pressable
            style={[styles.friendButton, { backgroundColor: COLORS.accent }]}
            onPress={onAcceptFriend}
          >
            <UserPlus color="#000000" size={16} />
            <Text style={[styles.friendButtonText, { color: '#000000' }]}>
              Accept
            </Text>
          </Pressable>
        );
      default:
        return (
          <Pressable
            style={[styles.friendButton, { backgroundColor: COLORS.accent }]}
            onPress={onAddFriend}
          >
            <UserPlus color="#000000" size={16} />
            <Text style={[styles.friendButtonText, { color: '#000000' }]}>
              Add Friend
            </Text>
          </Pressable>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Top row: avatar + stats + actions */}
      <View style={styles.topRow}>
        {/* Avatar */}
        <Pressable
          onPress={isOwnProfile ? onEditAvatar : undefined}
          disabled={isUploadingAvatar}
        >
          <View style={styles.avatarContainer}>
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  styles.avatarPlaceholder,
                  { backgroundColor: COLORS.accent },
                ]}
              >
                <User color="#000000" size={32} />
              </View>
            )}
            {isUploadingAvatar && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
            {isOwnProfile && !isUploadingAvatar && (
              <View style={styles.avatarBadge}>
                <Camera color="#FFFFFF" size={12} />
              </View>
            )}
          </View>
        </Pressable>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {postsCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Posts
            </Text>
          </View>
          {isOwnProfile && (
            <Pressable style={styles.statItem} onPress={onFriends}>
              <View style={styles.friendsStatRow}>
                <Text style={[styles.statNumber, { color: colors.text }]}>
                  {friendsCount}
                </Text>
                {pendingRequestsCount > 0 && (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>
                      {pendingRequestsCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[styles.statLabel, { color: colors.textSecondary }]}
              >
                Friends
              </Text>
            </Pressable>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          {isOwnProfile ? (
            <Pressable
              style={[
                styles.iconButton,
                { backgroundColor: colors.surface },
              ]}
              onPress={onSettings}
            >
              <Settings color={colors.text} size={20} />
            </Pressable>
          ) : (
            renderFriendshipButton()
          )}
        </View>
      </View>

      {/* Name */}
      <Text style={[styles.displayName, { color: colors.text }]}>
        {profile.display_name || 'FastTrack User'}
      </Text>

      {/* Username */}
      {profile.username && (
        <Text style={[styles.username, { color: colors.textSecondary }]}>
          @{profile.username}
        </Text>
      )}

      {/* Bio */}
      {profile.bio ? (
        <MentionText style={styles.bio} isDark={isDark}>
          {profile.bio}
        </MentionText>
      ) : isOwnProfile ? (
        <Text style={[styles.bioPlaceholder, { color: colors.textSecondary }]}>
          Add a bio...
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  friendsStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pendingBadge: {
    backgroundColor: '#FF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  actionsContainer: {
    marginLeft: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  friendButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
  },
  bioPlaceholder: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
