import { supabase } from '../lib/supabase';
import { decode } from 'base64-arraybuffer';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { compressImage, compressThumbnail, getFileSize } from '../utils/imageCompression';

const VEHICLE_IMAGES_BUCKET = 'vehicle-images';
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export interface ImageUploadError {
  type: 'size_exceeded' | 'upload_failed' | 'not_authenticated';
  message: string;
}

export { compressImage, getFileSize };

export async function uploadVehicleImage(
  localUri: string,
  vehicleId: string
): Promise<{ url: string | null; thumbnailUrl: string | null; error: ImageUploadError | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      url: null,
      thumbnailUrl: null,
      error: { type: 'not_authenticated', message: 'User not authenticated' },
    };
  }

  try {
    // Compress the image
    const compressedUri = await compressImage(localUri, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.8,
    });

    // Verify final size
    const finalSize = await getFileSize(compressedUri);
    if (finalSize > MAX_FILE_SIZE_BYTES) {
      return {
        url: null,
        thumbnailUrl: null,
        error: {
          type: 'size_exceeded',
          message: 'Image is too large. Please select a smaller image.',
        },
      };
    }

    // Read file as base64
    const base64 = await readAsStringAsync(compressedUri, {
      encoding: EncodingType.Base64,
    });

    // Always use jpg after compression
    const fileName = `${user.id}/${vehicleId}.jpg`;

    const { data, error } = await supabase.storage
      .from(VEHICLE_IMAGES_BUCKET)
      .upload(fileName, decode(base64), {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading image:', error);
      return {
        url: null,
        thumbnailUrl: null,
        error: { type: 'upload_failed', message: error.message },
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(VEHICLE_IMAGES_BUCKET).getPublicUrl(data.path);

    // Generate and upload thumbnail (best-effort)
    let thumbnailUrl: string | null = null;
    try {
      const thumbnailUri = await compressThumbnail(compressedUri);
      const thumbBase64 = await readAsStringAsync(thumbnailUri, {
        encoding: EncodingType.Base64,
      });

      const thumbFileName = `${user.id}/${vehicleId}_thumb.jpg`;

      const { data: thumbData, error: thumbError } = await supabase.storage
        .from(VEHICLE_IMAGES_BUCKET)
        .upload(thumbFileName, decode(thumbBase64), {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (thumbError) {
        console.warn('Thumbnail upload failed, continuing without thumbnail:', thumbError);
      } else {
        const {
          data: { publicUrl: thumbPublicUrl },
        } = supabase.storage.from(VEHICLE_IMAGES_BUCKET).getPublicUrl(thumbData.path);
        thumbnailUrl = thumbPublicUrl;
      }
    } catch (thumbErr) {
      console.warn('Thumbnail generation failed, continuing without thumbnail:', thumbErr);
    }

    return { url: publicUrl, thumbnailUrl, error: null };
  } catch (error) {
    console.error('Failed to upload vehicle image:', error);
    return {
      url: null,
      thumbnailUrl: null,
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
    // Try to delete common image extensions and their thumbnails
    const extensions = ['jpg', 'jpeg', 'png', 'heic', 'webp'];
    const filePaths = extensions.flatMap((ext) => [
      `${user.id}/${vehicleId}.${ext}`,
      `${user.id}/${vehicleId}_thumb.${ext}`,
    ]);

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
