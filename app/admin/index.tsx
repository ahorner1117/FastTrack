import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Users, Flag } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { COLORS } from '@/src/utils/constants';
import { AdminUserCard } from '@/src/components/Admin';
import {
  getAllUsers,
  searchUsers,
  getPendingPostReports,
  getPendingCommentReports,
  type AdminUserWithStats,
} from '@/src/services/adminService';

export default function AdminUsersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const router = useRouter();

  const [users, setUsers] = useState<AdminUserWithStats[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUserWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);

  const loadUsers = useCallback(async () => {
    try {
      setError(null);
      const data = await getAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    }
  }, []);

  const loadReportsCount = useCallback(async () => {
    try {
      const [postReports, commentReports] = await Promise.all([
        getPendingPostReports(),
        getPendingCommentReports(),
      ]);
      setPendingReportsCount(postReports.length + commentReports.length);
    } catch (err) {
      // Silently fail - reports count is not critical
      console.error('Failed to load reports count:', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadUsers(), loadReportsCount()]).finally(() => setIsLoading(false));
  }, [loadUsers, loadReportsCount]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.email.toLowerCase().includes(query) ||
          (user.display_name && user.display_name.toLowerCase().includes(query))
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadUsers(), loadReportsCount()]);
    setIsRefreshing(false);
  }, [loadUsers, loadReportsCount]);

  const handleUserPress = (userId: string) => {
    router.push(`/admin/user/${userId}`);
  };

  const renderUser = ({ item }: { item: AdminUserWithStats }) => (
    <AdminUserCard
      user={item}
      onPress={() => handleUserPress(item.id)}
      isDark={isDark}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Users color={colors.textSecondary} size={48} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {searchQuery ? 'No users found' : 'No users yet'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {searchQuery
          ? 'Try a different search term'
          : 'Users will appear here once they sign up'}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {pendingReportsCount > 0 && (
        <TouchableOpacity
          style={[styles.reportsBanner, { backgroundColor: COLORS.warning }]}
          onPress={() => router.push('/admin/reports')}
        >
          <Flag size={20} color="#000000" />
          <Text style={styles.reportsBannerText}>
            {pendingReportsCount} pending report{pendingReportsCount !== 1 ? 's' : ''} need review
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: isDark ? '#1A1A1A' : '#E5E5E5' }]}>
          <Search color={colors.textSecondary} size={20} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search users..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <Text style={[styles.userCount, { color: colors.textSecondary }]}>
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  reportsBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  userCount: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
