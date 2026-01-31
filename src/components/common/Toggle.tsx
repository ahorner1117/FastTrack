import React from 'react';
import { Switch, Platform } from 'react-native';
import { COLORS } from '../../utils/constants';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  isDark?: boolean;
}

export function Toggle({
  value,
  onValueChange,
  disabled = false,
  isDark = true,
}: ToggleProps) {
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{
        false: colors.border,
        true: COLORS.accent,
      }}
      thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
      ios_backgroundColor={colors.border}
    />
  );
}
