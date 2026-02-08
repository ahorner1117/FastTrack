import React from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
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

export default function AddVehicleScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const addVehicle = useVehicleStore((state) => state.addVehicle);

  const [photoUri, setPhotoUri] = React.useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
    trim: string;
    photoUri?: string;
    upgrades: VehicleUpgrade[];
    notes: string;
  }) => {
    const now = Date.now();
    const year = parseInt(data.year, 10);

    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 2) {
      Alert.alert('Invalid Year', 'Please enter a valid vehicle year.');
      return;
    }

    setIsSubmitting(true);

    const vehicleId = `vehicle_${now}`;
    let finalPhotoUri = photoUri;

    // Upload image to Supabase if we have a local image
    if (photoUri && !isSupabaseUrl(photoUri)) {
      const { url, error } = await uploadVehicleImage(photoUri, vehicleId);
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

    const trimmed = data.trim?.trim();
    const vehicle = {
      id: vehicleId,
      name: `${data.year} ${data.make} ${data.model}${trimmed ? ' ' + trimmed : ''}`,
      type: data.type,
      year,
      make: data.make.trim(),
      model: data.model.trim(),
      trim: trimmed || undefined,
      photoUri: finalPhotoUri,
      upgrades: data.upgrades,
      notes: data.notes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    addVehicle(vehicle);
    syncVehicleToCloud(vehicle).catch((err) =>
      console.error('Failed to sync new vehicle:', err)
    );
    setIsSubmitting(false);
    router.back();
  };

  return (
    <VehicleForm
      initialData={{ photoUri }}
      onSubmit={handleSubmit}
      onPickImage={handlePickImage}
      onRemoveImage={handleRemoveImage}
      isDark={isDark}
      submitLabel="Add Vehicle"
      isSubmitting={isSubmitting}
    />
  );
}
