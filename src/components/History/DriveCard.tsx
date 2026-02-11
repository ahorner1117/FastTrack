import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight, Navigation, Gauge, Circle, CheckCircle2 } from 'lucide-react-native';
import type { Drive, UnitSystem } from '../../types';
import { COLORS } from '../../utils/constants';
import {
  formatRelativeDate,
  formatSpeed,
  formatDistance,
} from '../../utils/formatters';

interface DriveCardProps {
  drive: Drive;
  unitSystem: UnitSystem;
  onPress: () => void;
  isSelecting?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  vehicleName?: string;
}

export function DriveCard({ drive, unitSystem, onPress, isSelecting, isSelected, onToggleSelect, vehicleName }: DriveCardProps) {
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
          <Text style={styles.date}>{formatRelativeDate(drive.createdAt)}</Text>
          {vehicleName && (
            <Text style={styles.vehicleName}>{vehicleName}</Text>
          )}
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Navigation color={COLORS.accent} size={16} />
            <Text style={styles.statLabel}>Dist</Text>
            <Text style={styles.statValue}>
              {formatDistance(drive.distance, unitSystem)}
            </Text>
          </View>

          <View style={styles.stat}>
            <Gauge color={COLORS.dark.textSecondary} size={16} />
            <Text style={styles.statLabel}>Max</Text>
            <Text style={styles.statValue}>
              {formatSpeed(drive.maxSpeed, unitSystem)}
            </Text>
          </View>
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
  vehicleName: {
    fontSize: 12,
    color: COLORS.dark.textTertiary,
    marginTop: 2,
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
