import { supabase } from '../lib/supabase';
import { decode } from 'base64-arraybuffer';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { compressAvatar, getFileSize } from '../utils/imageCompression';

const AVATARS_BUCKET = 'avatars';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface AvatarUploadError {
  type: 'size_exceeded' | 'upload_failed' | 'not_authenticated';
  message: string;
}

export async function uploadAvatar(
  localUri: string
): Promise<{ url: string | null; error: AvatarUploadError | null }> {
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
    // Compress the image
    const compressedUri = await compressAvatar(localUri);

    // Check file size after compression
    const fileSize = await getFileSize(compressedUri);
    if (fileSize > MAX_FILE_SIZE_BYTES) {
      return {
        url: null,
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

    // Use user ID as filename with timestamp to bust cache
    const timestamp = Date.now();
    const fileName = `${user.id}/avatar-${timestamp}.jpg`;

    // Delete old avatars first
    try {
      const { data: existingFiles } = await supabase.storage
        .from(AVATARS_BUCKET)
        .list(user.id);

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map((f) => `${user.id}/${f.name}`);
        await supabase.storage.from(AVATARS_BUCKET).remove(filesToDelete);
      }
    } catch (e) {
      console.log('No existing avatars to delete');
    }

    // Upload new avatar
    const { data, error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(fileName, decode(base64), {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading avatar:', error);
      return {
        url: null,
        error: { type: 'upload_failed', message: error.message },
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(data.path);

    // Update profile with new avatar URL
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return {
        url: null,
        error: { type: 'upload_failed', message: 'Failed to update profile' },
      };
    }

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Failed to upload avatar:', error);
    return {
      url: null,
      error: {
        type: 'upload_failed',
        message: error instanceof Error ? error.message : 'Upload failed',
      },
    };
  }
}

export async function deleteAvatar(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  try {
    // List and delete all avatars for this user
    const { data: existingFiles } = await supabase.storage
      .from(AVATARS_BUCKET)
      .list(user.id);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map((f) => `${user.id}/${f.name}`);
      await supabase.storage.from(AVATARS_BUCKET).remove(filesToDelete);
    }

    // Clear avatar_url in profile
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id);

    if (error) {
      console.error('Error clearing avatar URL:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete avatar:', error);
    return false;
  }
}
