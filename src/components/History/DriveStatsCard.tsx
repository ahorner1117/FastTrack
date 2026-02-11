import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import type { Drive, UnitSystem } from '../../types';
import { COLORS } from '../../utils/constants';
import {
  formatSpeed,
  formatDistance,
  formatTime,
  formatDateTime,
} from '../../utils/formatters';

interface DriveStatsCardProps {
  drive: Drive;
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

export function DriveStatsCard({ drive, unitSystem }: DriveStatsCardProps) {
  const duration = drive.endTime - drive.startTime;

  return (
    <View style={styles.container}>
      {/* Stats Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Drive Stats</Text>

        <StatRow
          label="Duration"
          value={formatTime(duration)}
          highlight
        />

        <StatRow
          label="Distance"
          value={formatDistance(drive.distance, unitSystem)}
          highlight
        />

        <StatRow
          label="Max Speed"
          value={formatSpeed(drive.maxSpeed, unitSystem)}
        />

        <StatRow
          label="Avg Speed"
          value={formatSpeed(drive.avgSpeed, unitSystem)}
        />

        <StatRow label="GPS Points" value={`${drive.gpsPoints.length}`} />
      </View>

      {/* Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Info</Text>

        <StatRow label="Date" value={formatDateTime(drive.createdAt)} />
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
});
