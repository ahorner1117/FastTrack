import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS } from '../../utils/constants';
import type { RunMilestone, UnitSystem } from '../../types';

interface Milestones {
  zeroToSixty?: RunMilestone;
  zeroToHundred?: RunMilestone;
  quarterMile?: RunMilestone;
  halfMile?: RunMilestone;
}

interface SecondaryTimerDisplayProps {
  elapsedMs: number;
  isRunning: boolean;
  milestones: Milestones;
  unitSystem: UnitSystem;
  launchDelta: number | null;
  currentAcceleration: number;
  isMonitoring: boolean;
  status: 'idle' | 'armed' | 'running' | 'completed';
}

function formatElapsedTime(ms: number): string {
  if (ms < 0) return '0.000';
  const totalSeconds = ms / 1000;
  if (totalSeconds < 60) {
    return totalSeconds.toFixed(3);
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
}

function formatMilestoneTime(ms: number): string {
  return (ms / 1000).toFixed(2) + 's';
}

function formatDelta(ms: number): string {
  const sign = ms >= 0 ? '+' : '';
  return `${sign}${(ms / 1000).toFixed(2)}s`;
}

export function SecondaryTimerDisplay({
  elapsedMs,
  isRunning,
  milestones,
  unitSystem,
  launchDelta,
  currentAcceleration,
  isMonitoring,
  status,
}: SecondaryTimerDisplayProps) {
  if (status === 'idle') return null;

  const speedLabels = unitSystem === 'imperial'
    ? { sixty: '0-60', hundred: '0-100' }
    : { sixty: '0-100k', hundred: '0-160k' };

  const distLabels = unitSystem === 'imperial'
    ? { quarter: '1/4mi', half: '1/2mi' }
    : { quarter: '250m', half: '500m' };

  const milestoneItems: string[] = [];
  if (milestones.zeroToSixty) {
    milestoneItems.push(`${speedLabels.sixty}: ${formatMilestoneTime(milestones.zeroToSixty.time)}`);
  }
  if (milestones.zeroToHundred) {
    milestoneItems.push(`${speedLabels.hundred}: ${formatMilestoneTime(milestones.zeroToHundred.time)}`);
  }
  if (milestones.quarterMile) {
    milestoneItems.push(`${distLabels.quarter}: ${formatMilestoneTime(milestones.quarterMile.time)}`);
  }
  if (milestones.halfMile) {
    milestoneItems.push(`${distLabels.half}: ${formatMilestoneTime(milestones.halfMile.time)}`);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.label}>MAGNITUDE TIMER</Text>
        {launchDelta !== null && (
          <View style={styles.deltaBadge}>
            <Text style={styles.deltaText}>{formatDelta(launchDelta)}</Text>
          </View>
        )}
      </View>

      {/* Timer */}
      <Text style={[styles.time, { color: isRunning ? COLORS.secondary : COLORS.dark.text }]}>
        {formatElapsedTime(elapsedMs)}
      </Text>

      {/* Armed state: show acceleration reading */}
      {status === 'armed' && isMonitoring && (
        <Text style={styles.accelText}>
          {currentAcceleration.toFixed(2)} G (magnitude)
        </Text>
      )}

      {/* Milestones row */}
      {milestoneItems.length > 0 && (
        <Text style={styles.milestones}>
          {milestoneItems.join('  |  ')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.dark.surface,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondary,
    letterSpacing: 1,
  },
  deltaBadge: {
    backgroundColor: COLORS.secondaryDim + '33',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
    fontVariant: ['tabular-nums'],
  },
  time: {
    fontSize: 36,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  accelText: {
    fontSize: 13,
    color: COLORS.dark.textSecondary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  milestones: {
    fontSize: 12,
    color: COLORS.dark.textSecondary,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
});
