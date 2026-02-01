import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import type { Run, UnitSystem } from '../../types';
import { COLORS } from '../../utils/constants';
import {
  formatSpeed,
  formatDistance,
  formatTimeShort,
  formatDateTime,
} from '../../utils/formatters';

interface RunStatsCardProps {
  run: Run;
  unitSystem: UnitSystem;
}

interface StatRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function StatRow({ label, value, highlight = false }: StatRowProps) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>
        {value}
      </Text>
    </View>
  );
}

export function RunStatsCard({ run, unitSystem }: RunStatsCardProps) {
  const { milestones } = run;

  // Calculate total distance from last GPS point
  const totalDistance =
    run.gpsPoints.length > 0
      ? run.gpsPoints[run.gpsPoints.length - 1].timestamp - run.startTime > 0
        ? milestones.halfMile?.distance ??
          milestones.quarterMile?.distance ??
          milestones.zeroToHundred?.distance ??
          milestones.zeroToSixty?.distance ??
          0
        : 0
      : 0;

  // Calculate run duration
  const duration = run.endTime - run.startTime;

  return (
    <View style={styles.container}>
      {/* Milestones Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Milestones</Text>

        {milestones.zeroToSixty && (
          <StatRow
            label={unitSystem === 'imperial' ? '0-60 mph' : '0-100 km/h'}
            value={formatTimeShort(milestones.zeroToSixty.time)}
            highlight
          />
        )}

        {milestones.zeroToHundred && (
          <StatRow
            label={unitSystem === 'imperial' ? '0-100 mph' : '0-160 km/h'}
            value={formatTimeShort(milestones.zeroToHundred.time)}
            highlight
          />
        )}

        {milestones.quarterMile && (
          <StatRow
            label={unitSystem === 'imperial' ? '1/4 Mile' : '250 Meters'}
            value={formatTimeShort(milestones.quarterMile.time)}
            highlight
          />
        )}

        {milestones.halfMile && (
          <StatRow
            label={unitSystem === 'imperial' ? '1/2 Mile' : '500 Meters'}
            value={formatTimeShort(milestones.halfMile.time)}
            highlight
          />
        )}

        {!milestones.zeroToSixty &&
          !milestones.zeroToHundred &&
          !milestones.quarterMile &&
          !milestones.halfMile && (
            <Text style={styles.noData}>No milestones reached</Text>
          )}
      </View>

      {/* Stats Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Run Stats</Text>

        <StatRow
          label="Max Speed"
          value={formatSpeed(run.maxSpeed, unitSystem)}
        />

        {milestones.quarterMile && (
          <StatRow
            label="Trap Speed"
            value={formatSpeed(milestones.quarterMile.speed, unitSystem)}
          />
        )}

        <StatRow label="Duration" value={formatTimeShort(duration)} />

        {totalDistance > 0 && (
          <StatRow
            label="Distance"
            value={formatDistance(totalDistance, unitSystem)}
          />
        )}

        <StatRow label="GPS Points" value={`${run.gpsPoints.length}`} />
      </View>

      {/* Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Info</Text>

        <StatRow label="Date" value={formatDateTime(run.createdAt)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  section: {
    backgroundColor: COLORS.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dark.border,
  },
  statLabel: {
    fontSize: 16,
    color: COLORS.dark.text,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.dark.textSecondary,
  },
  statValueHighlight: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  noData: {
    fontSize: 14,
    color: COLORS.dark.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
});
