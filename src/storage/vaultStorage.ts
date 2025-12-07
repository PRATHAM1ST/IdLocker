/**
 * Vault storage layer using expo-secure-store with chunking support
 * Handles all persistence operations for vault data and settings
 */

import * as SecureStore from 'expo-secure-store';
import { v4 as uuidv4 } from 'uuid';
import { CHUNK_SIZE, DEFAULT_CATEGORIES, DEFAULT_SETTINGS, STORAGE_KEYS } from '../utils/constants';
import { logger } from '../utils/logger';
import type {
  AppSettings,
  CategoriesData,
  CustomCategory,
  VaultData,
  VaultItem,
  VaultMeta,
} from '../utils/types';
import { isAppSettings, isCategoriesData, isVaultData } from '../utils/types';
import { clearAssetsStorage } from './assetStorage';
import { clearAllImages, deleteImages } from './imageStorage';

// SecureStore options
const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  // We manage auth at app level, so don't require biometric for each read/write
  requireAuthentication: false,
};

/**
 * Split string into chunks of specified size
 */
function chunkString(str: string, size: number): string[] {
  try {
    const chunks: string[] = [];
    for (let i = 0; i < str.length; i += size) {
      chunks.push(str.slice(i, i + size));
    }
    return chunks;
  } catch (error) {
    logger.error('chunkString: Error splitting string', error);
    return [str]; // Fallback to returning original string as single chunk
  }
}

/**
 * Load vault metadata
 */
async function loadVaultMeta(): Promise<VaultMeta | null> {
  logger.debug('loadVaultMeta: Starting');
  try {
    // Check availability first
    const isAvailable = await SecureStore.isAvailableAsync();
    if (!isAvailable) {
      logger.warn('loadVaultMeta: SecureStore not available');
      return null;
    }

    const metaStr = await SecureStore.getItemAsync(STORAGE_KEYS.VAULT_META, SECURE_STORE_OPTIONS);

    if (!metaStr) {
      logger.debug('loadVaultMeta: No metadata found');
      return null;
    }

    const meta = JSON.parse(metaStr) as VaultMeta;
    logger.debug('loadVaultMeta: Success', meta);
    return meta;
  } catch (error) {
    logger.error('loadVaultMeta: Error', error);
    return null;
  }
}

/**
 * Save vault metadata
 */
async function saveVaultMeta(meta: VaultMeta): Promise<void> {
  logger.debug('saveVaultMeta: Starting', meta);
  try {
    await SecureStore.setItemAsync(
      STORAGE_KEYS.VAULT_META,
      JSON.stringify(meta),
      SECURE_STORE_OPTIONS,
    );
    logger.debug('saveVaultMeta: Success');
  } catch (error) {
    logger.error('saveVaultMeta: Error', error);
    throw error; // Propagate to caller
  }
}

/**
 * Delete all vault chunks
 */
async function deleteAllChunks(chunkCount: number): Promise<void> {
  logger.debug(`deleteAllChunks: Starting deletion of ${chunkCount} chunks`);
  try {
    const deletePromises: Promise<void>[] = [];

    for (let i = 0; i < chunkCount; i++) {
      deletePromises.push(
        SecureStore.deleteItemAsync(`${STORAGE_KEYS.VAULT_CHUNK_PREFIX}${i}`, SECURE_STORE_OPTIONS),
      );
    }

    await Promise.all(deletePromises);
    logger.debug('deleteAllChunks: Success');
  } catch (error) {
    logger.error('deleteAllChunks: Error', error);
    throw error;
  }
}

async function purgeVaultStorage(): Promise<void> {
  const meta = await loadVaultMeta();

  if (meta) {
    await deleteAllChunks(meta.chunkCount);
  }

  await SecureStore.deleteItemAsync(STORAGE_KEYS.VAULT_META, SECURE_STORE_OPTIONS);
}

/**
 * Load vault data from SecureStore
 * Handles chunked storage automatically
 */
