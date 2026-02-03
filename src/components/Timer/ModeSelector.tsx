import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Zap, Route } from 'lucide-react-native';
import { COLORS } from '../../utils/constants';
import type { TimerMode } from '../../types';

interface ModeSelectorProps {
  mode: TimerMode;
  onModeChange: (mode: TimerMode) => void;
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.option, mode === 'acceleration' && styles.optionActive]}
        onPress={() => onModeChange('acceleration')}
        activeOpacity={0.7}
      >
        <Zap
          size={18}
          color={mode === 'acceleration' ? '#000000' : COLORS.dark.textSecondary}
        />
        <Text
          style={[
            styles.optionText,
            mode === 'acceleration' && styles.optionTextActive,
          ]}
        >
          Acceleration
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.option, mode === 'drive' && styles.optionActive]}
        onPress={() => onModeChange('drive')}
        activeOpacity={0.7}
      >
        <Route
          size={18}
          color={mode === 'drive' ? '#000000' : COLORS.dark.textSecondary}
        />
        <Text
          style={[
            styles.optionText,
            mode === 'drive' && styles.optionTextActive,
          ]}
        >
          Track Drive
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.dark.surface,
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  optionActive: {
    backgroundColor: COLORS.accent,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark.textSecondary,
  },
  optionTextActive: {
    color: '#000000',
  },
});
