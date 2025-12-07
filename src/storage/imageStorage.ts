/**
 * Image storage utility for vault item attachments
 * Handles secure storage of images in the app's document directory
 * Uses the legacy expo-file-system API for broader compatibility
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
import { logger } from '../utils/logger';
import type { ImageAttachment } from '../utils/types';

// Directory for storing vault images
const IMAGES_DIR = `${FileSystem.documentDirectory}vault-images/`;

/**
 * Generate a unique ID (React Native compatible without crypto)
 * Uses timestamp + random numbers for uniqueness
 */
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}-${randomPart2}`;
}

/**
 * Ensure the images directory exists
 */
async function ensureImagesDir(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
    logger.debug('Created images directory');
  }
}

/**
 * Save an image to secure storage
 * @param sourceUri - The source URI of the image (from picker or camera)
 * @returns The saved image attachment metadata
 */
export async function saveImage(
  sourceUri: string,
  width: number,
  height: number,
): Promise<ImageAttachment | null> {
  try {
    await ensureImagesDir();

    const id = generateId();
    // Always use jpg extension since we'll convert via manipulator
    const filename = `${id}.jpg`;
    const destUri = `${IMAGES_DIR}${filename}`;

    // Use ImageManipulator to copy/convert the image - this handles content:// URIs properly
    const result = await ImageManipulator.manipulateAsync(
      sourceUri,
      [], // No transformations, just copy
      {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    // Now copy the manipulated result (which is a file:// URI) to our directory
    await FileSystem.moveAsync({
      from: result.uri,
      to: destUri,
    });

    const attachment: ImageAttachment = {
      id,
      uri: destUri,
      filename,
      width: result.width,
      height: result.height,
      createdAt: new Date().toISOString(),
    };

    logger.debug('Image saved:', { id: attachment.id, filename });
    return attachment;
  } catch (error: unknown) {
    // Better error logging
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : JSON.stringify(error);
    logger.error('Failed to save image:', errorMessage);
    return null;
  }
}

/**
 * Delete an image from storage
 * @param id - The image attachment ID
 */
export async function deleteImage(id: string, filename: string): Promise<boolean> {
  try {
    const uri = `${IMAGES_DIR}${filename}`;
    const fileInfo = await FileSystem.getInfoAsync(uri);

    if (fileInfo.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      logger.debug('Image deleted:', { id });
    }

    return true;
  } catch (error) {
    logger.error('Failed to delete image:', error);
    return false;
  }
}

/**
 * Delete multiple images
 * @param images - Array of image attachments to delete
 */
export async function deleteImages(images: ImageAttachment[]): Promise<void> {
  const deletePromises = images.map((img) => deleteImage(img.id, img.filename));
  await Promise.all(deletePromises);
}

/**
 * Get the URI for a stored image
 * @param filename - The image filename
 */
export function getImageUri(filename: string): string {
  return `${IMAGES_DIR}${filename}`;
}

/**
 * Check if an image exists in storage
 * @param filename - The image filename
 */
export async function imageExists(filename: string): Promise<boolean> {
  try {
    const uri = `${IMAGES_DIR}${filename}`;
    const fileInfo = await FileSystem.getInfoAsync(uri);
    return fileInfo.exists;
  } catch {
    return false;
  }
}

/**
 * Resize an image to custom dimensions
 * @param sourceUri - The source image URI
 * @param width - Target width
 * @param height - Target height
 * @param quality - JPEG quality (0-1)
 * @returns The URI of the resized image in cache directory
 */
export async function resizeImage(
  sourceUri: string,
  width: number,
  height: number,
  quality: number = 0.8,
): Promise<{ uri: string; width: number; height: number } | null> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      sourceUri,
      [{ resize: { width, height } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    logger.debug('Image resized:', { width: result.width, height: result.height });
    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    logger.error('Failed to resize image:', error);
    return null;
  }
}

/**
 * Resize image maintaining aspect ratio
 * @param sourceUri - The source image URI
 * @param maxWidth - Maximum width
 * @param maxHeight - Maximum height
 * @param quality - JPEG quality (0-1)
 */
export async function resizeImageWithAspectRatio(
  sourceUri: string,
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8,
): Promise<{ uri: string; width: number; height: number } | null> {
  try {
    // Calculate aspect ratio
    const aspectRatio = originalWidth / originalHeight;

    let targetWidth = maxWidth;
    let targetHeight = maxHeight;

    // Fit within bounds while maintaining aspect ratio
    if (targetWidth / targetHeight > aspectRatio) {
      targetWidth = Math.round(targetHeight * aspectRatio);
    } else {
      targetHeight = Math.round(targetWidth / aspectRatio);
    }

    return resizeImage(sourceUri, targetWidth, targetHeight, quality);
  } catch (error) {
    logger.error('Failed to resize image with aspect ratio:', error);
    return null;
  }
}

/**
 * Share an image using the system share dialog
 * @param uri - The image URI to share
 */
export async function shareImage(uri: string): Promise<boolean> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      logger.warn('Sharing not available on this device');
      return false;
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'image/jpeg',
      dialogTitle: 'Share Image',
    });

    logger.debug('Image shared successfully');
    return true;
  } catch (error) {
    logger.error('Failed to share image:', error);
    return false;
  }
}

/**
 * Share a resized image
 * @param sourceUri - The original image URI
 * @param width - Target width
 * @param height - Target height
 * @param quality - JPEG quality (0-1)
 */
export async function shareResizedImage(
  sourceUri: string,
  width: number,
  height: number,
  quality: number = 0.8,
): Promise<boolean> {
  try {
    const resized = await resizeImage(sourceUri, width, height, quality);
    if (!resized) {
      return false;
    }

    return shareImage(resized.uri);
  } catch (error) {
    logger.error('Failed to share resized image:', error);
    return false;
  }
}

/**
 * Save a resized image to the cache for export
 * @param sourceUri - The original image URI
 * @param width - Target width
 * @param height - Target height
 * @param quality - JPEG quality (0-1)
 */
export async function exportResizedImage(
  sourceUri: string,
  width: number,
  height: number,
  quality: number = 0.8,
): Promise<string | null> {
  try {
    const resized = await resizeImage(sourceUri, width, height, quality);
    return resized?.uri || null;
  } catch (error) {
    logger.error('Failed to export resized image:', error);
    return null;
  }
}

/**
 * Get image info (dimensions)
 * @param uri - The image URI
 */
export async function getImageInfo(uri: string): Promise<{
  width: number;
  height: number;
} | null> {
  try {
    // Get dimensions using image manipulator
    const result = await ImageManipulator.manipulateAsync(uri, [], {});

    return {
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    logger.error('Failed to get image info:', error);
    return null;
  }
}

/**
 * Clean up orphaned images (images not referenced by any vault item)
 * Should be called periodically or when vault is loaded
 * @param referencedFilenames - Set of filenames that are still in use
 */
export async function cleanupOrphanedImages(referencedFilenames: Set<string>): Promise<number> {
  try {
    await ensureImagesDir();

    const dirContent = await FileSystem.readDirectoryAsync(IMAGES_DIR);
    let deletedCount = 0;

    for (const filename of dirContent) {
      if (!referencedFilenames.has(filename)) {
        const uri = `${IMAGES_DIR}${filename}`;
        await FileSystem.deleteAsync(uri, { idempotent: true });
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.debug(`Cleaned up ${deletedCount} orphaned images`);
    }

    return deletedCount;
  } catch (error) {
    logger.error('Failed to cleanup orphaned images:', error);
    return 0;
  }
}

/**
 * Get total storage used by images (approximate)
 */
export async function getImageStorageSize(): Promise<number> {
  try {
    await ensureImagesDir();

    const dirContent = await FileSystem.readDirectoryAsync(IMAGES_DIR);
    let totalSize = 0;

    for (const filename of dirContent) {
      const uri = `${IMAGES_DIR}${filename}`;
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists && 'size' in fileInfo) {
        totalSize += (fileInfo as any).size || 0;
      }
    }

    return totalSize;
  } catch (error) {
    logger.error('Failed to get image storage size:', error);
    return 0;
  }
}
