import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from './constants';
import { resolveUsernames } from '../services/mentionService';

const MENTION_REGEX = /@([a-zA-Z0-9_]{5,})/g;

export function parseMentions(text: string): string[] {
  const mentions: string[] = [];
  let match;
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    const username = match[1].toLowerCase();
    if (!mentions.includes(username)) {
      mentions.push(username);
    }
  }
  return mentions;
}

interface MentionTextProps {
  children: string;
  style?: any;
  isDark?: boolean;
}

export function MentionText({ children, style, isDark = true }: MentionTextProps) {
  const router = useRouter();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const [usernameMap, setUsernameMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const usernames = parseMentions(children);
    if (usernames.length > 0) {
      resolveUsernames(usernames).then(setUsernameMap).catch(() => {});
    }
  }, [children]);

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  const regex = new RegExp(MENTION_REGEX.source, 'g');

  while ((match = regex.exec(children)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(
        <Text key={`text-${lastIndex}`} style={[style, { color: colors.text }]}>
          {children.slice(lastIndex, match.index)}
        </Text>
      );
    }

    const username = match[1].toLowerCase();
    const userId = usernameMap.get(username);

    parts.push(
      <Text
        key={`mention-${match.index}`}
        style={[style, styles.mention]}
        onPress={
          userId
            ? () => router.push(`/user/${userId}`)
            : undefined
        }
      >
        @{match[1]}
      </Text>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < children.length) {
    parts.push(
      <Text key={`text-${lastIndex}`} style={[style, { color: colors.text }]}>
        {children.slice(lastIndex)}
      </Text>
    );
  }

  if (parts.length === 0) {
    return <Text style={[style, { color: colors.text }]}>{children}</Text>;
  }

  return <Text>{parts}</Text>;
}

const styles = StyleSheet.create({
  mention: {
    color: COLORS.accent,
    fontWeight: '600',
  },
});