export async function loadVault(): Promise<VaultData> {
  logger.debug('loadVault: Starting');
  try {
    const meta = await loadVaultMeta();

    if (!meta) {
      logger.vaultOperation('load', 0);
      logger.debug('loadVault: No meta, returning empty vault');
      return { version: 1, items: [] };
    }

    logger.debug(`loadVault: Loading ${meta.chunkCount} chunks`);
    // Load all chunks
    const chunkPromises: Promise<string | null>[] = [];
    for (let i = 0; i < meta.chunkCount; i++) {
      chunkPromises.push(
        SecureStore.getItemAsync(`${STORAGE_KEYS.VAULT_CHUNK_PREFIX}${i}`, SECURE_STORE_OPTIONS),
      );
    }

    const chunks = await Promise.all(chunkPromises);

    // Check for missing chunks
    if (chunks.some((chunk) => chunk === null)) {
      logger.warn('loadVault: Missing vault chunks, starting fresh');
      return { version: 1, items: [] };
    }

    // Reassemble JSON
    const jsonStr = chunks.join('');
    const data = JSON.parse(jsonStr);

    if (!isVaultData(data)) {
      logger.warn('loadVault: Invalid vault data format, starting fresh');
      return { version: 1, items: [] };
    }

    logger.vaultOperation('load', data.items.length);
    return data;
  } catch (error) {
    logger.error('loadVault: Error loading vault', error);
    return { version: 1, items: [] };
  }
}

/**
 * Save vault data to SecureStore
 * Automatically chunks data if needed
 * Note: May fail in Expo Go - use development build for full persistence
 */
export async function saveVault(data: VaultData): Promise<boolean> {
  logger.debug('saveVault: Starting save operation');
  try {
    // Check availability
    const isAvailable = await SecureStore.isAvailableAsync();
    if (!isAvailable) {
      logger.warn('saveVault: SecureStore not available, vault will not persist');
      return false;
    }

    const jsonStr = JSON.stringify(data);
    const chunks = chunkString(jsonStr, CHUNK_SIZE);
    logger.debug(`saveVault: Data split into ${chunks.length} chunks`);

    // Get existing meta to clean up old chunks
    const existingMeta = await loadVaultMeta();
    if (existingMeta && existingMeta.chunkCount > chunks.length) {
      logger.debug(
        `saveVault: Cleaning up ${existingMeta.chunkCount - chunks.length} extra chunks`,
      );
      // Delete extra chunks from previous save
      for (let i = chunks.length; i < existingMeta.chunkCount; i++) {
        await SecureStore.deleteItemAsync(
          `${STORAGE_KEYS.VAULT_CHUNK_PREFIX}${i}`,
          SECURE_STORE_OPTIONS,
        );
      }
    }

    // Save all chunks
    const savePromises: Promise<void>[] = [];
    for (let i = 0; i < chunks.length; i++) {
      savePromises.push(
        SecureStore.setItemAsync(
          `${STORAGE_KEYS.VAULT_CHUNK_PREFIX}${i}`,
          chunks[i],
          SECURE_STORE_OPTIONS,
        ),
      );
    }

    await Promise.all(savePromises);

    // Save metadata
    const meta: VaultMeta = {
      version: data.version,
      chunkCount: chunks.length,
      lastUpdated: new Date().toISOString(),
    };
    await saveVaultMeta(meta);

    logger.vaultOperation('save', data.items.length);
    return true;
  } catch (error) {
    logger.error('saveVault: Error saving vault (expected in Expo Go)', error);
    return false;
  }
}

/**
 * Add a new item to the vault
 * Returns the new item even if persistence fails (for in-memory use in Expo Go)
 */
