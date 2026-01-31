import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  useEffect,
} from 'react-native-reanimated';
import { COLORS, SPEED_THRESHOLDS } from '../../utils/constants';
import type { UnitSystem } from '../../types';

interface SpeedDisplayProps {
  speedMs: number;
  unitSystem: UnitSystem;
  isRunning: boolean;
}

// Helper to get color based on speed - runs on JS thread
function getSpeedColor(
  speedMs: number,
  unitSystem: UnitSystem,
  isRunning: boolean
): string {
  if (!isRunning) return COLORS.dark.text;

  const sixtyThreshold =
    unitSystem === 'imperial'
      ? SPEED_THRESHOLDS.SIXTY_MPH
      : SPEED_THRESHOLDS.SIXTY_KPH;
  const hundredThreshold =
    unitSystem === 'imperial'
      ? SPEED_THRESHOLDS.HUNDRED_MPH
      : SPEED_THRESHOLDS.HUNDRED_KPH;

  if (speedMs >= hundredThreshold) return COLORS.accent;
  if (speedMs >= sixtyThreshold) return COLORS.accentDim;
  return COLORS.dark.text;
}

export function SpeedDisplay({ speedMs, unitSystem, isRunning }: SpeedDisplayProps) {
  const displaySpeed = formatSpeed(speedMs, unitSystem, 1);
  const unit = getSpeedUnit(unitSystem);

  // Compute color on JS thread
  const targetColor = useMemo(
    () => getSpeedColor(speedMs, unitSystem, isRunning),
    [speedMs, unitSystem, isRunning]
  );

  // Use shared value for animation
  const colorShared = useSharedValue(targetColor);

  // Update shared value when target changes
  React.useEffect(() => {
    colorShared.value = targetColor;
  }, [targetColor, colorShared]);

  const animatedTextStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      color: withTiming(colorShared.value, { duration: 200 }),
    };
  });

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.speed, animatedTextStyle]}>
        {displaySpeed}
      </Animated.Text>
      <Text style={styles.unit}>{unit}</Text>
    </View>
  );
}

function formatSpeed(speedMs: number, unitSystem: UnitSystem, decimals: number): string {
  const MS_TO_MPH = 2.23694;
  const MS_TO_KPH = 3.6;
  const displaySpeed =
    unitSystem === 'imperial' ? speedMs * MS_TO_MPH : speedMs * MS_TO_KPH;
  return displaySpeed.toFixed(decimals);
}

function getSpeedUnit(unitSystem: UnitSystem): string {
  return unitSystem === 'imperial' ? 'mph' : 'km/h';
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  speed: {
    fontSize: 96,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
    color: COLORS.dark.text,
  },
  unit: {
    fontSize: 20,
    fontWeight: '400',
    color: COLORS.dark.textSecondary,
    marginTop: -8,
  },
});
