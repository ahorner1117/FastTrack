import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Send } from 'lucide-react-native';
import { COLORS } from '@/src/utils/constants';

interface CommentInputProps {
  isDark: boolean;
  onSubmit: (content: string) => Promise<void>;
}

export function CommentInput({ isDark, onSubmit }: CommentInputProps) {
  const colors = isDark ? COLORS.dark : COLORS.light;
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(trimmed);
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = content.trim().length > 0 && !isSubmitting;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surfaceElevated }]}
    >
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            color: colors.text,
          },
        ]}
        placeholder="Add a comment..."
        placeholderTextColor={colors.textSecondary}
        value={content}
        onChangeText={setContent}
        multiline
        maxLength={500}
        editable={!isSubmitting}
      />
      <Pressable
        style={[
          styles.sendButton,
          {
            backgroundColor: canSubmit ? COLORS.accent : colors.surface,
          },
        ]}
        onPress={handleSubmit}
        disabled={!canSubmit}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <Send color={canSubmit ? '#000000' : colors.textSecondary} size={18} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
