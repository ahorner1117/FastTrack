import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Trophy, Users } from 'lucide-react-native';
import { COLORS } from '@/src/utils/constants';
import type { LeaderboardEntry } from '@/src/types';

interface LeaderboardCardProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  isDark: boolean;
}

function formatTime(ms: number): string {
  const seconds = ms / 1000;
  return seconds.toFixed(2) + 's';
}

function getRankColor(rank: number): string {
  switch (rank) {
    case 1:
      return '#FFD700'; // Gold
    case 2:
      return '#C0C0C0'; // Silver
    case 3:
      return '#CD7F32'; // Bronze
    default:
      return COLORS.dark.textSecondary;
  }
}

export function LeaderboardCard({
  entry,
  isCurrentUser,
  isDark,
}: LeaderboardCardProps) {
  const colors = isDark ? COLORS.dark : COLORS.light;
  const isTopThree = entry.rank <= 3;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isCurrentUser
            ? isDark
              ? 'rgba(0, 255, 127, 0.1)'
              : 'rgba(0, 170, 85, 0.1)'
            : colors.surface,
          borderColor: isCurrentUser ? COLORS.accent : 'transparent',
          borderWidth: isCurrentUser ? 1 : 0,
        },
      ]}
    >
      <View style={styles.rankContainer}>
        {isTopThree ? (
          <Trophy color={getRankColor(entry.rank)} size={24} />
        ) : (
          <Text style={[styles.rank, { color: colors.textSecondary }]}>
            {entry.rank}
          </Text>
        )}
      </View>

      <View style={styles.avatarContainer}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: isCurrentUser
                ? COLORS.accent
                : colors.surfaceElevated,
            },
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              { color: isCurrentUser ? '#000000' : colors.text },
            ]}
          >
            {entry.display_name.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text
            style={[
              styles.name,
              { color: colors.text },
              isCurrentUser && { fontWeight: '700' },
            ]}
            numberOfLines={1}
          >
            {entry.display_name}
            {isCurrentUser && ' (You)'}
          </Text>
          {entry.is_friend && !isCurrentUser && (
            <Users color={COLORS.accent} size={14} />
          )}
        </View>
        {entry.vehicle_name && (
          <Text
            style={[styles.vehicle, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {entry.vehicle_name}
          </Text>
        )}
      </View>

      <View style={styles.timeContainer}>
        <Text
          style={[
            styles.time,
            { color: isTopThree ? getRankColor(entry.rank) : COLORS.accent },
          ]}
        >
          {formatTime(entry.time)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank: {
    fontSize: 16,
    fontWeight: '600',
  },
  avatarContainer: {
    marginHorizontal: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    flexShrink: 1,
  },
  vehicle: {
    fontSize: 12,
    marginTop: 2,
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  time: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
