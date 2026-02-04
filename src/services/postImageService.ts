import { supabase } from '../lib/supabase';
import { decode } from 'base64-arraybuffer';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { compressPostImage, getFileSize } from '../utils/imageCompression';

const POST_IMAGES_BUCKET = 'post-images';
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export interface ImageUploadError {
  type: 'size_exceeded' | 'upload_failed' | 'not_authenticated';
  message: string;
}

export async function uploadPostImage(
  localUri: string,
  postId: string
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
    // Compress the image
    const compressedUri = await compressPostImage(localUri);

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

    // Always use jpg after compression
    const fileName = `${user.id}/${postId}.jpg`;

    const { data, error } = await supabase.storage
      .from(POST_IMAGES_BUCKET)
      .upload(fileName, decode(base64), {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading post image:', error);
      return {
        url: null,
        error: { type: 'upload_failed', message: error.message },
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(POST_IMAGES_BUCKET).getPublicUrl(data.path);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Failed to upload post image:', error);
    return {
      url: null,
      error: {
        type: 'upload_failed',
        message: error instanceof Error ? error.message : 'Upload failed',
      },
    };
  }
}

export async function deletePostImage(postId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  try {
    // Try to delete common image extensions
    const extensions = ['jpg', 'jpeg', 'png', 'heic', 'webp'];
    const filePaths = extensions.map((ext) => `${user.id}/${postId}.${ext}`);

    const { error } = await supabase.storage
      .from(POST_IMAGES_BUCKET)
      .remove(filePaths);

    if (error) {
      console.error('Error deleting post image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete post image:', error);
    return false;
  }
}
