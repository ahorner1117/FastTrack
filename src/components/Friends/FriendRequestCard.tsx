import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { COLORS } from '@/src/utils/constants';
import type { Profile } from '@/src/types';

interface FriendRequestCardProps {
  profile: Profile;
  onAccept: () => void;
  onReject: () => void;
  isDark: boolean;
}

export function FriendRequestCard({
  profile,
  onAccept,
  onReject,
  isDark,
}: FriendRequestCardProps) {
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

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.accent }]}
          onPress={onAccept}
        >
          <Check color="#000000" size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: colors.surfaceElevated },
          ]}
          onPress={onReject}
        >
          <X color={colors.error} size={20} />
        </TouchableOpacity>
      </View>
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
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
