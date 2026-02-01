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
}

export function LaunchStatus({
  status,
  currentAcceleration,
  isAccelerometerAvailable,
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
        return 'Preparing sensors...';
      case 'armed':
        if (!isAccelerometerAvailable) {
          return 'Accelerometer unavailable';
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

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.message,
          status === 'armed' && styles.armedMessage,
          animatedStyle,
        ]}
      >
        {message}
      </Animated.Text>
      {subMessage && (
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
  subMessage: {
    fontSize: 12,
    color: COLORS.dark.textSecondary,
    marginTop: 4,
  },
});
