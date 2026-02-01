import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { VehicleImage } from '@/src/components/Garage';
import { useVehicleStore } from '@/src/stores/vehicleStore';
import { COLORS, VEHICLE_UPGRADES } from '@/src/utils/constants';

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const vehicle = useVehicleStore((state) => state.getVehicleById(id));
  const deleteVehicle = useVehicleStore((state) => state.deleteVehicle);

  if (!vehicle) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Vehicle not found
        </Text>
      </View>
    );
  }

  const handleEdit = () => {
    router.push(`/vehicles/edit/${id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete "${vehicle.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteVehicle(id);
            router.back();
          },
        },
      ]
    );
  };

  const upgradeLabels = vehicle.upgrades
    .map((u) => VEHICLE_UPGRADES.find((v) => v.value === u)?.label)
    .filter(Boolean);

  return (
    <>
      <Stack.Screen
        options={{
          title: vehicle.name,
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
                <Pencil color={colors.tint} size={20} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                <Trash2 color={COLORS.dark.error} size={20} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.imageSection}>
          <VehicleImage photoUri={vehicle.photoUri} size={160} isDark={isDark} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            VEHICLE INFO
          </Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Year
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {vehicle.year}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Make
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {vehicle.make}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Model
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {vehicle.model}
            </Text>
          </View>
        </View>

        {upgradeLabels.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              UPGRADES
            </Text>
            <View style={styles.upgradesList}>
              {upgradeLabels.map((label, index) => (
                <View
                  key={index}
                  style={[
                    styles.upgradeChip,
                    { backgroundColor: COLORS.accent },
                  ]}
                >
                  <Text style={styles.upgradeChipText}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {vehicle.notes && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              NOTES
            </Text>
            <Text style={[styles.notesText, { color: colors.text }]}>
              {vehicle.notes}
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  upgradesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  upgradeChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  upgradeChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000000',
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
});
