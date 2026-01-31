import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS } from '../../utils/constants';

interface TimerDisplayProps {
  elapsedMs: number;
  isRunning: boolean;
}

export function TimerDisplay({ elapsedMs, isRunning }: TimerDisplayProps) {
  const formatElapsedTime = (ms: number): string => {
    if (ms < 0) return '0.000';

    const totalSeconds = ms / 1000;

    if (totalSeconds < 60) {
      return totalSeconds.toFixed(3);
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.time,
          { color: isRunning ? COLORS.accent : COLORS.dark.text },
        ]}
      >
        {formatElapsedTime(elapsedMs)}
      </Text>
      <Text style={styles.label}>sec</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    fontSize: 64,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  label: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.dark.textSecondary,
    marginTop: -4,
  },
});
