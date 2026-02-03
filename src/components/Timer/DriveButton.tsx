import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Play, Pause, Square, RotateCcw } from 'lucide-react-native';
import { COLORS } from '../../utils/constants';
import type { DriveStatus } from '../../hooks/useDriveTracker';

interface DriveButtonProps {
  status: DriveStatus;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function DriveButton({
  status,
  onStart,
  onPause,
  onStop,
  onReset,
}: DriveButtonProps) {
  if (status === 'idle') {
    return (
      <View style={styles.container}>
        <View style={[styles.button, styles.buttonDisabled]}>
          <Text style={styles.buttonTextDisabled}>Waiting for GPS</Text>
        </View>
      </View>
    );
  }

  if (status === 'ready') {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.button, styles.buttonStart]}
          onPress={onStart}
          activeOpacity={0.7}
        >
          <Play size={24} color="#000000" fill="#000000" />
          <Text style={styles.buttonTextDark}>Start Drive</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'tracking') {
    return (
      <View style={styles.container}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.buttonSmall, styles.buttonPause]}
            onPress={onPause}
            activeOpacity={0.7}
          >
            <Pause size={20} color={COLORS.dark.text} />
            <Text style={styles.buttonTextLight}>Pause</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonSmall, styles.buttonStop]}
            onPress={onStop}
            activeOpacity={0.7}
          >
            <Square size={20} color={COLORS.dark.text} fill={COLORS.dark.text} />
            <Text style={styles.buttonTextLight}>Stop</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (status === 'paused') {
    return (
      <View style={styles.container}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.buttonSmall, styles.buttonResume]}
            onPress={onStart}
            activeOpacity={0.7}
          >
            <Play size={20} color="#000000" fill="#000000" />
            <Text style={styles.buttonTextDark}>Resume</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonSmall, styles.buttonStop]}
            onPress={onStop}
            activeOpacity={0.7}
          >
            <Square size={20} color={COLORS.dark.text} fill={COLORS.dark.text} />
            <Text style={styles.buttonTextLight}>Stop</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (status === 'completed') {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.button, styles.buttonReset]}
          onPress={onReset}
          activeOpacity={0.7}
        >
          <RotateCcw size={24} color={COLORS.dark.text} />
          <Text style={styles.buttonTextLight}>New Drive</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  buttonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 130,
  },
  buttonDisabled: {
    backgroundColor: COLORS.dark.surface,
    opacity: 0.6,
  },
  buttonStart: {
    backgroundColor: COLORS.accent,
  },
  buttonPause: {
    backgroundColor: COLORS.dark.surfaceElevated,
  },
  buttonResume: {
    backgroundColor: COLORS.accent,
  },
  buttonStop: {
    backgroundColor: COLORS.dark.error,
  },
  buttonReset: {
    backgroundColor: COLORS.dark.surface,
  },
  buttonTextDark: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  buttonTextLight: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark.text,
  },
  buttonTextDisabled: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark.textSecondary,
  },
});
