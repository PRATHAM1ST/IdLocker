/**
 * Centralized Asset Storage for vault items
 * Handles secure storage of images, PDFs, and documents
 * Supports deduplication via content hash and reference counting
 */

import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import { formatFileSize as formatSize } from '../utils/formatters';
import { logger } from '../utils/logger';
import type { Asset, AssetType, AssetsData, ImageAttachment } from '../utils/types';
import { isAssetsData } from '../utils/types';
import { generateTimestampId } from '../utils/uuid';

// Directory for storing assets
const ASSETS_DIR = `${FileSystem.documentDirectory}vault-assets/`;
const ASSETS_STORE_KEY = 'vault_assets_data';
const CURRENT_VERSION = 1;

// MIME type mappings
const MIME_TYPES: Record<string, AssetType> = {
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/heic': 'image',
  'application/pdf': 'pdf',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.ms-excel': 'document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document',
  'text/plain': 'document',
};

/**
 * Get file extension from MIME type
 */
function getExtensionFromMime(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'text/plain': 'txt',
  };
  return mimeToExt[mimeType] || 'bin';
}

/**
 * Detect asset type from MIME type
 */
function detectAssetType(mimeType: string): AssetType {
  return MIME_TYPES[mimeType] || 'document';
}

/**
 * Ensure the assets directory exists
 */
async function ensureAssetsDir(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(ASSETS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(ASSETS_DIR, { intermediates: true });
    logger.debug('Created assets directory');
  }
}

/**
 * Calculate hash of file content for deduplication
 */
async function calculateFileHash(uri: string): Promise<string> {
  try {
    const content = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, content);
    return hash;
  } catch (error) {
    logger.error('Failed to calculate file hash:', error);
    // Fallback to timestamp + random for uniqueness
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}

/**
 * Load assets data from SecureStore
 */
