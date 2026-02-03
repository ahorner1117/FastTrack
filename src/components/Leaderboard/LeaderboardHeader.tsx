import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { COLORS } from '@/src/utils/constants';
import type { LeaderboardCategory } from '@/src/types';

interface LeaderboardHeaderProps {
  selectedCategory: LeaderboardCategory;
  onSelectCategory: (category: LeaderboardCategory) => void;
  isDark: boolean;
}

const CATEGORIES: { value: LeaderboardCategory; label: string }[] = [
  { value: 'zero_to_sixty', label: '0-60' },
  { value: 'zero_to_hundred', label: '0-100' },
  { value: 'quarter_mile', label: '1/4 Mile' },
  { value: 'half_mile', label: '1/2 Mile' },
];

export function LeaderboardHeader({
  selectedCategory,
  onSelectCategory,
  isDark,
}: LeaderboardHeaderProps) {
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((category) => {
          const isSelected = category.value === selectedCategory;
          return (
            <Pressable
              key={category.value}
              style={[
                styles.tab,
                {
                  backgroundColor: isSelected
                    ? COLORS.accent
                    : colors.surface,
                },
              ]}
              onPress={() => onSelectCategory(category.value)}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isSelected ? '#000000' : colors.text,
                    fontWeight: isSelected ? '600' : '400',
                  },
                ]}
              >
                {category.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tabText: {
    fontSize: 14,
  },
});
