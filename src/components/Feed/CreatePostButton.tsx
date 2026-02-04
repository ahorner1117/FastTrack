import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';
import { COLORS } from '@/src/utils/constants';

interface CreatePostButtonProps {
  onPress: () => void;
}

export function CreatePostButton({ onPress }: CreatePostButtonProps) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Plus color="#000000" size={28} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
