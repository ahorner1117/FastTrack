import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserPlus, Clock } from 'lucide-react-native';
import { COLORS } from '@/src/utils/constants';
import type { Profile } from '@/src/types';

interface ContactCardProps {
  profile: Profile;
  contactName: string;
  onAddFriend: () => void;
  isPending: boolean;
  isDark: boolean;
}

export function ContactCard({
  profile,
  contactName,
  onAddFriend,
  isPending,
  isDark,
}: ContactCardProps) {
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
        <Text style={[styles.contactName, { color: colors.textSecondary }]}>
          {contactName} in your contacts
        </Text>
      </View>

      {isPending ? (
        <View style={[styles.pendingBadge, { backgroundColor: colors.surfaceElevated }]}>
          <Clock color={colors.textSecondary} size={16} />
          <Text style={[styles.pendingText, { color: colors.textSecondary }]}>
            Pending
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: COLORS.accent }]}
          onPress={onAddFriend}
        >
          <UserPlus color="#000000" size={20} />
        </TouchableOpacity>
      )}
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
  contactName: {
    fontSize: 13,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  pendingText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
