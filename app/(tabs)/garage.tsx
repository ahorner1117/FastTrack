import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Warehouse } from 'lucide-react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function GarageScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Warehouse color={colors.tint} size={64} />
      <Text style={[styles.title, { color: colors.text }]}>Garage</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Your vehicles will appear here
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
  },
});
