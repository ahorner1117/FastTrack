import React from 'react';
import { StyleSheet, View, TextInput, Pressable } from 'react-native';
import { Search, X } from 'lucide-react-native';
import Colors from '@/constants/Colors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  placeholder?: string;
  isDark: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  onClear,
  placeholder = 'Search users or vehicles...',
  isDark,
}: SearchBarProps) {
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface }]}
    >
      <Search color={colors.textSecondary} size={18} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable onPress={onClear} hitSlop={8}>
          <X color={colors.textSecondary} size={18} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
});
