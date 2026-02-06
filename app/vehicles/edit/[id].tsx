import React from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import { VehicleForm } from '@/src/components/Garage';
import { useVehicleStore } from '@/src/stores/vehicleStore';
import { pickImage } from '@/src/utils/imagePicker';
import {
  uploadVehicleImage,
  isSupabaseUrl,
} from '@/src/services/imageService';
import { syncVehicleToCloud } from '@/src/services/syncService';
import type { VehicleUpgrade, VehicleType } from '@/src/types';

export default function EditVehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const vehicle = useVehicleStore((state) => state.getVehicleById(id));
  const updateVehicle = useVehicleStore((state) => state.updateVehicle);

  const [photoUri, setPhotoUri] = React.useState<string | undefined>(
    vehicle?.photoUri
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!vehicle) {
    router.back();
    return null;
  }

  const handlePickImage = async () => {
    const result = await pickImage();
    if (result) {
      setPhotoUri(result.uri);
    }
  };

  const handleRemoveImage = () => {
    setPhotoUri(undefined);
  };

  const handleSubmit = async (data: {
    type: VehicleType;
    year: string;
    make: string;
    model: string;
    photoUri?: string;
    upgrades: VehicleUpgrade[];
    notes: string;
  }) => {
    const year = parseInt(data.year, 10);

    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 2) {
      Alert.alert('Invalid Year', 'Please enter a valid vehicle year.');
      return;
    }

    setIsSubmitting(true);

    let finalPhotoUri = photoUri;

    // Upload image to Supabase if we have a new local image
    if (photoUri && !isSupabaseUrl(photoUri)) {
      const { url, error } = await uploadVehicleImage(photoUri, id);
      if (error) {
        setIsSubmitting(false);
        if (error.type === 'not_authenticated') {
          // Save locally if not authenticated
          finalPhotoUri = photoUri;
        } else {
          Alert.alert('Image Upload Failed', error.message);
          return;
        }
      } else if (url) {
        finalPhotoUri = url;
      }
    }

    updateVehicle(id, {
      name: `${data.year} ${data.make} ${data.model}`,
      type: data.type,
      year,
      make: data.make.trim(),
      model: data.model.trim(),
      photoUri: finalPhotoUri,
      upgrades: data.upgrades,
      notes: data.notes.trim() || undefined,
    });

    // Sync updated vehicle to cloud
    const updatedVehicle = useVehicleStore.getState().getVehicleById(id);
    if (updatedVehicle) {
      syncVehicleToCloud(updatedVehicle).catch((err) =>
        console.error('Failed to sync updated vehicle:', err)
      );
    }

    setIsSubmitting(false);
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Vehicle',
        }}
      />
      <VehicleForm
        initialData={{
          type: vehicle.type ?? 'car',
          year: vehicle.year.toString(),
          make: vehicle.make,
          model: vehicle.model,
          photoUri: photoUri,
          upgrades: vehicle.upgrades,
          notes: vehicle.notes ?? '',
        }}
        onSubmit={handleSubmit}
        onPickImage={handlePickImage}
        onRemoveImage={handleRemoveImage}
        isDark={isDark}
        submitLabel="Save Changes"
        isSubmitting={isSubmitting}
      />
    </>
  );
}
