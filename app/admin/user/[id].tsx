import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { User, Shield, Calendar, Edit, Ban, CheckCircle, Bell } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { COLORS } from '@/src/utils/constants';
import { Card } from '@/src/components/common/Card';
import { TabBar, type AdminTab } from '@/src/components/Admin/TabBar';
import { RunListItem } from '@/src/components/Admin/RunListItem';
import { VehicleListItem } from '@/src/components/Admin/VehicleListItem';
import { PostListItem } from '@/src/components/Admin/PostListItem';
import { EditProfileModal } from '@/src/components/Admin/EditProfileModal';
import { BanUserModal } from '@/src/components/Admin/BanUserModal';
import { SendNotificationModal } from '@/src/components/Admin/SendNotificationModal';
import {
  getUserDetailFull,
  updateUserProfile,
  banUser,
  unbanUser,
  deleteRun,
  deleteVehicle,
  hidePost,
  unhidePost,
  deletePost,
} from '@/src/services/adminService';
import type { AdminUserDetailFull, UpdateProfileInput, BanUserInput } from '@/src/types';

export default function AdminUserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [userDetail, setUserDetail] = useState<AdminUserDetailFull | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('profile');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [banModalVisible, setBanModalVisible] = useState(false);
  const [notifyModalVisible, setNotifyModalVisible] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      setError(null);
      const data = await getUserDetailFull(id);
      setUserDetail(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (updates: UpdateProfileInput) => {
    if (!userDetail) return;
    await updateUserProfile(userDetail.profile.id, updates);
    await loadUser();
  };

  const handleBanUser = async (input: BanUserInput) => {
    if (!userDetail) return;
    await banUser(userDetail.profile.id, input);
    await loadUser();
  };

  const handleUnbanUser = () => {
    if (!userDetail) return;
    Alert.alert(
      'Unban User',
      `Remove ban from ${displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unban',
          onPress: async () => {
            try {
              await unbanUser(userDetail.profile.id);
              await loadUser();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to unban user');
            }
          },
        },
      ]
    );
  };

  const handleDeleteRun = async (runId: string) => {
    try {
      await deleteRun(runId, 'Deleted by admin');
      await loadUser();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to delete run');
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      await deleteVehicle(vehicleId, 'Deleted by admin');
      await loadUser();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to delete vehicle');
    }
  };

  const handleHidePost = async (postId: string) => {
    try {
      await hidePost(postId, { reason: 'Hidden by admin' });
      await loadUser();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to hide post');
    }
  };

  const handleUnhidePost = async (postId: string) => {
    try {
      await unhidePost(postId);
      await loadUser();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to unhide post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId, 'Deleted by admin');
      await loadUser();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to delete post');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (error || !userDetail) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Error' }} />
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error || 'User not found'}
        </Text>
      </View>
    );
  }

  const { profile, runs, vehicles, posts, stats } = userDetail;
  const displayName = profile.display_name || profile.email.split('@')[0];
  const isBanned = (profile as any).is_banned === true;

  return (
    <>
      <Stack.Screen options={{ title: displayName }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Card isDark={isDark}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatar, { backgroundColor: COLORS.accent }]}>
                <User color="#000000" size={32} />
              </View>
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.displayName, { color: colors.text }]}>
                    {displayName}
                  </Text>
                  {profile.is_admin && (
                    <View style={[styles.adminBadge, { backgroundColor: COLORS.accent }]}>
                      <Shield color="#000000" size={12} />
                      <Text style={styles.adminBadgeText}>Admin</Text>
                    </View>
                  )}
                  {isBanned && (
                    <View style={[styles.bannedBadge, { backgroundColor: COLORS.error }]}>
                      <Ban color="#FFFFFF" size={12} />
                      <Text style={styles.bannedBadgeText}>Banned</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.email, { color: colors.textSecondary }]}>
                  {profile.email}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.detailRow}>
              <Calendar color={colors.textSecondary} size={18} />
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Joined
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {new Date(profile.created_at).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>

            <View style={[styles.statsRow]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stats.total_runs}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Runs
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stats.total_vehicles}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Vehicles
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stats.total_posts}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Posts
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stats.total_comments}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Comments
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: COLORS.accent + '20' },
                ]}
                onPress={() => setEditModalVisible(true)}
              >
                <Edit size={18} color={COLORS.accent} />
                <Text style={[styles.actionButtonText, { color: COLORS.accent }]}>
                  Edit Profile
                </Text>
              </TouchableOpacity>

              {isBanned ? (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: COLORS.success + '20' },
                  ]}
                  onPress={handleUnbanUser}
                >
                  <CheckCircle size={18} color={COLORS.success} />
                  <Text
                    style={[styles.actionButtonText, { color: COLORS.success }]}
                  >
                    Unban User
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: COLORS.error + '20' },
                  ]}
                  onPress={() => setBanModalVisible(true)}
                >
                  <Ban size={18} color={COLORS.error} />
                  <Text style={[styles.actionButtonText, { color: COLORS.error }]}>
                    Ban User
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: COLORS.secondary + '20' },
                ]}
                onPress={() => setNotifyModalVisible(true)}
              >
                <Bell size={18} color={COLORS.secondary} />
                <Text style={[styles.actionButtonText, { color: COLORS.secondary }]}>
                  Notify
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          <TabBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isDark={isDark}
          />

          {activeTab === 'profile' && (
            <Card isDark={isDark} style={styles.tabContent}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Profile Information
              </Text>
              <Text style={[styles.info, { color: colors.textSecondary }]}>
                Use the Edit Profile button to modify user details or change admin
                status.
              </Text>
            </Card>
          )}

          {activeTab === 'runs' && (
            <Card isDark={isDark} style={styles.tabContent}>
              {runs.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No runs recorded
                </Text>
              ) : (
                runs.map((run) => (
                  <RunListItem
                    key={run.id}
                    run={run}
                    isDark={isDark}
                    onDelete={handleDeleteRun}
                  />
                ))
              )}
            </Card>
          )}

          {activeTab === 'vehicles' && (
            <Card isDark={isDark} style={styles.tabContent}>
              {vehicles.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No vehicles added
                </Text>
              ) : (
                vehicles.map((vehicle) => (
                  <VehicleListItem
                    key={vehicle.id}
                    vehicle={vehicle}
                    isDark={isDark}
                    onDelete={handleDeleteVehicle}
                  />
                ))
              )}
            </Card>
          )}

          {activeTab === 'posts' && (
            <Card isDark={isDark} style={styles.tabContent}>
              {posts.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No posts created
                </Text>
              ) : (
                posts.map((post) => (
                  <PostListItem
                    key={post.id}
                    post={post}
                    isDark={isDark}
                    onHide={handleHidePost}
                    onUnhide={handleUnhidePost}
                    onDelete={handleDeletePost}
                  />
                ))
              )}
            </Card>
          )}
        </ScrollView>
      </View>

      <EditProfileModal
        visible={editModalVisible}
        profile={profile}
        isDark={isDark}
        onClose={() => setEditModalVisible(false)}
        onSave={handleUpdateProfile}
      />

      <BanUserModal
        visible={banModalVisible}
        userDisplayName={displayName}
        isDark={isDark}
        onClose={() => setBanModalVisible(false)}
        onBan={handleBanUser}
      />

      <SendNotificationModal
        visible={notifyModalVisible}
        userId={profile.id}
        userDisplayName={displayName}
        isDark={isDark}
        onClose={() => setNotifyModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  adminBadgeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
  },
  bannedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  bannedBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  email: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  info: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
