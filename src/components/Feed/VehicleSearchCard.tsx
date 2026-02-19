import React from 'react';
import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { Car } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { COLORS } from '@/src/utils/constants';
import type { VehicleSearchResult } from '@/src/types';

interface VehicleSearchCardProps {
  vehicle: VehicleSearchResult;
  isDark: boolean;
  onPress: () => void;
}

export function VehicleSearchCard({ vehicle, isDark, onPress }: VehicleSearchCardProps) {
  const colors = Colors[isDark ? 'dark' : 'light'];
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const subtitle = vehicle.trim || '';

  return (
    <Pressable
      style={[styles.container, { backgroundColor: colors.surface }]}
      onPress={onPress}
    >
      {vehicle.photo_uri ? (
        <Image
          source={{ uri: vehicle.photo_uri }}
          style={styles.photo}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.photo,
            styles.photoPlaceholder,
            { backgroundColor: isDark ? '#2A2A2A' : '#E8E8E8' },
          ]}
        >
          <Car color={colors.textSecondary} size={20} />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {vehicle.owner_display_name || vehicle.owner_username ? (
          <Text style={[styles.owner, { color: colors.textSecondary }]} numberOfLines={1}>
            {vehicle.owner_display_name || `@${vehicle.owner_username}`}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  photo: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 1,
  },
  owner: {
    fontSize: 12,
    marginTop: 2,
  },
});
