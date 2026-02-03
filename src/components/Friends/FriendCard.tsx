import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserMinus } from 'lucide-react-native';
import { COLORS } from '@/src/utils/constants';
import type { Profile } from '@/src/types';

interface FriendCardProps {
  profile: Profile;
  onRemove: () => void;
  isDark: boolean;
}

export function FriendCard({ profile, onRemove, isDark }: FriendCardProps) {
  const colors = isDark ? COLORS.dark : COLORS.light;

  const displayName = profile.display_name || profile.email.split('@')[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: COLORS.accent }]}>
          <Text style={styles.avatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>
          {profile.email}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={onRemove}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <UserMinus color={colors.error} size={20} />
      </TouchableOpacity>
    </View>
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
  },
  removeButton: {
    padding: 8,
  },
});
