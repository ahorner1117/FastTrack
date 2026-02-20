import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  Pressable,
} from 'react-native';
import { Car } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import type { CloudVehicle, Vehicle } from '@/src/types';

interface VehicleShowcaseProps {
  vehicles: (Vehicle | CloudVehicle)[];
  isDark: boolean;
  onVehiclePress?: (vehicle: Vehicle | CloudVehicle) => void;
}

export function VehicleShowcase({
  vehicles,
  isDark,
  onVehiclePress,
}: VehicleShowcaseProps) {
  const colors = Colors[isDark ? 'dark' : 'light'];

  if (vehicles.length === 0) return null;

  const getPhotoUri = (vehicle: Vehicle | CloudVehicle): string | null | undefined => {
    if ('photoUri' in vehicle) return (vehicle as Vehicle).thumbnailUri || vehicle.photoUri;
    if ('photo_uri' in vehicle) return (vehicle as CloudVehicle).thumbnail_url || vehicle.photo_uri;
    return null;
  };

  const renderItem = ({
    item,
  }: {
    item: Vehicle | CloudVehicle;
  }) => {
    const photoUri = getPhotoUri(item);

    return (
      <Pressable
        style={[styles.vehicleCard, { backgroundColor: colors.surface }]}
        onPress={() => onVehiclePress?.(item)}
      >
        {photoUri ? (
          <Image source={{ uri: photoUri, cache: 'force-cache' }} style={styles.vehicleImage} />
        ) : (
          <View
            style={[
              styles.vehicleImage,
              styles.vehiclePlaceholder,
              { backgroundColor: colors.surfaceElevated },
            ]}
          >
            <Car color={colors.textSecondary} size={24} />
          </View>
        )}
        <Text
          style={[styles.vehicleName, { color: colors.text }]}
          numberOfLines={1}
        >
          {item.year} {item.make}
        </Text>
        <Text
          style={[styles.vehicleModel, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {item.model}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        VEHICLES
      </Text>
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginLeft: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  vehicleCard: {
    width: 120,
    borderRadius: 12,
    overflow: 'hidden',
  },
  vehicleImage: {
    width: 120,
    height: 90,
  },
  vehiclePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleName: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  vehicleModel: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
});
