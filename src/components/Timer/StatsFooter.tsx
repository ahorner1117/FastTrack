import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Gauge, Route } from 'lucide-react-native';
import { COLORS } from '../../utils/constants';
import type { UnitSystem } from '../../types';

interface StatsFooterProps {
  maxSpeed: number; // m/s
  distance: number; // meters
  unitSystem: UnitSystem;
}

export function StatsFooter({ maxSpeed, distance, unitSystem }: StatsFooterProps) {
  const formatSpeed = (speedMs: number): string => {
    const MS_TO_MPH = 2.23694;
    const MS_TO_KPH = 3.6;
    const speed =
      unitSystem === 'imperial' ? speedMs * MS_TO_MPH : speedMs * MS_TO_KPH;
    return speed.toFixed(1);
  };

  const formatDistance = (meters: number): string => {
    const METERS_TO_MILES = 0.000621371;
    const METERS_TO_KM = 0.001;
    const dist =
      unitSystem === 'imperial'
        ? meters * METERS_TO_MILES
        : meters * METERS_TO_KM;
    return dist.toFixed(2);
  };

  const speedUnit = unitSystem === 'imperial' ? 'mph' : 'km/h';
  const distanceUnit = unitSystem === 'imperial' ? 'mi' : 'km';

  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Gauge color={COLORS.dark.textSecondary} size={16} />
        <Text style={styles.label}>Top:</Text>
        <Text style={styles.value}>
          {formatSpeed(maxSpeed)} {speedUnit}
        </Text>
      </View>
      <View style={styles.stat}>
        <Route color={COLORS.dark.textSecondary} size={16} />
        <Text style={styles.label}>Dist:</Text>
        <Text style={styles.value}>
          {formatDistance(distance)} {distanceUnit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.dark.border,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.dark.textSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark.text,
    fontVariant: ['tabular-nums'],
  },
});
