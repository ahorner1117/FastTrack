import React from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import { VehicleForm } from '@/src/components/Garage';
import { useVehicleStore } from '@/src/stores/vehicleStore';
import { pickImage } from '@/src/utils/imagePicker';
import type { VehicleUpgrade } from '@/src/types';

export default function AddVehicleScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const addVehicle = useVehicleStore((state) => state.addVehicle);

  const [photoUri, setPhotoUri] = React.useState<string | undefined>();

  const handlePickImage = async () => {
    const result = await pickImage();
    if (result) {
      setPhotoUri(result.uri);
    }
  };

  const handleRemoveImage = () => {
    setPhotoUri(undefined);
  };

  const handleSubmit = (data: {
    year: string;
    make: string;
    model: string;
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

    const vehicle = {
      id: `vehicle_${now}`,
      name: `${data.year} ${data.make} ${data.model}`,
      year,
      make: data.make.trim(),
      model: data.model.trim(),
      photoUri: photoUri,
      upgrades: data.upgrades,
      notes: data.notes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    addVehicle(vehicle);
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
    />
  );
}
