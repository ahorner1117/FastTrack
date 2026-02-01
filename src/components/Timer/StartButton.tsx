import React from 'react';
import { StyleSheet, Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  cancelAnimation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../utils/constants';
import type { TimerState } from '../../types';

interface StartButtonProps {
  status: TimerState['status'];
  isGpsReady: boolean;
  hapticEnabled: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function StartButton({
  status,
  isGpsReady,
  hapticEnabled,
  onPress,
}: StartButtonProps) {
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  // Pulse animation when armed
  React.useEffect(() => {
    if (status === 'armed') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1);
    }

    // Cleanup: cancel animations on unmount to prevent memory leaks
    return () => {
      cancelAnimation(pulseScale);
      cancelAnimation(scale);
    };
  }, [status, pulseScale, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * pulseScale.value },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    if (hapticEnabled) {
      if (status === 'idle' || status === 'ready') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (status === 'running' || status === 'armed') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
    onPress();
  };

  const getButtonConfig = () => {
    switch (status) {
      case 'idle':
        return {
          text: 'Waiting for GPS',
          backgroundColor: COLORS.dark.surface,
          textColor: COLORS.dark.textSecondary,
          disabled: true,
        };
      case 'ready':
        if (!isGpsReady) {
          return {
            text: 'Waiting for GPS',
            backgroundColor: COLORS.dark.surface,
            textColor: COLORS.dark.textSecondary,
            disabled: true,
          };
        }
        return {
          text: 'START',
          backgroundColor: COLORS.accent,
          textColor: '#000000',
          disabled: false,
        };
      case 'armed':
        return {
          text: 'GO!',
          backgroundColor: COLORS.accentDim,
          textColor: '#000000',
          disabled: false,
        };
      case 'running':
        return {
          text: 'STOP',
          backgroundColor: COLORS.dark.error,
          textColor: COLORS.dark.text,
          disabled: false,
        };
      case 'completed':
        return {
          text: 'RESET',
          backgroundColor: COLORS.dark.surface,
          textColor: COLORS.dark.text,
          disabled: false,
        };
      default:
        return {
          text: 'START',
          backgroundColor: COLORS.accent,
          textColor: '#000000',
          disabled: false,
        };
    }
  };

  const config = getButtonConfig();

  return (
    <AnimatedPressable
      style={[
        styles.button,
        { backgroundColor: config.backgroundColor },
        config.disabled && styles.disabled,
        animatedStyle,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={config.disabled}
    >
      <Text style={[styles.text, { color: config.textColor }]}>
        {config.text}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 20,
    paddingHorizontal: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
