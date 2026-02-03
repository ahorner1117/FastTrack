import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, Shield } from 'lucide-react-native';
import { COLORS } from '@/src/utils/constants';
import type { AdminUserWithStats } from '@/src/services/adminService';

interface AdminUserCardProps {
  user: AdminUserWithStats;
  onPress: () => void;
  isDark: boolean;
}

export function AdminUserCard({ user, onPress, isDark }: AdminUserCardProps) {
  const colors = isDark ? COLORS.dark : COLORS.light;
  const displayName = user.display_name || user.email.split('@')[0];

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: COLORS.accent }]}>
          <Text style={styles.avatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        {user.is_admin && (
          <View style={styles.adminBadge}>
            <Shield color="#000000" size={10} />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>
          {user.email}
        </Text>
        <Text style={[styles.stats, { color: colors.textSecondary }]}>
          {user.run_count} run{user.run_count !== 1 ? 's' : ''}
        </Text>
      </View>

      <ChevronRight color={colors.textSecondary} size={20} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  avatarContainer: {
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
  },
  adminBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.accent,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    marginBottom: 2,
  },
  stats: {
    fontSize: 12,
  },
});
