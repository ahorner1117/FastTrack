import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Globe, Users } from 'lucide-react-native';
import { COLORS } from '@/src/utils/constants';
import type { FeedScope } from '@/src/services/postsService';

interface FeedScopeToggleProps {
  scope: FeedScope;
  onScopeChange: (scope: FeedScope) => void;
  isDark: boolean;
}

export function FeedScopeToggle({
  scope,
  onScopeChange,
  isDark,
}: FeedScopeToggleProps) {
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.button,
          {
            backgroundColor:
              scope === 'global'
                ? COLORS.accent
                : isDark
                ? COLORS.dark.surface
                : COLORS.light.surface,
          },
        ]}
        onPress={() => onScopeChange('global')}
      >
        <Globe
          color={scope === 'global' ? '#000000' : colors.text}
          size={18}
        />
      </Pressable>
      <Pressable
        style={[
          styles.button,
          {
            backgroundColor:
              scope === 'friends'
                ? COLORS.accent
                : isDark
                ? COLORS.dark.surface
                : COLORS.light.surface,
          },
        ]}
        onPress={() => onScopeChange('friends')}
      >
        <Users
          color={scope === 'friends' ? '#000000' : colors.text}
          size={18}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