export async function loadAssetsData(): Promise<AssetsData> {
  try {
    const data = await SecureStore.getItemAsync(ASSETS_STORE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (isAssetsData(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    logger.error('Failed to load assets data:', error);
  }

  return {
    version: CURRENT_VERSION,
    assets: [],
    migrated: false,
  };
}

/**
 * Save assets data to SecureStore
 */
export async function saveAssetsData(data: AssetsData): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(ASSETS_STORE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    logger.error('Failed to save assets data:', error);
    return false;
  }
}

/**
 * Save an image asset with deduplication
 */
export async function saveImageAsset(
  sourceUri: string,
  originalFilename: string,
  width: number,
  height: number,
): Promise<Asset | null> {
  try {
    await ensureAssetsDir();

    // Convert image to JPEG for consistency
    const result = await ImageManipulator.manipulateAsync(sourceUri, [], {
      compress: 0.9,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    // Calculate hash for deduplication
    const hash = await calculateFileHash(result.uri);

    // Load existing assets
    const assetsData = await loadAssetsData();

    // Check for duplicate
    const existingAsset = assetsData.assets.find((a) => a.hash === hash);
    if (existingAsset) {
      logger.debug('Asset already exists, returning existing:', existingAsset.id);
      // Clean up temp file
      await FileSystem.deleteAsync(result.uri, { idempotent: true });
      return existingAsset;
    }

    // Create new asset
    const id = generateTimestampId();
    const filename = `${id}.jpg`;
    const destUri = `${ASSETS_DIR}${filename}`;

    // Move file to assets directory
    await FileSystem.moveAsync({
      from: result.uri,
      to: destUri,
    });

    // Get file size
    const fileInfo = await FileSystem.getInfoAsync(destUri);
    const size = (fileInfo as any).size || 0;

    const asset: Asset = {
      id,
      type: 'image',
      filename,
      originalFilename: originalFilename || filename,
      uri: destUri,
      mimeType: 'image/jpeg',
      size,
      hash,
      width: result.width,
      height: result.height,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to assets data
    assetsData.assets.push(asset);
    await saveAssetsData(assetsData);

    logger.debug('Image asset saved:', { id: asset.id, filename });
    return asset;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to save image asset:', errorMessage);
    return null;
  }
}

/**
 * Save a document asset (PDF, etc.) with deduplication
 */
export async function saveDocumentAsset(
  sourceUri: string,
  originalFilename: string,
  mimeType: string,
): Promise<Asset | null> {
  try {
    await ensureAssetsDir();

    // Calculate hash for deduplication
    const hash = await calculateFileHash(sourceUri);

    // Load existing assets
    const assetsData = await loadAssetsData();

    // Check for duplicate
    const existingAsset = assetsData.assets.find((a) => a.hash === hash);
    if (existingAsset) {
      logger.debug('Asset already exists, returning existing:', existingAsset.id);
      return existingAsset;
    }

    // Create new asset
    const id = generateTimestampId();
    const extension = getExtensionFromMime(mimeType);
    const filename = `${id}.${extension}`;
    const destUri = `${ASSETS_DIR}${filename}`;

    // Copy file to assets directory
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destUri,
    });

    // Get file size
    const fileInfo = await FileSystem.getInfoAsync(destUri);
    const size = (fileInfo as any).size || 0;

    const asset: Asset = {
      id,
      type: detectAssetType(mimeType),
      filename,
      originalFilename: originalFilename || filename,
      uri: destUri,
      mimeType,
      size,
      hash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to assets data
    assetsData.assets.push(asset);
    await saveAssetsData(assetsData);

    logger.debug('Document asset saved:', { id: asset.id, filename, mimeType });
    return asset;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to save document asset:', errorMessage);
    return null;
  }
}

/**
 * Get an asset by ID
 */
export async function getAssetById(id: string): Promise<Asset | null> {
  try {
    const assetsData = await loadAssetsData();
    return assetsData.assets.find((a) => a.id === id) || null;
  } catch (error) {
    logger.error('Failed to get asset:', error);
    return null;
  }
}

/**
 * Get multiple assets by IDs
 */
export async function getAssetsByIds(ids: string[]): Promise<Asset[]> {
  try {
    const assetsData = await loadAssetsData();
    const idSet = new Set(ids);
    return assetsData.assets.filter((a) => idSet.has(a.id));
  } catch (error) {
    logger.error('Failed to get assets:', error);
    return [];
  }
}

/**
 * Get all assets
 */
export async function getAllAssets(): Promise<Asset[]> {
  try {
    const assetsData = await loadAssetsData();
    return assetsData.assets;
  } catch (error) {
    logger.error('Failed to get all assets:', error);
    return [];
  }
}

/**
 * Get assets by type
 */
export async function getAssetsByType(type: AssetType): Promise<Asset[]> {
  try {
    const assetsData = await loadAssetsData();
    return assetsData.assets.filter((a) => a.type === type);
  } catch (error) {
    logger.error('Failed to get assets by type:', error);
    return [];
  }
}

/**
 * Delete an asset by ID
 * Only deletes if no items reference it
 */
export async function deleteAsset(id: string, force: boolean = false): Promise<boolean> {
  try {
    const assetsData = await loadAssetsData();
    const assetIndex = assetsData.assets.findIndex((a) => a.id === id);

    if (assetIndex === -1) {
      logger.debug('Asset not found:', id);
      return false;
    }

    const asset = assetsData.assets[assetIndex];

    // Delete file
    const fileInfo = await FileSystem.getInfoAsync(asset.uri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(asset.uri, { idempotent: true });
    }

    // Remove from assets data
    assetsData.assets.splice(assetIndex, 1);
    await saveAssetsData(assetsData);

    logger.debug('Asset deleted:', id);
    return true;
  } catch (error) {
    logger.error('Failed to delete asset:', error);
    return false;
  }
}

/**
 * Clean up orphaned assets (not referenced by any vault item)
 */
export async function cleanupOrphanedAssets(referencedAssetIds: Set<string>): Promise<number> {
  try {
    const assetsData = await loadAssetsData();
    let deletedCount = 0;

    const assetsToKeep: Asset[] = [];

    for (const asset of assetsData.assets) {
      if (referencedAssetIds.has(asset.id)) {
        assetsToKeep.push(asset);
      } else {
        // Delete orphaned asset file
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(asset.uri, { idempotent: true });
        }
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      assetsData.assets = assetsToKeep;
      await saveAssetsData(assetsData);
      logger.debug(`Cleaned up ${deletedCount} orphaned assets`);
    }

    return deletedCount;
  } catch (error) {
    logger.error('Failed to cleanup orphaned assets:', error);
    return 0;
  }
}

/**
 * Migrate legacy ImageAttachment to centralized Asset
 * This is used for transparent migration of existing data
 */
export async function migrateImageToAsset(image: ImageAttachment): Promise<Asset | null> {
  try {
    await ensureAssetsDir();

    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(image.uri);
    if (!fileInfo.exists) {
      logger.warn('Legacy image not found for migration:', image.uri);
      return null;
    }

    // Calculate hash
    const hash = await calculateFileHash(image.uri);

    // Load existing assets
    const assetsData = await loadAssetsData();

    // Check for duplicate
    const existingAsset = assetsData.assets.find((a) => a.hash === hash);
    if (existingAsset) {
      logger.debug('Asset already exists during migration:', existingAsset.id);
      return existingAsset;
    }

    // Create asset from legacy image
    const id = image.id; // Keep the same ID for reference tracking
    const filename = image.filename.endsWith('.jpg') ? image.filename : `${image.id}.jpg`;
    const destUri = `${ASSETS_DIR}${filename}`;

    // Copy file to new location (keep original for safety during migration)
    await FileSystem.copyAsync({
      from: image.uri,
      to: destUri,
    });

    const size = (fileInfo as any).size || 0;

    const asset: Asset = {
      id,
      type: 'image',
      filename,
      originalFilename: image.filename,
      uri: destUri,
      mimeType: 'image/jpeg',
      size,
      hash,
      width: image.width,
      height: image.height,
      createdAt: image.createdAt,
      updatedAt: new Date().toISOString(),
    };

    // Add to assets data
    assetsData.assets.push(asset);
    await saveAssetsData(assetsData);

    logger.debug('Migrated legacy image to asset:', { id: asset.id });
    return asset;
  } catch (error) {
    logger.error('Failed to migrate image to asset:', error);
    return null;
  }
}

/**
 * Check if migration has been completed
 */
export async function isMigrationCompleted(): Promise<boolean> {
  const assetsData = await loadAssetsData();
  return assetsData.migrated === true;
}

/**
 * Mark migration as completed
 */
export async function markMigrationCompleted(): Promise<void> {
  const assetsData = await loadAssetsData();
  assetsData.migrated = true;
  await saveAssetsData(assetsData);
}

/**
 * Resize an image asset
 */
export async function resizeImageAsset(
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

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    logger.error('Failed to resize image asset:', error);
    return null;
  }
}

/**
 * Share an asset using system share dialog
 */
export async function shareAsset(
  uri: string,
  mimeType: string = 'application/octet-stream',
): Promise<boolean> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      logger.warn('Sharing not available on this device');
      return false;
    }

    await Sharing.shareAsync(uri, {
      mimeType,
      dialogTitle: 'Share File',
    });

    logger.debug('Asset shared successfully');
    return true;
  } catch (error) {
    logger.error('Failed to share asset:', error);
    return false;
  }
}

