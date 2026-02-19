import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { COLORS } from '@/src/utils/constants';

export function GuestBanner() {
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  if (dismissed) return null;

  return (
    <TouchableOpacity
      style={styles.banner}
      onPress={() => router.push('/(auth)/sign-up' as any)}
      activeOpacity={0.8}
    >
      <Text style={styles.bannerText}>
        Create an account to sync your data across devices
      </Text>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={(e) => {
          e.stopPropagation();
          setDismissed(true);
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <X color="#000000" size={16} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
  },
  bannerText: {
    flex: 1,
    color: '#000000',
    fontSize: 13,
    fontWeight: '500',
  },
  closeButton: {
    marginLeft: 8,
    padding: 2,
  },
});
