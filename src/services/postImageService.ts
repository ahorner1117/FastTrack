import { supabase } from '../lib/supabase';
import { decode } from 'base64-arraybuffer';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { compressPostImage, compressThumbnail, getFileSize } from '../utils/imageCompression';

const POST_IMAGES_BUCKET = 'post-images';
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export interface ImageUploadError {
  type: 'size_exceeded' | 'upload_failed' | 'not_authenticated';
  message: string;
}

export async function uploadPostImage(
  localUri: string,
  postId: string
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
    const compressedUri = await compressPostImage(localUri);

    // Check file size after compression
    const fileSize = await getFileSize(compressedUri);
    if (fileSize > MAX_FILE_SIZE_BYTES) {
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
        thumbnailUrl: null,
        error: { type: 'upload_failed', message: error.message },
      };
    }

    // Get public URL for full image
    const {
      data: { publicUrl },
    } = supabase.storage.from(POST_IMAGES_BUCKET).getPublicUrl(data.path);

    // Generate and upload thumbnail (best-effort)
    let thumbnailUrl: string | null = null;
    try {
      const thumbnailUri = await compressThumbnail(localUri);
      const thumbBase64 = await readAsStringAsync(thumbnailUri, {
        encoding: EncodingType.Base64,
      });

      const thumbFileName = `${user.id}/${postId}_thumb.jpg`;

      const { data: thumbData, error: thumbError } = await supabase.storage
        .from(POST_IMAGES_BUCKET)
        .upload(thumbFileName, decode(thumbBase64), {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (thumbError) {
        console.warn('Thumbnail upload failed, continuing without thumbnail:', thumbError);
      } else {
        const {
          data: { publicUrl: thumbPublicUrl },
        } = supabase.storage.from(POST_IMAGES_BUCKET).getPublicUrl(thumbData.path);
        thumbnailUrl = thumbPublicUrl;
      }
    } catch (thumbErr) {
      console.warn('Thumbnail generation/upload failed, continuing without thumbnail:', thumbErr);
    }

    return { url: publicUrl, thumbnailUrl, error: null };
  } catch (error) {
    console.error('Failed to upload post image:', error);
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

export async function deletePostImage(postId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  try {
    // Try to delete common image extensions and their thumbnail variants
    const extensions = ['jpg', 'jpeg', 'png', 'heic', 'webp'];
    const filePaths = extensions.flatMap((ext) => [
      `${user.id}/${postId}.${ext}`,
      `${user.id}/${postId}_thumb.${ext}`,
    ]);

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
