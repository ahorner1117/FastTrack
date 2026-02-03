import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight, Gauge, Timer, Activity, Circle, CheckCircle2 } from 'lucide-react-native';
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
  isSelecting?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export function RunCard({ run, unitSystem, onPress, isSelecting, isSelected, onToggleSelect }: RunCardProps) {
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

  const handlePress = () => {
    if (isSelecting && onToggleSelect) {
      onToggleSelect();
    } else {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.containerSelected]}
      onPress={handlePress}
      onLongPress={onToggleSelect}
      activeOpacity={0.7}
    >
      {isSelecting && (
        <View style={styles.checkbox}>
          {isSelected ? (
            <CheckCircle2 color={COLORS.accent} size={24} />
          ) : (
            <Circle color={COLORS.dark.textTertiary} size={24} />
          )}
        </View>
      )}
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
  containerSelected: {
    backgroundColor: COLORS.dark.surfaceHighlight,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  checkbox: {
    marginRight: 12,
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
