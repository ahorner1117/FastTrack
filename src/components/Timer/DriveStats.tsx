import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Gauge, Route, TrendingUp, Clock } from 'lucide-react-native';
import { COLORS } from '../../utils/constants';
import { formatSpeed, formatDistance, formatTime } from '../../utils/formatters';
import type { UnitSystem } from '../../types';

interface DriveStatsProps {
  elapsedTime: number;
  totalDistance: number;
  maxSpeed: number;
  avgSpeed: number;
  unitSystem: UnitSystem;
}

export function DriveStats({
  elapsedTime,
  totalDistance,
  maxSpeed,
  avgSpeed,
  unitSystem,
}: DriveStatsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.stat}>
          <View style={styles.statHeader}>
            <Clock size={16} color={COLORS.dark.textSecondary} />
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
        </View>

        <View style={styles.stat}>
          <View style={styles.statHeader}>
            <Route size={16} color={COLORS.dark.textSecondary} />
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <Text style={styles.statValue}>
            {formatDistance(totalDistance, unitSystem)}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.stat}>
          <View style={styles.statHeader}>
            <Gauge size={16} color={COLORS.dark.textSecondary} />
            <Text style={styles.statLabel}>Max Speed</Text>
          </View>
          <Text style={styles.statValue}>
            {formatSpeed(maxSpeed, unitSystem)}
          </Text>
        </View>

        <View style={styles.stat}>
          <View style={styles.statHeader}>
            <TrendingUp size={16} color={COLORS.dark.textSecondary} />
            <Text style={styles.statLabel}>Avg Speed</Text>
          </View>
          <Text style={styles.statValue}>
            {formatSpeed(avgSpeed, unitSystem)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flex: 1,
    gap: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.dark.textSecondary,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.dark.text,
  },
});
