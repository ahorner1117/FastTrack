import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckSquare, Square } from 'lucide-react-native';
import { COLORS } from '../../utils/constants';

interface CheckboxProps {
  checked: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
  isDark?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onValueChange,
  label,
  disabled = false,
  isDark = true,
}) => {
  const Icon = checked ? CheckSquare : Square;
  const iconColor = disabled
    ? COLORS.dark.textSecondary
    : isDark
    ? COLORS.accent
    : COLORS.dark.text;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => !disabled && onValueChange(!checked)}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <Icon size={20} color={iconColor} />
      <Text
        style={[
          styles.label,
          isDark && styles.labelDark,
          disabled && styles.labelDisabled,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 14,
    flex: 1,
  },
  labelDark: {
    color: COLORS.dark.text,
  },
  labelDisabled: {
    color: COLORS.dark.textSecondary,
  },
});
