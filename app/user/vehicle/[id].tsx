import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { VehicleImage } from '@/src/components/Garage';
import { supabase } from '@/src/lib/supabase';
import { COLORS, VEHICLE_UPGRADES, VEHICLE_TYPES } from '@/src/utils/constants';
import type { CloudVehicle } from '@/src/types';

export default function UserVehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [vehicle, setVehicle] = useState<CloudVehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', id)
          .single();
        if (fetchError) throw fetchError;
        setVehicle(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load vehicle');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerLeft: () => (
              <Pressable onPress={() => router.back()} hitSlop={8}>
                <ChevronLeft color={colors.text} size={28} />
              </Pressable>
            ),
          }}
        />
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </>
    );
  }

  if (error || !vehicle) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Vehicle',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerLeft: () => (
              <Pressable onPress={() => router.back()} hitSlop={8}>
                <ChevronLeft color={colors.text} size={28} />
              </Pressable>
            ),
          }}
        />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error || 'Vehicle not found'}
          </Text>
        </View>
      </>
    );
  }

  const upgradeLabels = (vehicle.upgrades ?? [])
    .map((u) => VEHICLE_UPGRADES.find((v) => v.value === u)?.label)
    .filter(Boolean);

  const vehicleTypeLabel =
    VEHICLE_TYPES.find((t) => t.value === vehicle.type)?.label ?? 'Car';

  return (
    <>
      <Stack.Screen
        options={{
          title: vehicle.name,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <ChevronLeft color={colors.text} size={28} />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.imageSection}>
          <VehicleImage
            photoUri={vehicle.photo_uri ?? undefined}
            size={160}
            isDark={isDark}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            VEHICLE INFO
          </Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Type
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {vehicleTypeLabel}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
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
          {vehicle.trim ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  Trim
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {vehicle.trim}
                </Text>
              </View>
            </>
          ) : null}
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
                  style={[styles.upgradeChip, { backgroundColor: COLORS.accent }]}
                >
                  <Text style={styles.upgradeChipText}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {vehicle.notes ? (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              NOTES
            </Text>
            <Text style={[styles.notesText, { color: colors.text }]}>
              {vehicle.notes}
            </Text>
          </View>
        ) : null}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});
