import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, Users, Globe } from 'lucide-react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { COLORS } from '@/src/utils/constants';
import { useAuthStore } from '@/src/stores/authStore';
import {
  getLeaderboard,
  getFriendsLeaderboard,
  getPersonalBests,
  type PersonalBests as PersonalBestsType,
} from '@/src/services/leaderboardService';
import { LeaderboardCard, LeaderboardHeader, PersonalBests } from '@/src/components/Leaderboard';
import type { LeaderboardCategory, LeaderboardEntry } from '@/src/types';

type LeaderboardScope = 'global' | 'friends';

export default function LeaderboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const { user } = useAuthStore();

  const [category, setCategory] = useState<LeaderboardCategory>('zero_to_sixty');
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [personalBests, setPersonalBests] = useState<PersonalBestsType>({
    zero_to_sixty: null,
    zero_to_hundred: null,
    quarter_mile: null,
    half_mile: null,
  });
  const [isLoadingBests, setIsLoadingBests] = useState(true);

  const fetchPersonalBests = useCallback(async () => {
    if (!user) {
      setIsLoadingBests(false);
      return;
    }
    setIsLoadingBests(true);
    try {
      const bests = await getPersonalBests();
      setPersonalBests(bests);
    } catch {
      // Silently fail - personal bests are optional
    } finally {
      setIsLoadingBests(false);
    }
  }, [user]);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data =
        scope === 'friends'
          ? await getFriendsLeaderboard(category)
          : await getLeaderboard(category);
      setEntries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard');
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [category, scope]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    fetchPersonalBests();
  }, [fetchPersonalBests]);

  const renderEntry = ({ item }: { item: LeaderboardEntry }) => (
    <LeaderboardCard
      entry={item}
      isCurrentUser={item.user_id === user?.id}
      isDark={isDark}
    />
  );

  const renderEmptyList = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Trophy color={colors.textSecondary} size={48} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {scope === 'friends' ? 'No friends on the board' : 'No times yet'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {scope === 'friends'
            ? 'Add friends to see their best times here'
            : 'Complete a run to appear on the leaderboard'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Leaderboard</Text>
        <View style={styles.scopeToggle}>
          <Pressable
            style={[
              styles.scopeButton,
              {
                backgroundColor:
                  scope === 'global'
                    ? COLORS.accent
                    : isDark
                    ? COLORS.dark.surface
                    : COLORS.light.surface,
              },
            ]}
            onPress={() => setScope('global')}
          >
            <Globe
              color={scope === 'global' ? '#000000' : colors.text}
              size={18}
            />
          </Pressable>
          <Pressable
            style={[
              styles.scopeButton,
              {
                backgroundColor:
                  scope === 'friends'
                    ? COLORS.accent
                    : isDark
                    ? COLORS.dark.surface
                    : COLORS.light.surface,
              },
            ]}
            onPress={() => setScope('friends')}
          >
            <Users
              color={scope === 'friends' ? '#000000' : colors.text}
              size={18}
            />
          </Pressable>
        </View>
      </View>

      <LeaderboardHeader
        selectedCategory={category}
        onSelectCategory={setCategory}
        isDark={isDark}
      />

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item, index) => `${item.user_id}-${index}`}
          renderItem={renderEntry}
          contentContainerStyle={[
            styles.listContent,
            entries.length === 0 && styles.emptyListContent,
          ]}
          ListHeaderComponent={
            user ? (
              <PersonalBests
                bests={personalBests}
                isLoading={isLoadingBests}
                isDark={isDark}
              />
            ) : null
          }
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => {
                fetchLeaderboard();
                fetchPersonalBests();
              }}
              tintColor={COLORS.accent}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  scopeToggle: {
    flexDirection: 'row',
    gap: 4,
  },
  scopeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
