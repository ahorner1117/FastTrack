import { supabase } from '../lib/supabase';
import { decode } from 'base64-arraybuffer';
import {
  readAsStringAsync,
  getInfoAsync,
  EncodingType,
} from 'expo-file-system/legacy';

const VEHICLE_IMAGES_BUCKET = 'vehicle-images';
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const TARGET_SIZE = 1200; // Max width/height after compression

export interface ImageUploadError {
  type: 'size_exceeded' | 'upload_failed' | 'not_authenticated';
  message: string;
}

export async function compressImage(uri: string): Promise<string> {
  // Skip compression - requires native rebuild
  // To enable: npx expo prebuild --clean && npx expo run:ios
  return uri;
}

export async function getFileSize(uri: string): Promise<number> {
  const info = await getInfoAsync(uri);
  return info.exists && 'size' in info ? info.size : 0;
}

export async function uploadVehicleImage(
  localUri: string,
  vehicleId: string
): Promise<{ url: string | null; error: ImageUploadError | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      url: null,
      error: { type: 'not_authenticated', message: 'User not authenticated' },
    };
  }

  try {
    // Check original file size
    const originalSize = await getFileSize(localUri);
    if (originalSize > MAX_FILE_SIZE_BYTES) {
      return {
        url: null,
        error: {
          type: 'size_exceeded',
          message: 'Image exceeds 15MB limit. Please select a smaller image.',
        },
      };
    }

    // Try to compress the image
    let finalUri = localUri;
    let wasCompressed = false;
    try {
      const compressedUri = await compressImage(localUri);
      if (compressedUri !== localUri) {
        finalUri = compressedUri;
        wasCompressed = true;
      }
    } catch (e) {
      console.log('Compression skipped:', e);
    }

    // Verify final size
    const finalSize = await getFileSize(finalUri);
    if (finalSize > MAX_FILE_SIZE_BYTES) {
      return {
        url: null,
        error: {
          type: 'size_exceeded',
          message: 'Image is too large. Please select a smaller image.',
        },
      };
    }

    // Read file as base64
    const base64 = await readAsStringAsync(finalUri, {
      encoding: EncodingType.Base64,
    });

    // Determine file extension and content type
    const fileExt = wasCompressed ? 'jpg' : (localUri.split('.').pop()?.toLowerCase() || 'jpg');
    const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
    const fileName = `${user.id}/${vehicleId}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(VEHICLE_IMAGES_BUCKET)
      .upload(fileName, decode(base64), {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('Error uploading image:', error);
      return {
        url: null,
        error: { type: 'upload_failed', message: error.message },
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(VEHICLE_IMAGES_BUCKET).getPublicUrl(data.path);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Failed to upload vehicle image:', error);
    return {
      url: null,
      error: {
        type: 'upload_failed',
        message: error instanceof Error ? error.message : 'Upload failed',
      },
    };
  }
}

export async function deleteVehicleImage(vehicleId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  try {
    // Try to delete common image extensions
    const extensions = ['jpg', 'jpeg', 'png', 'heic', 'webp'];
    const filePaths = extensions.map((ext) => `${user.id}/${vehicleId}.${ext}`);

    const { error } = await supabase.storage
      .from(VEHICLE_IMAGES_BUCKET)
      .remove(filePaths);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete vehicle image:', error);
    return false;
  }
}

export function isSupabaseUrl(uri: string | undefined): boolean {
  if (!uri) return false;
  return uri.includes('supabase');
}
