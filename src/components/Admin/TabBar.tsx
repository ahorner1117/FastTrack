import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { COLORS } from '@/src/utils/constants';

export type AdminTab = 'profile' | 'runs' | 'vehicles' | 'posts';

interface TabBarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  isDark: boolean;
}

export function TabBar({ activeTab, onTabChange, isDark }: TabBarProps) {
  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'runs', label: 'Runs' },
    { id: 'vehicles', label: 'Vehicles' },
    { id: 'posts', label: 'Posts' },
  ];

  const textColor = isDark ? COLORS.dark.text : '#000000';
  const secondaryColor = isDark ? COLORS.dark.textSecondary : '#666666';
  const borderColor = isDark ? COLORS.dark.border : '#E0E0E0';

  return (
    <View style={[styles.container, { borderBottomColor: borderColor }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.tab}
          onPress={() => onTabChange(tab.id)}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === tab.id ? COLORS.accent : secondaryColor,
              },
            ]}
          >
            {tab.label}
          </Text>
          {activeTab === tab.id && (
            <View
              style={[
                styles.activeIndicator,
                { backgroundColor: COLORS.accent },
              ]}
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
});
