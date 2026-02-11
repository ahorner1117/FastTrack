import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Globe, Lock } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import type { PostVisibility } from '@/src/types';

interface VisibilityToggleProps {
  visibility: PostVisibility;
  onVisibilityChange: (visibility: PostVisibility) => void;
  isDark: boolean;
}

export function VisibilityToggle({
  visibility,
  onVisibilityChange,
  isDark,
}: VisibilityToggleProps) {
  const colors = Colors[isDark ? 'dark' : 'light'];

  const options: { value: PostVisibility; label: string; icon: typeof Globe }[] = [
    { value: 'public', label: 'Public', icon: Globe },
    { value: 'private', label: 'Friends', icon: Lock },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Visibility
      </Text>
      <View
        style={[
          styles.segmentedControl,
          { backgroundColor: isDark ? '#1A1A1A' : '#E5E5E5' },
        ]}
      >
        {options.map((option) => {
          const isSelected = option.value === visibility;
          const Icon = option.icon;
          return (
            <Pressable
              key={option.value}
              style={[
                styles.option,
                isSelected && { backgroundColor: colors.tint },
              ]}
              onPress={() => onVisibilityChange(option.value)}
            >
              <Icon
                color={isSelected ? '#000000' : colors.textSecondary}
                size={14}
              />
              <Text
                style={[
                  styles.optionText,
                  { color: isSelected ? '#000000' : colors.textSecondary },
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
  },
  optionText: {
    fontSize: 14,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
});