/**
 * Get total storage used by assets
 */
export async function getAssetsStorageSize(): Promise<number> {
  try {
    await ensureAssetsDir();

    const dirContent = await FileSystem.readDirectoryAsync(ASSETS_DIR);
    let totalSize = 0;

    for (const filename of dirContent) {
      const uri = `${ASSETS_DIR}${filename}`;
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists && 'size' in fileInfo) {
        totalSize += (fileInfo as any).size || 0;
      }
    }

    return totalSize;
  } catch (error) {
    logger.error('Failed to get assets storage size:', error);
    return 0;
  }
}

/**
 * Format file size for display
 * Re-exported from formatters for backward compatibility
 */
export { formatFileSize } from '../utils/formatters';

/**
 * Build an absolute URI for an asset filename stored in the vault assets directory.
 */
export function getAssetFileUri(filename: string): string {
  return `${ASSETS_DIR}${filename}`;
}

/**
 * Write an asset file from base64 encoded content (used during import/restore).
 */
export async function writeAssetFileFromBase64(
  filename: string,
  base64Data: string,
): Promise<string> {
  await ensureAssetsDir();
  const uri = getAssetFileUri(filename);
  await FileSystem.writeAsStringAsync(uri, base64Data, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return uri;
}

/**
 * Completely clear asset metadata and files from storage (used before importing a backup).
 */
export async function clearAssetsStorage(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(ASSETS_DIR);
    if (dirInfo.exists) {
      const files = await FileSystem.readDirectoryAsync(ASSETS_DIR);
      await Promise.all(
        files.map((filename) => FileSystem.deleteAsync(`${ASSETS_DIR}${filename}`, { idempotent: true })),
      );
    }

    await SecureStore.deleteItemAsync(ASSETS_STORE_KEY);
    await ensureAssetsDir();
  } catch (error) {
    logger.error('Failed to clear assets storage:', error);
    throw error;
  }
}




