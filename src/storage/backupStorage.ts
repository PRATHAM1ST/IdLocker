import * as FileSystem from 'expo-file-system/legacy';
import { logger } from '../utils/logger';
import type {
    AppSettings,
    Asset,
    CategoriesData,
    ImageAttachment,
    VaultData,
} from '../utils/types';
import { isAppSettings, isCategoriesData, isVaultData } from '../utils/types';
import {
    clearAssetsStorage,
    loadAssetsData,
    saveAssetsData,
    writeAssetFileFromBase64,
} from './assetStorage';
import { clearAllImages, getImageUri, writeImageFromBase64 } from './imageStorage';
import {
    clearVault,
    loadCategories,
    loadSettings,
    loadVault,
    saveCategories,
    saveSettings,
    saveVault,
} from './vaultStorage';

const BACKUP_VERSION = 1;
const BACKUP_DIR_ROOT = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
const BACKUP_FOLDER = BACKUP_DIR_ROOT ? `${BACKUP_DIR_ROOT}idlocker-backups/` : null;

export interface BackupAssetEntry {
  asset: Asset;
  base64: string;
}

export interface BackupAssetsSection {
  version: number;
  migrated?: boolean;
  entries: BackupAssetEntry[];
}

export interface BackupLegacyImageEntry {
  image: ImageAttachment;
  base64: string;
}

export interface VaultBackupFileV1 {
  version: number;
  exportedAt: string;
  vault: VaultData;
  settings: AppSettings;
  categories: CategoriesData;
  assets: BackupAssetsSection;
  legacyImages: BackupLegacyImageEntry[];
}

export interface BackupSummary {
  items: number;
  assets: number;
  legacyImages: number;
}

export type ImportSummary = BackupSummary;

export interface ImportResult {
  summary: ImportSummary;
  settings: AppSettings;
}

async function ensureBackupDirectory(): Promise<string> {
  if (!BACKUP_FOLDER) {
    throw new Error('Backup directory is unavailable on this platform.');
  }

  const info = await FileSystem.getInfoAsync(BACKUP_FOLDER);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(BACKUP_FOLDER, { intermediates: true });
  }

  return BACKUP_FOLDER;
}

async function readFileAsBase64(uri: string, label: string): Promise<string> {
  try {
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (error) {
    logger.error(`Failed to read ${label} for backup`, error);
    throw new Error(`Could not read ${label}. Please try again.`);
  }
}

function sanitizeVaultForExport(original: VaultData): VaultData {
  return {
    ...original,
    items: original.items.map((item) => ({
      ...item,
      images: item.images
        ? item.images.map((image) => ({
            ...image,
            uri: image.filename,
          }))
        : item.images,
    })),
  };
}

async function collectLegacyImages(vault: VaultData): Promise<BackupLegacyImageEntry[]> {
  const map = new Map<string, ImageAttachment>();

  for (const item of vault.items) {
    if (!item.images) continue;
    for (const image of item.images) {
      if (!map.has(image.id)) {
        map.set(image.id, image);
      }
    }
  }

  const entries: BackupLegacyImageEntry[] = [];
  for (const image of map.values()) {
    const base64 = await readFileAsBase64(image.uri, `image ${image.filename}`);
    entries.push({
      image: { ...image, uri: image.filename },
      base64,
    });
  }

  return entries;
}

async function collectAssetEntries(): Promise<BackupAssetsSection> {
  const assetsData = await loadAssetsData();
  const entries: BackupAssetEntry[] = [];

  for (const asset of assetsData.assets) {
    const base64 = await readFileAsBase64(asset.uri, `asset ${asset.originalFilename}`);
    entries.push({
      asset: { ...asset, uri: asset.filename },
      base64,
    });
  }

  return {
    version: assetsData.version,
    migrated: assetsData.migrated,
    entries,
  };
}

async function buildBackupPayload(): Promise<{ payload: VaultBackupFileV1; summary: BackupSummary }> {
  const [vaultData, settings, categories] = await Promise.all([
    loadVault(),
    loadSettings(),
    loadCategories(),
  ]);

  const [assetsSection, legacyImages] = await Promise.all([
    collectAssetEntries(),
    collectLegacyImages(vaultData),
  ]);

  const payload: VaultBackupFileV1 = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    vault: sanitizeVaultForExport(vaultData),
    settings,
    categories,
    assets: assetsSection,
    legacyImages,
  };

  const summary: BackupSummary = {
    items: vaultData.items.length,
    assets: assetsSection.entries.length,
    legacyImages: legacyImages.length,
  };

  return { payload, summary };
}

