import React from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../utils/constants';

interface AutocompleteInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (item: string) => void;
  suggestions: string[];
  placeholder?: string;
  isDark?: boolean;
  loading?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export function AutocompleteInput({
  value,
  onChangeText,
  onSelect,
  suggestions,
  placeholder,
  isDark = true,
  loading = false,
  autoCapitalize = 'words',
}: AutocompleteInputProps) {
  const colors = isDark ? COLORS.dark : COLORS.light;
  const [focused, setFocused] = React.useState(false);

  const lowerValue = value?.toLowerCase() ?? '';
  const exactMatch = suggestions.some(
    (s) => s?.toLowerCase() === lowerValue
  );
  const showDropdown = focused && suggestions.length > 0 && !exactMatch && value.length >= 2;

  return (
    <View style={styles.wrapper}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.surfaceElevated, color: colors.text },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
        />
        {loading && (
          <ActivityIndicator
            size="small"
            color={colors.textSecondary}
            style={styles.spinner}
          />
        )}
      </View>
      {showDropdown && (
        <View
          style={[
            styles.dropdown,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
          ]}
        >
          <ScrollView
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {suggestions.map((item, index) => (
              <TouchableOpacity
                key={`${item}-${index}`}
                style={[styles.row, { borderBottomColor: colors.border }]}
                onPress={() => {
                  onSelect(item);
                  setFocused(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.rowText, { color: colors.text }]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 2,
    zIndex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    textAlign: 'right',
  },
  spinner: {
    position: 'absolute',
    right: 12,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
    maxHeight: 200,
    overflow: 'hidden',
  },
  list: {
    maxHeight: 200,
  },
  row: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    fontSize: 15,
    textAlign: 'right',
  },
});
