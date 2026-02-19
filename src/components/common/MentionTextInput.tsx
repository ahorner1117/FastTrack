import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  Pressable,
  Image,
  StyleSheet,
  type TextInputProps,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
} from 'react-native';
import { User } from 'lucide-react-native';
import { COLORS } from '@/src/utils/constants';
import { searchUsers } from '@/src/services/searchService';
import type { UserSearchResult } from '@/src/types';

interface MentionTextInputProps extends Omit<TextInputProps, 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
  isDark: boolean;
}

export function MentionTextInput({
  value,
  onChangeText,
  isDark,
  style,
  ...rest
}: MentionTextInputProps) {
  const colors = isDark ? COLORS.dark : COLORS.light;
  const [suggestions, setSuggestions] = useState<UserSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const cursorPosition = useRef(0);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelectionChange = useCallback(
    (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      cursorPosition.current = e.nativeEvent.selection.start;
    },
    []
  );

  const findMentionQuery = useCallback((text: string, cursor: number) => {
    // Look backward from cursor to find @
    let i = cursor - 1;
    while (i >= 0) {
      const char = text[i];
      if (char === '@') {
        const query = text.slice(i + 1, cursor);
        // Only trigger if @ is at start of text or preceded by whitespace
        if (i === 0 || /\s/.test(text[i - 1])) {
          return { query, startIndex: i };
        }
        return null;
      }
      if (/\s/.test(char)) return null;
      i--;
    }
    return null;
  }, []);

  const handleChangeText = useCallback(
    (text: string) => {
      onChangeText(text);

      // Use the approximate cursor position (end of text for new input)
      const cursor = cursorPosition.current <= text.length
        ? Math.max(cursorPosition.current, text.length - (value.length - cursorPosition.current))
        : text.length;

      const mention = findMentionQuery(text, cursor);

      if (mention && mention.query.length >= 1) {
        setMentionQuery(mention.query);
        setMentionStartIndex(mention.startIndex);

        // Debounce search
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(async () => {
          try {
            const results = await searchUsers(mention.query, 5);
            setSuggestions(results);
            setShowSuggestions(results.length > 0);
          } catch {
            setShowSuggestions(false);
          }
        }, 200);
      } else {
        setShowSuggestions(false);
        setSuggestions([]);
        setMentionStartIndex(-1);
      }
    },
    [onChangeText, value, findMentionQuery]
  );

  const handleSelectUser = useCallback(
    (user: UserSearchResult) => {
      if (mentionStartIndex < 0 || !user.username) return;

      const before = value.slice(0, mentionStartIndex);
      const after = value.slice(mentionStartIndex + 1 + mentionQuery.length);
      const newText = `${before}@${user.username} ${after}`;
      onChangeText(newText);
      setShowSuggestions(false);
      setSuggestions([]);
      setMentionStartIndex(-1);
    },
    [value, mentionStartIndex, mentionQuery, onChangeText]
  );

  return (
    <View style={styles.wrapper}>
      {showSuggestions && suggestions.length > 0 && (
        <View style={[styles.suggestionsContainer, { backgroundColor: colors.surfaceElevated }]}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="always"
            renderItem={({ item }) => (
              <Pressable
                style={styles.suggestionItem}
                onPress={() => handleSelectUser(item)}
              >
                {item.avatar_url ? (
                  <Image source={{ uri: item.avatar_url }} style={styles.suggestionAvatar} />
                ) : (
                  <View style={[styles.suggestionAvatar, styles.suggestionAvatarPlaceholder, { backgroundColor: COLORS.accent }]}>
                    <User color="#000000" size={12} />
                  </View>
                )}
                <View style={styles.suggestionText}>
                  <Text style={[styles.suggestionName, { color: colors.text }]} numberOfLines={1}>
                    {item.display_name || 'FastTrack User'}
                  </Text>
                  {item.username && (
                    <Text style={[styles.suggestionUsername, { color: colors.textSecondary }]} numberOfLines={1}>
                      @{item.username}
                    </Text>
                  )}
                </View>
              </Pressable>
            )}
          />
        </View>
      )}
      <TextInput
        style={style}
        value={value}
        onChangeText={handleChangeText}
        onSelectionChange={handleSelectionChange}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  suggestionsContainer: {
    borderRadius: 12,
    marginBottom: 6,
    maxHeight: 200,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  suggestionAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  suggestionAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionText: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionUsername: {
    fontSize: 12,
    marginTop: 1,
  },
});
