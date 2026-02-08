import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { Car, Trash2 } from 'lucide-react-native';
import type { CloudVehicle } from '@/src/types';
import { COLORS } from '@/src/utils/constants';

interface VehicleListItemProps {
  vehicle: CloudVehicle;
  isDark: boolean;
  onDelete: (vehicleId: string) => void;
}

export function VehicleListItem({
  vehicle,
  isDark,
  onDelete,
}: VehicleListItemProps) {
  const textColor = isDark ? COLORS.dark.text : '#000000';
  const secondaryColor = isDark ? COLORS.dark.textSecondary : '#666666';
  const borderColor = isDark ? COLORS.dark.border : '#E0E0E0';

  const handleDelete = () => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to permanently delete "${vehicle.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(vehicle.id),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { borderBottomColor: borderColor }]}>
      <View style={styles.imageContainer}>
        {vehicle.photo_uri ? (
          <Image source={{ uri: vehicle.photo_uri }} style={styles.image} />
        ) : (
          <View
            style={[
              styles.imagePlaceholder,
              { backgroundColor: COLORS.accent + '30' },
            ]}
          >
            <Car size={24} color={COLORS.accent} />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={[styles.name, { color: textColor }]}>{vehicle.name}</Text>
        <Text style={[styles.details, { color: secondaryColor }]}>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </Text>
        {vehicle.upgrades && vehicle.upgrades.length > 0 && (
          <Text style={[styles.upgrades, { color: secondaryColor }]}>
            {vehicle.upgrades.length} upgrade{vehicle.upgrades.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: COLORS.error + '20' }]}
        onPress={handleDelete}
      >
        <Trash2 size={18} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  imageContainer: {
    marginRight: 12,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  details: {
    fontSize: 13,
    marginBottom: 2,
  },
  upgrades: {
    fontSize: 12,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});