export async function createBackupFile(): Promise<{ uri: string; filename: string; summary: BackupSummary }> {
  const { payload, summary } = await buildBackupPayload();
  const dir = await ensureBackupDirectory();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `idlocker-backup-${timestamp}.json`;
  const uri = `${dir}${filename}`;

  await FileSystem.writeAsStringAsync(uri, JSON.stringify(payload), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  logger.info('Backup file created', { uri });
  return { uri, filename, summary };
}

function assertBackupPayload(payload: VaultBackupFileV1): void {
  if (payload.version !== BACKUP_VERSION) {
    throw new Error(`Unsupported backup version ${payload.version}.`);
  }

  if (!isVaultData(payload.vault)) {
    throw new Error('Backup file is missing valid vault data.');
  }

  if (!isAppSettings(payload.settings)) {
    throw new Error('Backup file is missing valid settings data.');
  }

  if (!isCategoriesData(payload.categories)) {
    throw new Error('Backup file is missing valid categories data.');
  }
}

async function restoreLegacyImages(entries: BackupLegacyImageEntry[]): Promise<number> {
  await clearAllImages();
  let restored = 0;

  for (const entry of entries) {
    const filename = entry.image.filename || `${entry.image.id}.jpg`;
    await writeImageFromBase64(filename, entry.base64);
    restored += 1;
  }

  return restored;
}

async function restoreAssets(section: BackupAssetsSection): Promise<Asset[]> {
  await clearAssetsStorage();
  const restored: Asset[] = [];

  for (const entry of section.entries) {
    const filename = entry.asset.filename || `${entry.asset.id}.bin`;
    const uri = await writeAssetFileFromBase64(filename, entry.base64);
    restored.push({
      ...entry.asset,
      uri,
    });
  }

  const assetsSaved = await saveAssetsData({
    version: section.version,
    migrated: section.migrated,
    assets: restored,
  });

  if (!assetsSaved) {
    throw new Error('Failed to save assets during import.');
  }

  return restored;
}

function applyLegacyImageUris(vault: VaultData): VaultData {
  return {
    ...vault,
    items: vault.items.map((item) => {
      if (!item.images || item.images.length === 0) {
        return item;
      }

      const updatedImages = item.images.map((image) => ({
        ...image,
        uri: getImageUri(image.filename),
      }));

      return {
        ...item,
        images: updatedImages,
      };
    }),
  };
}

export async function importBackupFromJson(json: string): Promise<ImportResult> {
  let parsed: VaultBackupFileV1;
  try {
    parsed = JSON.parse(json) as VaultBackupFileV1;
  } catch (error) {
    throw new Error('The selected file is not a valid IdLocker backup.');
  }

  assertBackupPayload(parsed);

  await clearVault();

  const legacyCount = await restoreLegacyImages(parsed.legacyImages || []);

  const assets = await restoreAssets(parsed.assets);

  const vaultWithUris = applyLegacyImageUris(parsed.vault);
  const vaultSaved = await saveVault(vaultWithUris);
  if (!vaultSaved) {
    throw new Error('Failed to save vault data during import.');
  }

  const categoriesSaved = await saveCategories(parsed.categories);
  if (!categoriesSaved) {
    throw new Error('Failed to save categories during import.');
  }

  const settingsSaved = await saveSettings(parsed.settings);
  if (!settingsSaved) {
    logger.warn('Settings did not persist during import (expected on Expo Go).');
  }

  const summary: ImportSummary = {
    items: vaultWithUris.items.length,
    assets: assets.length,
    legacyImages: legacyCount,
  };

  return {
    summary,
    settings: parsed.settings,
  };
}
