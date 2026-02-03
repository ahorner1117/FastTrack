import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { COLORS } from '@/src/utils/constants';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  isDark: boolean;
}

export function PasswordInput({ isDark, style, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        secureTextEntry={!isVisible}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
          },
          style,
        ]}
        placeholderTextColor={colors.textSecondary}
      />
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setIsVisible(!isVisible)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {isVisible ? (
          <EyeOff color={colors.textSecondary} size={20} />
        ) : (
          <Eye color={colors.textSecondary} size={20} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 48,
    fontSize: 16,
  },
  toggleButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
});
