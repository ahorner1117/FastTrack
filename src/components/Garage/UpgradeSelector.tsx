import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import type { VehicleUpgrade } from '../../types';
import { COLORS, VEHICLE_UPGRADES } from '../../utils/constants';

interface UpgradeSelectorProps {
  selectedUpgrades: VehicleUpgrade[];
  onToggle: (upgrade: VehicleUpgrade) => void;
  isDark?: boolean;
}

export function UpgradeSelector({
  selectedUpgrades,
  onToggle,
  isDark = true,
}: UpgradeSelectorProps) {
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <View style={styles.container}>
      <View style={styles.chipGrid}>
        {VEHICLE_UPGRADES.map((upgrade) => {
          const isSelected = selectedUpgrades.includes(upgrade.value as VehicleUpgrade);
          return (
            <Pressable
              key={upgrade.value}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? COLORS.accent
                    : colors.surfaceElevated,
                  borderColor: isSelected ? COLORS.accent : colors.border,
                },
              ]}
              onPress={() => onToggle(upgrade.value as VehicleUpgrade)}
            >
              {isSelected && (
                <Check color="#000000" size={14} style={styles.checkIcon} />
              )}
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? '#000000' : colors.text,
                  },
                ]}
              >
                {upgrade.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  checkIcon: {
    marginRight: 4,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
