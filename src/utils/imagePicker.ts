import { Alert } from 'react-native';

export interface PickImageResult {
  uri: string;
  width: number;
  height: number;
}

async function getImagePicker() {
  try {
    return await import('expo-image-picker');
  } catch {
    return null;
  }
}

export async function pickImage(): Promise<PickImageResult | null> {
  const ImagePicker = await getImagePicker();

  if (!ImagePicker) {
    Alert.alert(
      'Not Available',
      'Image picker is not available. Please rebuild the app with native modules.'
    );
    return null;
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Please allow access to your photo library to select a vehicle photo.'
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
  };
}

export async function takePhoto(): Promise<PickImageResult | null> {
  const ImagePicker = await getImagePicker();

  if (!ImagePicker) {
    Alert.alert(
      'Not Available',
      'Camera is not available. Please rebuild the app with native modules.'
    );
    return null;
  }

  const { status } = await ImagePicker.requestCameraPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Please allow access to your camera to take a vehicle photo.'
    );
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
  };
}
