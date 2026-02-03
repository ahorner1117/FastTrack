import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap, Gauge, Flag, Route } from 'lucide-react-native';
import { COLORS } from '@/src/utils/constants';
import type { PersonalBests as PersonalBestsType } from '@/src/services/leaderboardService';

interface PersonalBestsProps {
  bests: PersonalBestsType;
  isLoading: boolean;
  isDark: boolean;
}

function formatTime(ms: number | null): string {
  if (ms === null) return '--';
  const seconds = ms / 1000;
  return seconds.toFixed(2) + 's';
}

interface BestCardProps {
  label: string;
  time: number | null;
  icon: React.ReactNode;
  isDark: boolean;
}

function BestCard({ label, time, icon, isDark }: BestCardProps) {
  const colors = isDark ? COLORS.dark : COLORS.light;
  const hasTime = time !== null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardHeader}>
        {icon}
        <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
      </View>
      <Text
        style={[
          styles.cardTime,
          { color: hasTime ? COLORS.accent : colors.textSecondary },
        ]}
      >
        {formatTime(time)}
      </Text>
    </View>
  );
}

export function PersonalBests({ bests, isLoading, isDark }: PersonalBestsProps) {
  const colors = isDark ? COLORS.dark : COLORS.light;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>Your Personal Bests</Text>
        <View style={styles.grid}>
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[styles.card, styles.cardLoading, { backgroundColor: colors.surface }]}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Your Personal Bests</Text>
      <View style={styles.grid}>
        <BestCard
          label="0-60 mph"
          time={bests.zero_to_sixty}
          icon={<Zap size={16} color={COLORS.accent} />}
          isDark={isDark}
        />
        <BestCard
          label="0-100 mph"
          time={bests.zero_to_hundred}
          icon={<Gauge size={16} color={COLORS.accent} />}
          isDark={isDark}
        />
        <BestCard
          label="1/4 Mile"
          time={bests.quarter_mile}
          icon={<Flag size={16} color={COLORS.accent} />}
          isDark={isDark}
        />
        <BestCard
          label="1/2 Mile"
          time={bests.half_mile}
          icon={<Route size={16} color={COLORS.accent} />}
          isDark={isDark}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    width: '48%',
    padding: 12,
    borderRadius: 10,
  },
  cardLoading: {
    height: 64,
    opacity: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardTime: {
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