export async function addItem(
  item: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<VaultItem | null> {
  logger.debug('addItem: Starting');
  try {
    const vault = await loadVault();

    const now = new Date().toISOString();
    const newItem: VaultItem = {
      ...item,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    vault.items.push(newItem);

    // Try to save, but return item even if save fails
    await saveVault(vault);

    logger.vaultOperation('add item');
    return newItem;
  } catch (error) {
    logger.error('addItem: Error adding item', error);
    return null;
  }
}

/**
 * Update an existing item in the vault
 * Returns updated item even if persistence fails
 */
export async function updateItem(
  id: string,
  updates: Partial<Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<VaultItem | null> {
  logger.debug(`updateItem: Starting update for ${id}`);
  try {
    const vault = await loadVault();

    const index = vault.items.findIndex((item) => item.id === id);
    if (index === -1) {
      logger.warn(`updateItem: Item ${id} not found`);
      return null;
    }

    const updatedItem: VaultItem = {
      ...vault.items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    vault.items[index] = updatedItem;

    // Try to save, but return item even if save fails
    await saveVault(vault);

    logger.vaultOperation('update item');
    return updatedItem;
  } catch (error) {
    logger.error('updateItem: Error updating item', error);
    return null;
  }
}

/**
 * Delete an item from the vault
 * Returns true even if persistence fails (item removed from memory)
 * Also cleans up associated images
 */
export async function deleteItem(id: string): Promise<boolean> {
  logger.debug(`deleteItem: Starting deletion for ${id}`);
  try {
    const vault = await loadVault();

    const index = vault.items.findIndex((item) => item.id === id);
    if (index === -1) {
      logger.warn(`deleteItem: Item ${id} not found`);
      return false;
    }

    // Get the item to delete its images
    const itemToDelete = vault.items[index];

    // Delete associated images if any
    if (itemToDelete.images && itemToDelete.images.length > 0) {
      try {
        await deleteImages(itemToDelete.images);
        logger.debug(`deleteItem: Deleted ${itemToDelete.images.length} images`);
      } catch (imgError) {
        logger.error('deleteItem: Error deleting images', imgError);
        // Continue with item deletion even if image deletion fails
      }
    }

    vault.items.splice(index, 1);

    // Try to save
    await saveVault(vault);
    logger.vaultOperation('delete item');
    return true;
  } catch (error) {
    logger.error('deleteItem: Error deleting item', error);
    return false;
  }
}

/**
 * Get a single item by ID
 */
export async function getItem(id: string): Promise<VaultItem | null> {
  logger.debug(`getItem: Fetching item ${id}`);
  try {
    const vault = await loadVault();
    const item = vault.items.find((item) => item.id === id) || null;
    if (!item) logger.debug(`getItem: Item ${id} not found`);
    return item;
  } catch (error) {
    logger.error('getItem: Error fetching item', error);
    return null;
  }
}

/**
 * Clear all vault data (for testing or user request)
 */
export async function clearVault(): Promise<boolean> {
  logger.debug('clearVault: Starting vault clear');
  try {
    await purgeVaultStorage();
    logger.vaultOperation('clear');
    return true;
  } catch (error) {
    logger.error('clearVault: Error clearing vault', error);
    return false;
  }
}

/**
 * Clear every persisted surface including vault items, settings, categories, and attachments
 */
export async function clearAllData(): Promise<boolean> {
  logger.debug('clearAllData: Starting full data wipe');
  try {
    await purgeVaultStorage();

    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.APP_SETTINGS, SECURE_STORE_OPTIONS),
      SecureStore.deleteItemAsync(STORAGE_KEYS.CATEGORIES, SECURE_STORE_OPTIONS),
    ]);

    await Promise.all([clearAssetsStorage(), clearAllImages()]);

    logger.vaultOperation('clear all data');
    return true;
  } catch (error) {
    logger.error('clearAllData: Error clearing all data', error);
    return false;
  }
}

// ============================================
// Settings Storage
// ============================================

/**
 * Load app settings from SecureStore
 */
export async function loadSettings(): Promise<AppSettings> {
  logger.debug('loadSettings: Starting');
  try {
    // Check if SecureStore is available first
    const isAvailable = await SecureStore.isAvailableAsync();
    if (!isAvailable) {
      logger.warn('loadSettings: SecureStore not available, using default settings');
      return DEFAULT_SETTINGS;
    }

    const settingsStr = await SecureStore.getItemAsync(
      STORAGE_KEYS.APP_SETTINGS,
      SECURE_STORE_OPTIONS,
    );

    if (!settingsStr) {
      // First run - no settings stored yet, this is normal
      logger.debug('loadSettings: No settings found, using defaults');
      return DEFAULT_SETTINGS;
    }

    const settings = JSON.parse(settingsStr);

    if (!isAppSettings(settings)) {
      logger.warn('loadSettings: Invalid settings format, using defaults');
      return DEFAULT_SETTINGS;
    }

    logger.debug('loadSettings: Success');
    return settings;
  } catch (error) {
    logger.error('loadSettings: Error loading settings', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save app settings to SecureStore
 * Note: In Expo Go, SecureStore may report as available but fail on write.
 * This is expected behavior - settings will persist only in development builds.
 */
export async function saveSettings(settings: AppSettings): Promise<boolean> {
  logger.debug('saveSettings: Starting');
  try {
    // Check if SecureStore is available
    const isAvailable = await SecureStore.isAvailableAsync();
    if (!isAvailable) {
      logger.warn('saveSettings: SecureStore not available, settings will not persist');
      return false;
    }

    await SecureStore.setItemAsync(
      STORAGE_KEYS.APP_SETTINGS,
      JSON.stringify(settings),
      SECURE_STORE_OPTIONS,
    );

    logger.debug('saveSettings: Success');
    return true;
  } catch (error) {
    logger.error('saveSettings: Error saving settings (expected in Expo Go)', error);
    return false;
  }
}

/**
 * Update specific settings
 * Returns the updated settings even if persistence fails (for in-memory use)
 */
export async function updateSettings(updates: Partial<AppSettings>): Promise<AppSettings | null> {
  logger.debug('updateSettings: Starting update', updates);
  try {
    const current = await loadSettings();
    const updated = { ...current, ...updates };

    // Try to save, but return updated settings even if save fails
    // This allows the app to work with in-memory settings in Expo Go
    await saveSettings(updated);
    return updated;
  } catch (error) {
    logger.error('updateSettings: Error updating settings', error);
    return null;
  }
}

/**
 * Mark onboarding as complete
 * Note: In Expo Go, this may not persist between sessions
 */
export async function completeOnboarding(): Promise<boolean> {
  logger.debug('completeOnboarding: Starting');
  try {
    const result = await updateSettings({ hasCompletedOnboarding: true });
    logger.debug('completeOnboarding: Success');
    return true;
  } catch (error) {
    logger.error('completeOnboarding: Error', error);
    return true; // Return true to allow app to continue
  }
}

/**
 * Check if vault is available (SecureStore is working)
 */
export async function checkVaultAvailability(): Promise<boolean> {
  logger.debug('checkVaultAvailability: Checking...');
  try {
    const available = await SecureStore.isAvailableAsync();
    logger.debug(`checkVaultAvailability: Result = ${available}`);
    return available;
  } catch (error) {
    logger.error('checkVaultAvailability: Error checking availability', error);
    return false;
  }
}

// ============================================
// Categories Storage
// ============================================

/**
 * Load categories from SecureStore
 * Returns default categories if none are stored
 */
export async function loadCategories(): Promise<CategoriesData> {
  logger.debug('loadCategories: Starting');
  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (!isAvailable) {
      logger.warn('loadCategories: SecureStore not available, using default categories');
      return { version: 1, categories: DEFAULT_CATEGORIES };
    }

    const categoriesStr = await SecureStore.getItemAsync(
      STORAGE_KEYS.CATEGORIES,
      SECURE_STORE_OPTIONS,
    );

    if (!categoriesStr) {
      logger.debug('loadCategories: No categories found, seeding defaults');
      const defaultData: CategoriesData = { version: 1, categories: DEFAULT_CATEGORIES };
      try {
        await saveCategories(defaultData);
      } catch (seedError) {
        logger.warn('loadCategories: Failed to persist default categories', seedError);
      }
      return defaultData;
    }

    const data = JSON.parse(categoriesStr);

    if (!isCategoriesData(data)) {
      logger.warn('loadCategories: Invalid categories data format, using defaults');
      return { version: 1, categories: DEFAULT_CATEGORIES };
    }

    logger.debug('loadCategories: Success', data.categories.length);
    return data;
  } catch (error) {
    logger.error('loadCategories: Error loading categories', error);
    return { version: 1, categories: DEFAULT_CATEGORIES };
  }
}

/**
 * Save categories to SecureStore
 */
export async function saveCategories(data: CategoriesData): Promise<boolean> {
  logger.debug('saveCategories: Starting');
  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (!isAvailable) {
      logger.warn('saveCategories: SecureStore not available, categories will not persist');
      return false;
    }

    await SecureStore.setItemAsync(
      STORAGE_KEYS.CATEGORIES,
      JSON.stringify(data),
      SECURE_STORE_OPTIONS,
    );

    logger.debug('saveCategories: Success', data.categories.length);
    return true;
  } catch (error) {
    logger.error('saveCategories: Error saving categories (expected in Expo Go)', error);
    return false;
  }
}

/**
 * Add a new category
 */
export async function addCategory(
  category: Omit<CustomCategory, 'createdAt' | 'updatedAt'>,
): Promise<CustomCategory | null> {
  logger.debug('addCategory: Starting');
  try {
    const data = await loadCategories();

    const now = new Date().toISOString();
    const newCategory: CustomCategory = {
      ...category,
      createdAt: now,
      updatedAt: now,
    };

    data.categories.push(newCategory);
    await saveCategories(data);

    logger.debug('addCategory: Success', newCategory.id);
    return newCategory;
  } catch (error) {
    logger.error('addCategory: Error adding category', error);
    return null;
  }
}

/**
 * Update an existing category
 */
export async function updateCategory(
  id: string,
  updates: Partial<Omit<CustomCategory, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<CustomCategory | null> {
  logger.debug(`updateCategory: Starting update for ${id}`);
  try {
    const data = await loadCategories();

    const index = data.categories.findIndex((cat) => cat.id === id);
    if (index === -1) {
      logger.warn(`updateCategory: Category ${id} not found`);
      return null;
    }

    const updatedCategory: CustomCategory = {
      ...data.categories[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    data.categories[index] = updatedCategory;
    await saveCategories(data);

    logger.debug('updateCategory: Success', id);
    return updatedCategory;
  } catch (error) {
    logger.error('updateCategory: Error updating category', error);
    return null;
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string): Promise<boolean> {
  logger.debug(`deleteCategory: Starting deletion for ${id}`);
  try {
    const data = await loadCategories();

    const index = data.categories.findIndex((cat) => cat.id === id);
    if (index === -1) {
      logger.warn(`deleteCategory: Category ${id} not found`);
      return false;
    }

    data.categories.splice(index, 1);
    await saveCategories(data);

    logger.debug('deleteCategory: Success', id);
    return true;
  } catch (error) {
    logger.error('deleteCategory: Error deleting category', error);
    return false;
  }
}

/**
 * Get a single category by ID
 */
export async function getCategory(id: string): Promise<CustomCategory | null> {
  logger.debug(`getCategory: Fetching category ${id}`);
  try {
    const data = await loadCategories();
    const cat = data.categories.find((cat) => cat.id === id) || null;
    if (!cat) logger.debug(`getCategory: Category ${id} not found`);
    return cat;
  } catch (error) {
    logger.error('getCategory: Error fetching category', error);
    return null;
  }
}

/**
 * Reset categories to defaults
 */
export async function resetCategoriesToDefaults(): Promise<boolean> {
  logger.debug('resetCategoriesToDefaults: Starting');
  try {
    await saveCategories({ version: 1, categories: DEFAULT_CATEGORIES });
    logger.debug('resetCategoriesToDefaults: Success');
    return true;
  } catch (error) {
    logger.error('resetCategoriesToDefaults: Error resetting categories', error);
    return false;
  }
}
