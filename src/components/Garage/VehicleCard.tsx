import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight, Wrench } from 'lucide-react-native';
import type { Vehicle } from '../../types';
import { COLORS } from '../../utils/constants';
import { VehicleImage } from './VehicleImage';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: () => void;
  isDark?: boolean;
}

export function VehicleCard({ vehicle, onPress, isDark = true }: VehicleCardProps) {
  const colors = isDark ? COLORS.dark : COLORS.light;
  const upgradeCount = vehicle.upgrades.length;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <VehicleImage photoUri={vehicle.photoUri} size={56} isDark={isDark} />

      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {vehicle.name}
        </Text>

        <View style={styles.details}>
          <Text style={[styles.spec, { color: colors.textSecondary }]}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Text>

          {upgradeCount > 0 && (
            <View style={styles.upgradesBadge}>
              <Wrench color={COLORS.accent} size={12} />
              <Text style={[styles.upgradesCount, { color: COLORS.accent }]}>
                {upgradeCount}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ChevronRight color={colors.textTertiary} size={20} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    gap: 12,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  spec: {
    fontSize: 13,
  },
  upgradesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upgradesCount: {
    fontSize: 12,
    fontWeight: '600',
  },
});
