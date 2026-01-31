import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { COLORS } from '../../utils/constants';
import type { RunMilestone, UnitSystem } from '../../types';

interface MetricsGridProps {
  milestones: {
    zeroToSixty?: RunMilestone;
    zeroToHundred?: RunMilestone;
    quarterMile?: RunMilestone;
    halfMile?: RunMilestone;
  };
  unitSystem: UnitSystem;
}

interface MetricCardProps {
  label: string;
  time?: number; // ms
  trapSpeed?: number; // m/s
  unitSystem: UnitSystem;
  isAchieved: boolean;
}

function MetricCard({
  label,
  time,
  trapSpeed,
  unitSystem,
  isAchieved,
}: MetricCardProps) {
  const animatedStyle = useAnimatedStyle(() => {
    if (isAchieved) {
      return {
        transform: [{ scale: withSpring(1.02, { damping: 10 }) }],
        borderColor: withTiming(COLORS.accent, { duration: 300 }),
      };
    }
    return {
      transform: [{ scale: 1 }],
      borderColor: COLORS.dark.border,
    };
  });

  const formatTime = (ms: number): string => {
    const seconds = ms / 1000;
    return seconds.toFixed(2);
  };

  const formatTrapSpeed = (speedMs: number): string => {
    const MS_TO_MPH = 2.23694;
    const MS_TO_KPH = 3.6;
    const speed =
      unitSystem === 'imperial' ? speedMs * MS_TO_MPH : speedMs * MS_TO_KPH;
    return speed.toFixed(1);
  };

  const getSpeedUnit = (): string => {
    return unitSystem === 'imperial' ? 'mph' : 'km/h';
  };

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text
        style={[
          styles.cardTime,
          { color: isAchieved ? COLORS.accent : COLORS.dark.text },
        ]}
      >
        {time !== undefined ? `${formatTime(time)}s` : '--'}
      </Text>
      {trapSpeed !== undefined && (
        <Text style={styles.cardTrap}>
          @ {formatTrapSpeed(trapSpeed)} {getSpeedUnit()}
        </Text>
      )}
    </Animated.View>
  );
}

export function MetricsGrid({ milestones, unitSystem }: MetricsGridProps) {
  const speedLabel0to60 = unitSystem === 'imperial' ? '0-60' : '0-100';
  const speedLabel0to100 = unitSystem === 'imperial' ? '0-100' : '0-160';
  const distLabel1 = unitSystem === 'imperial' ? '1/4 mi' : '400m';
  const distLabel2 = unitSystem === 'imperial' ? '1/2 mi' : '800m';

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <MetricCard
          label={speedLabel0to60}
          time={milestones.zeroToSixty?.time}
          unitSystem={unitSystem}
          isAchieved={!!milestones.zeroToSixty}
        />
        <MetricCard
          label={speedLabel0to100}
          time={milestones.zeroToHundred?.time}
          unitSystem={unitSystem}
          isAchieved={!!milestones.zeroToHundred}
        />
      </View>
      <View style={styles.row}>
        <MetricCard
          label={distLabel1}
          time={milestones.quarterMile?.time}
          trapSpeed={milestones.quarterMile?.speed}
          unitSystem={unitSystem}
          isAchieved={!!milestones.quarterMile}
        />
        <MetricCard
          label={distLabel2}
          time={milestones.halfMile?.time}
          trapSpeed={milestones.halfMile?.speed}
          unitSystem={unitSystem}
          isAchieved={!!milestones.halfMile}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.dark.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    padding: 16,
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.dark.textSecondary,
    marginBottom: 4,
  },
  cardTime: {
    fontSize: 28,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  cardTrap: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.dark.textTertiary,
    marginTop: 2,
  },
});
