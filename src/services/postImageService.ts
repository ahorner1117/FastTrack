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

export interface UploadedImage {
  url: string;
  thumbnailUrl: string | null;
  position: number;
}

async function uploadSingleImage(
  localUri: string,
  userId: string,
  postId: string,
  position: number
): Promise<{ url: string; thumbnailUrl: string | null }> {
  const compressedUri = await compressPostImage(localUri);

  const fileSize = await getFileSize(compressedUri);
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    throw new Error('Image is too large. Please select a smaller image.');
  }

  const base64 = await readAsStringAsync(compressedUri, {
    encoding: EncodingType.Base64,
  });

  const fileName = `${userId}/${postId}_${position}.jpg`;

  const { data, error } = await supabase.storage
    .from(POST_IMAGES_BUCKET)
    .upload(fileName, decode(base64), {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

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

    const thumbFileName = `${userId}/${postId}_${position}_thumb.jpg`;

    const { data: thumbData, error: thumbError } = await supabase.storage
      .from(POST_IMAGES_BUCKET)
      .upload(thumbFileName, decode(thumbBase64), {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (!thumbError && thumbData) {
      const {
        data: { publicUrl: thumbPublicUrl },
      } = supabase.storage.from(POST_IMAGES_BUCKET).getPublicUrl(thumbData.path);
      thumbnailUrl = thumbPublicUrl;
    }
  } catch {
    // Thumbnail is best-effort
  }

  return { url: publicUrl, thumbnailUrl };
}

export async function uploadPostImages(
  localUris: string[],
  postId: string
): Promise<{ images: UploadedImage[]; error: ImageUploadError | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      images: [],
      error: { type: 'not_authenticated', message: 'User not authenticated' },
    };
  }

  try {
    const results = await Promise.all(
      localUris.map((uri, index) =>
        uploadSingleImage(uri, user.id, postId, index)
      )
    );

    return {
      images: results.map((r, index) => ({
        url: r.url,
        thumbnailUrl: r.thumbnailUrl,
        position: index,
      })),
      error: null,
    };
  } catch (error) {
    return {
      images: [],
      error: {
        type: 'upload_failed',
        message: error instanceof Error ? error.message : 'Upload failed',
      },
    };
  }
}

// Legacy single-image upload (delegates to multi)
export async function uploadPostImage(
  localUri: string,
  postId: string
): Promise<{ url: string | null; thumbnailUrl: string | null; error: ImageUploadError | null }> {
  const result = await uploadPostImages([localUri], postId);
  if (result.error || result.images.length === 0) {
    return { url: null, thumbnailUrl: null, error: result.error };
  }
  return {
    url: result.images[0].url,
    thumbnailUrl: result.images[0].thumbnailUrl,
    error: null,
  };
}

export async function deletePostImages(postId: string, imageCount: number = 7): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  try {
    const filePaths: string[] = [];
    for (let i = 0; i < imageCount; i++) {
      filePaths.push(`${user.id}/${postId}_${i}.jpg`);
      filePaths.push(`${user.id}/${postId}_${i}_thumb.jpg`);
    }
    // Also try legacy format (no position suffix)
    filePaths.push(`${user.id}/${postId}.jpg`);
    filePaths.push(`${user.id}/${postId}_thumb.jpg`);

    await supabase.storage.from(POST_IMAGES_BUCKET).remove(filePaths);
    return true;
  } catch {
    return false;
  }
}

export async function deletePostImagesByUrls(imageUrls: string[]): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  try {
    const filePaths: string[] = [];
    for (const url of imageUrls) {
      try {
        const urlObj = new URL(url);
        const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/post-images\/(.+)/);
        if (pathMatch) {
          filePaths.push(pathMatch[1]);
          // Also try to delete the thumbnail variant
          const thumbPath = pathMatch[1].replace('.jpg', '_thumb.jpg');
          if (thumbPath !== pathMatch[1]) {
            filePaths.push(thumbPath);
          }
        }
      } catch {
        // Skip invalid URLs
      }
    }

    if (filePaths.length > 0) {
      await supabase.storage.from(POST_IMAGES_BUCKET).remove(filePaths);
    }
    return true;
  } catch {
    return false;
  }
}

// Legacy alias
export const deletePostImage = deletePostImages;
