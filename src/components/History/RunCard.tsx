import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight, Gauge, Timer, Activity } from 'lucide-react-native';
import type { Run, UnitSystem } from '../../types';
import { COLORS } from '../../utils/constants';
import {
  formatRelativeDate,
  formatSpeed,
  formatTimeShort,
} from '../../utils/formatters';

interface RunCardProps {
  run: Run;
  unitSystem: UnitSystem;
  onPress: () => void;
}

export function RunCard({ run, unitSystem, onPress }: RunCardProps) {
  // Get the best milestone to display
  const getBestMilestone = () => {
    const { milestones } = run;
    if (milestones.zeroToSixty) {
      return {
        label: unitSystem === 'imperial' ? '0-60' : '0-100',
        time: milestones.zeroToSixty.time,
      };
    }
    if (milestones.quarterMile) {
      return {
        label: unitSystem === 'imperial' ? '1/4 mi' : '250m',
        time: milestones.quarterMile.time,
      };
    }
    if (milestones.zeroToHundred) {
      return {
        label: unitSystem === 'imperial' ? '0-100' : '0-160',
        time: milestones.zeroToHundred.time,
      };
    }
    if (milestones.halfMile) {
      return {
        label: unitSystem === 'imperial' ? '1/2 mi' : '500m',
        time: milestones.halfMile.time,
      };
    }
    return null;
  };

  const bestMilestone = getBestMilestone();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.date}>{formatRelativeDate(run.createdAt)}</Text>
        </View>

        <View style={styles.stats}>
          {bestMilestone && (
            <View style={styles.stat}>
              <Timer color={COLORS.accent} size={16} />
              <Text style={styles.statLabel}>{bestMilestone.label}</Text>
              <Text style={styles.statValue}>
                {formatTimeShort(bestMilestone.time)}
              </Text>
            </View>
          )}

          <View style={styles.stat}>
            <Gauge color={COLORS.dark.textSecondary} size={16} />
            <Text style={styles.statLabel}>Max</Text>
            <Text style={styles.statValue}>
              {formatSpeed(run.maxSpeed, unitSystem)}
            </Text>
          </View>

          {run.launchDetectionConfig && (
            <View style={styles.stat}>
              <Activity color={COLORS.dark.textTertiary} size={16} />
              <Text style={styles.statLabel}>Launch</Text>
              <Text style={styles.statValue}>
                {run.launchDetectionConfig.thresholdG}G
              </Text>
            </View>
          )}
        </View>
      </View>

      <ChevronRight color={COLORS.dark.textTertiary} size={20} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: COLORS.dark.textSecondary,
  },
  stats: {
    flexDirection: 'row',
    gap: 24,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.dark.textTertiary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark.text,
  },
});
