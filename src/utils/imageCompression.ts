import { getInfoAsync } from 'expo-file-system/legacy';

// Lazy import to avoid crash when native module isn't available (Expo Go)
let ImageManipulator: typeof import('expo-image-manipulator') | null = null;

async function getImageManipulator() {
  if (ImageManipulator === null) {
    try {
      ImageManipulator = await import('expo-image-manipulator');
    } catch {
      ImageManipulator = null;
    }
  }
  return ImageManipulator;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  format: 'jpeg',
};

export async function compressImage(
  uri: string,
  options: CompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const manipulator = await getImageManipulator();

    if (!manipulator) {
      // Native module not available (Expo Go) - return original
      // ImagePicker's quality setting provides basic compression
      console.log('ImageManipulator not available, using original image');
      return uri;
    }

    const result = await manipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: opts.maxWidth,
            height: opts.maxHeight,
          },
        },
      ],
      {
        compress: opts.quality,
        format:
          opts.format === 'png'
            ? manipulator.SaveFormat.PNG
            : manipulator.SaveFormat.JPEG,
      }
    );

    return result.uri;
  } catch (error) {
    console.warn('Image compression failed, using original:', error);
    return uri;
  }
}

export async function compressAvatar(uri: string): Promise<string> {
  return compressImage(uri, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.85,
    format: 'jpeg',
  });
}

export async function compressPostImage(uri: string): Promise<string> {
  return compressImage(uri, {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.8,
    format: 'jpeg',
  });
}

export async function compressThumbnail(uri: string): Promise<string> {
  return compressImage(uri, {
    maxWidth: 300,
    maxHeight: 300,
    quality: 0.7,
    format: 'jpeg',
  });
}

export async function getFileSize(uri: string): Promise<number> {
  try {
    const info = await getInfoAsync(uri);
    return info.exists && 'size' in info ? info.size : 0;
  } catch {
    return 0;
  }
}
