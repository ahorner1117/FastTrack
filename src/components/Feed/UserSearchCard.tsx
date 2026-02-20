import React from 'react';
import { StyleSheet, View, Text, Image, Pressable } from 'react-native';
import { User } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { COLORS } from '@/src/utils/constants';
import type { UserSearchResult } from '@/src/types';

interface UserSearchCardProps {
  user: UserSearchResult;
  isDark: boolean;
  onPress: () => void;
}

export function UserSearchCard({ user, isDark, onPress }: UserSearchCardProps) {
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <Pressable
      style={[styles.container, { backgroundColor: colors.surface }]}
      onPress={onPress}
    >
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url, cache: 'force-cache' }} style={styles.avatar} />
      ) : (
        <View
          style={[
            styles.avatar,
            styles.avatarPlaceholder,
            { backgroundColor: COLORS.accent },
          ]}
        >
          <User color="#000000" size={18} />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {user.display_name || 'FastTrack User'}
        </Text>
        {user.username && (
          <Text style={[styles.username, { color: colors.textSecondary }]} numberOfLines={1}>
            @{user.username}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
  },
  username: {
    fontSize: 13,
    marginTop: 1,
  },
});
