import * as FileSystem from 'expo-file-system/legacy';
import { DEFAULT_SETTINGS } from '../utils/constants';
import { generateUUID } from '../utils/uuid';
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
  getAssetFileUri,
  loadAssetsData,
  saveAssetsData,
  writeAssetFileFromBase64,
} from './assetStorage';
import { getImageUri, writeImageFromBase64 } from './imageStorage';
import {
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

export type DuplicateStrategy = 'skip' | 'overwrite';

export interface CountSummary {
  added: number;
  overwritten: number;
  skipped: number;
}

export interface ImportSummary {
  items: CountSummary;
  assets: CountSummary;
  categories: CountSummary;
  legacyImagesRestored: number;
}

export interface ImportResult {
  summary: ImportSummary;
  settings: AppSettings;
}

export interface ImportOptions {
  duplicateStrategy?: DuplicateStrategy;
}

export interface ImportConflicts {
  items: string[];
  categories: string[];
  assets: string[];
}

async function fileExists(uri: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch {
    return false;
  }
}

function getFilenameParts(filename: string | undefined, fallbackExt: string): {
  base: string;
  ext: string;
} {
  const trimmed = filename?.trim();
  if (!trimmed) {
    return { base: generateUUID(), ext: fallbackExt };
  }

  const lastDot = trimmed.lastIndexOf('.');
  if (lastDot === -1) {
    return { base: trimmed, ext: fallbackExt };
  }

  const base = trimmed.slice(0, lastDot);
  const ext = trimmed.slice(lastDot) || fallbackExt;
  return { base, ext };
}

async function ensureUniqueFilename(
  desired: string | undefined,
  usedNames: Set<string>,
  uriBuilder: (filename: string) => string,
  fallbackExt: string,
): Promise<string> {
  const { base, ext } = getFilenameParts(desired, fallbackExt);
  let candidate = `${base}${ext}`;
  let counter = 1;

  while (true) {
    if (!usedNames.has(candidate)) {
      const uri = uriBuilder(candidate);
      if (!(await fileExists(uri))) {
        usedNames.add(candidate);
        return candidate;
      }
    }

    candidate = `${base}-${counter}${ext}`;
    counter += 1;
  }
}

function createCountSummary(): CountSummary {
  return { added: 0, overwritten: 0, skipped: 0 };
}

function parseBackupJson(json: string): VaultBackupFileV1 {
  let parsed: VaultBackupFileV1;
  try {
    parsed = JSON.parse(json) as VaultBackupFileV1;
  } catch {
    throw new Error('The selected file is not a valid IdLocker backup.');
  }

  assertBackupPayload(parsed);
  return parsed;
}

function detectImportConflicts(
  payload: VaultBackupFileV1,
  currentVault: VaultData,
  currentCategories: CategoriesData,
  currentAssets: Asset[],
): ImportConflicts {
  const existingItemIds = new Set(currentVault.items.map((item) => item.id));
  const existingCategoryIds = new Set(currentCategories.categories.map((cat) => cat.id));
  const existingAssetIds = new Set(currentAssets.map((asset) => asset.id));

  return {
    items: payload.vault.items.filter((item) => existingItemIds.has(item.id)).map((item) => item.id),
    categories: payload.categories.categories
      .filter((cat) => existingCategoryIds.has(cat.id))
      .map((cat) => cat.id),
    assets: payload.assets.entries
      .filter((entry) => existingAssetIds.has(entry.asset.id))
      .map((entry) => entry.asset.id),
  };
}

export async function previewBackupImport(json: string): Promise<ImportConflicts> {
  const parsed = parseBackupJson(json);
  const [currentVault, currentCategories, assetsData] = await Promise.all([
    loadVault(),
    loadCategories(),
    loadAssetsData(),
  ]);

  return detectImportConflicts(parsed, currentVault, currentCategories, assetsData.assets);
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

async function restoreLegacyImages(
  entries: BackupLegacyImageEntry[],
  existingVault: VaultData,
): Promise<{ imageMap: Map<string, ImageAttachment>; restoredCount: number }> {
  const imageMap = new Map<string, ImageAttachment>();
  const existingImagesById = new Map<string, ImageAttachment>();
  const usedFilenames = new Set<string>();

  for (const item of existingVault.items) {
    if (!item.images) continue;
    for (const image of item.images) {
      existingImagesById.set(image.id, image);
      usedFilenames.add(image.filename);
      imageMap.set(image.id, image);
    }
  }

  let restored = 0;

  for (const entry of entries) {
    const incoming = entry.image;
    const existingAttachment = existingImagesById.get(incoming.id);

    if (existingAttachment) {
      const imagePathExists = await fileExists(existingAttachment.uri);
      if (!imagePathExists) {
        await writeImageFromBase64(existingAttachment.filename, entry.base64);
      }
      imageMap.set(incoming.id, existingAttachment);
      continue;
    }

    const filename = await ensureUniqueFilename(
      incoming.filename || `${incoming.id}.jpg`,
      usedFilenames,
      getImageUri,
      '.jpg',
    );
    const uri = await writeImageFromBase64(filename, entry.base64);
    const attachment: ImageAttachment = {
      ...incoming,
      filename,
      uri,
    };

    imageMap.set(incoming.id, attachment);
    existingImagesById.set(attachment.id, attachment);
    restored += 1;
  }

  return { imageMap, restoredCount: restored };
}

async function restoreAssets(
  section: BackupAssetsSection,
  strategy: DuplicateStrategy,
): Promise<{ added: number; overwritten: number; skipped: number }> {
  const assetsData = await loadAssetsData();
  const existingAssetsById = new Map<string, Asset>();
  const existingIndexById = new Map<string, number>();
  const usedFilenames = new Set<string>();

  assetsData.assets.forEach((asset, index) => {
    existingAssetsById.set(asset.id, asset);
    existingIndexById.set(asset.id, index);
    usedFilenames.add(asset.filename);
  });

  const summary = createCountSummary();

  for (const entry of section.entries) {
    const incoming = entry.asset;
    const existingAsset = existingAssetsById.get(incoming.id);

    if (existingAsset) {
      if (strategy === 'overwrite') {
        await writeAssetFileFromBase64(existingAsset.filename, entry.base64);
        const updatedAsset: Asset = {
          ...existingAsset,
          ...incoming,
          filename: existingAsset.filename,
          uri: existingAsset.uri,
        };
        const index = existingIndexById.get(existingAsset.id);
        if (typeof index === 'number') {
          assetsData.assets[index] = updatedAsset;
          existingAssetsById.set(existingAsset.id, updatedAsset);
        }
        summary.overwritten += 1;
      } else {
        const assetFileExists = await fileExists(existingAsset.uri);
        if (!assetFileExists) {
          await writeAssetFileFromBase64(existingAsset.filename, entry.base64);
        }
        summary.skipped += 1;
      }
      continue;
    }

    const filename = await ensureUniqueFilename(
      incoming.filename || `${incoming.id}.bin`,
      usedFilenames,
      getAssetFileUri,
      '.bin',
    );
    const uri = await writeAssetFileFromBase64(filename, entry.base64);
    const asset: Asset = {
      ...incoming,
      filename,
      uri,
    };

    assetsData.assets.push(asset);
    existingAssetsById.set(asset.id, asset);
    summary.added += 1;
  }

  assetsData.version = Math.max(assetsData.version, section.version);
  assetsData.migrated = Boolean(assetsData.migrated || section.migrated);

  const assetsSaved = await saveAssetsData(assetsData);
  if (!assetsSaved) {
    throw new Error('Failed to save assets during import.');
  }

  return summary;
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

function updateImportedVaultImages(
  vault: VaultData,
  imageMap: Map<string, ImageAttachment>,
): void {
  for (const item of vault.items) {
    if (!item.images || item.images.length === 0) {
      continue;
    }

    item.images = item.images.map((image) => {
      const updated = imageMap.get(image.id);
      return updated
        ? {
            ...image,
            filename: updated.filename,
            uri: updated.uri,
          }
        : image;
    });
  }
}

function mergeVaultData(
  existing: VaultData,
  incoming: VaultData,
  strategy: DuplicateStrategy,
): { merged: VaultData; counts: CountSummary } {
  const mergedItems = [...existing.items];
  const indexById = new Map<string, number>();
  mergedItems.forEach((item, index) => indexById.set(item.id, index));

  const counts = createCountSummary();

  for (const item of incoming.items) {
    const clonedItem = {
      ...item,
      images: item.images?.map((image) => ({ ...image })),
      customFields: item.customFields?.map((field) => ({ ...field })),
      assetRefs: item.assetRefs?.map((ref) => ({ ...ref })),
    };

    const existingIndex = indexById.get(item.id);
    if (typeof existingIndex === 'number') {
      if (strategy === 'overwrite') {
        mergedItems[existingIndex] = clonedItem;
        counts.overwritten += 1;
      } else {
        counts.skipped += 1;
      }
      continue;
    }

    mergedItems.push(clonedItem);
    indexById.set(clonedItem.id, mergedItems.length - 1);
    counts.added += 1;
  }

  return {
    merged: {
      version: Math.max(existing.version ?? 1, incoming.version ?? 1),
      items: mergedItems,
    },
    counts,
  };
}

function mergeCategoriesData(
  existing: CategoriesData,
  incoming: CategoriesData,
  strategy: DuplicateStrategy,
): { merged: CategoriesData; counts: CountSummary } {
  const mergedCategories = [...existing.categories];
  const indexById = new Map<string, number>();
  mergedCategories.forEach((category, index) => indexById.set(category.id, index));

  const counts = createCountSummary();

  for (const category of incoming.categories) {
    const clonedCategory = {
      ...category,
      fields: category.fields.map((field) => ({ ...field })),
    };

    const existingIndex = indexById.get(category.id);
    if (typeof existingIndex === 'number') {
      if (strategy === 'overwrite') {
        mergedCategories[existingIndex] = clonedCategory;
        counts.overwritten += 1;
      } else {
        counts.skipped += 1;
      }
      continue;
    }

    mergedCategories.push(clonedCategory);
    indexById.set(clonedCategory.id, mergedCategories.length - 1);
    counts.added += 1;
  }

  return {
    merged: {
      version: Math.max(existing.version ?? 1, incoming.version ?? 1),
      categories: mergedCategories,
    },
    counts,
  };
}

function mergeSettings(current: AppSettings, incoming: AppSettings): AppSettings {
  const merged: AppSettings = {
    ...current,
    hasCompletedOnboarding: current.hasCompletedOnboarding || incoming.hasCompletedOnboarding,
    autoLockTimeout:
      current.autoLockTimeout !== DEFAULT_SETTINGS.autoLockTimeout
        ? current.autoLockTimeout
        : incoming.autoLockTimeout,
    theme:
      current.theme !== DEFAULT_SETTINGS.theme
        ? current.theme
        : incoming.theme,
  };

  return merged;
}

export async function importBackupFromJson(
  json: string,
  options?: ImportOptions,
): Promise<ImportResult> {
  const parsed = parseBackupJson(json);
  const strategy: DuplicateStrategy = options?.duplicateStrategy ?? 'skip';

  const [currentVault, currentCategories, currentSettings] = await Promise.all([
    loadVault(),
    loadCategories(),
    loadSettings(),
  ]);

  const legacyResult = await restoreLegacyImages(parsed.legacyImages || [], currentVault);
  updateImportedVaultImages(parsed.vault, legacyResult.imageMap);

  const assetsResult = await restoreAssets(parsed.assets, strategy);

  const mergedVault = mergeVaultData(currentVault, parsed.vault, strategy);
  const vaultWithUris = applyLegacyImageUris(mergedVault.merged);
  const vaultSaved = await saveVault(vaultWithUris);
  if (!vaultSaved) {
    throw new Error('Failed to save vault data during import.');
  }

  const mergedCategories = mergeCategoriesData(currentCategories, parsed.categories, strategy);
  const categoriesSaved = await saveCategories(mergedCategories.merged);
  if (!categoriesSaved) {
    throw new Error('Failed to save categories during import.');
  }

  const mergedSettings = mergeSettings(currentSettings, parsed.settings);
  const settingsSaved = await saveSettings(mergedSettings);
  if (!settingsSaved) {
    logger.warn('Settings did not persist during import (expected on Expo Go).');
  }

  const summary: ImportSummary = {
    items: mergedVault.counts,
    assets: assetsResult,
    categories: mergedCategories.counts,
    legacyImagesRestored: legacyResult.restoredCount,
  };

  return {
    summary,
    settings: mergedSettings,
  };
}
