import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  cancelAnimation,
} from 'react-native-reanimated';
import { COLORS } from '../../utils/constants';
import type { TimerState } from '../../types';

interface LaunchStatusProps {
  status: TimerState['status'];
  currentAcceleration: number;
  isAccelerometerAvailable: boolean;
  isTooFastToStart?: boolean;
}

export function LaunchStatus({
  status,
  currentAcceleration,
  isAccelerometerAvailable,
  isTooFastToStart = false,
}: LaunchStatusProps) {
  const opacity = useSharedValue(1);

  // Pulse animation when armed
  React.useEffect(() => {
    if (status === 'armed') {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      opacity.value = withTiming(1);
    }

    return () => {
      cancelAnimation(opacity);
    };
  }, [status, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const getMessage = () => {
    switch (status) {
      case 'idle':
        return 'Acquiring GPS signal...';
      case 'ready':
        return 'GPS ready - tap ARM when ready';
      case 'armed':
        if (!isAccelerometerAvailable) {
          return 'Accelerometer unavailable';
        }
        if (isTooFastToStart) {
          return 'Slow down to start - must be below 3 mph';
        }
        return 'Accelerate to start timer';
      case 'running':
        return 'Timer running';
      case 'completed':
        return 'Run complete';
      default:
        return '';
    }
  };

  const getSubMessage = () => {
    if (status === 'armed' && isAccelerometerAvailable) {
      const gForce = currentAcceleration.toFixed(2);
      return `Current: ${gForce}G`;
    }
    return null;
  };

  const message = getMessage();
  const subMessage = getSubMessage();

  if (!message) return null;

  const isWarning = status === 'armed' && isTooFastToStart;

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.message,
          status === 'armed' && !isWarning && styles.armedMessage,
          isWarning && styles.warningMessage,
          animatedStyle,
        ]}
      >
        {message}
      </Animated.Text>
      {subMessage && !isWarning && (
        <Text style={styles.subMessage}>{subMessage}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  message: {
    fontSize: 14,
    color: COLORS.dark.textSecondary,
    textAlign: 'center',
  },
  armedMessage: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  warningMessage: {
    color: COLORS.dark.warning,
    fontSize: 14,
    fontWeight: '500',
  },
  subMessage: {
    fontSize: 12,
    color: COLORS.dark.textSecondary,
    marginTop: 4,
  },
});
