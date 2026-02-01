import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Car } from 'lucide-react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { VehicleCard } from '@/src/components/Garage';
import { useVehicleStore } from '@/src/stores/vehicleStore';
import { COLORS } from '@/src/utils/constants';

export default function GarageScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const vehicles = useVehicleStore((state) => state.vehicles);

  const handleAddVehicle = () => {
    router.push('/vehicles/add');
  };

  const handleVehiclePress = (id: string) => {
    router.push(`/vehicles/${id}`);
  };

  if (vehicles.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Car color={colors.tint} size={64} />
          <Text style={[styles.title, { color: colors.text }]}>Garage</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your vehicles will appear here
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: COLORS.accent }]}
            onPress={handleAddVehicle}
            activeOpacity={0.8}
          >
            <Plus color="#000000" size={20} />
            <Text style={styles.addButtonText}>Add Vehicle</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VehicleCard
            vehicle={item}
            onPress={() => handleVehiclePress(item.id)}
            isDark={isDark}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <TouchableOpacity
            style={[styles.addCard, { backgroundColor: colors.surface }]}
            onPress={handleAddVehicle}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.addIconContainer,
                { backgroundColor: COLORS.accent },
              ]}
            >
              <Plus color="#000000" size={24} />
            </View>
            <Text style={[styles.addCardText, { color: colors.text }]}>
              Add Vehicle
            </Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginTop: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  listContent: {
    paddingVertical: 12,
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    gap: 12,
  },
  addIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCardText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
