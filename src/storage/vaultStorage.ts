/**
 * Vault storage layer using expo-secure-store with chunking support
 * Handles all persistence operations for vault data and settings
 */

import * as SecureStore from 'expo-secure-store';
import { v4 as uuidv4 } from 'uuid';
import type { VaultData, VaultItem, VaultMeta, AppSettings, CategoriesData, CustomCategory } from '../utils/types';
import { isVaultData, isAppSettings, isCategoriesData } from '../utils/types';
import { STORAGE_KEYS, CHUNK_SIZE, DEFAULT_SETTINGS, DEFAULT_CATEGORIES } from '../utils/constants';
import { logger } from '../utils/logger';
import { deleteImages } from './imageStorage';

// SecureStore options
const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  // We manage auth at app level, so don't require biometric for each read/write
  requireAuthentication: false,
};

/**
 * Split string into chunks of specified size
 */
function chunkString(str: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size));
  }
  return chunks;
}

/**
 * Load vault metadata
 */
async function loadVaultMeta(): Promise<VaultMeta | null> {
  try {
    // Check availability first
    const isAvailable = await SecureStore.isAvailableAsync();
    if (!isAvailable) {
      return null;
    }

    const metaStr = await SecureStore.getItemAsync(
      STORAGE_KEYS.VAULT_META,
      SECURE_STORE_OPTIONS
    );
    
    if (!metaStr) return null;
    
    const meta = JSON.parse(metaStr) as VaultMeta;
    return meta;
  } catch (error) {
    // Don't log as error - this can happen on first run
    logger.debug('No vault metadata found');
    return null;
  }
}

/**
 * Save vault metadata
 */
async function saveVaultMeta(meta: VaultMeta): Promise<void> {
  await SecureStore.setItemAsync(
    STORAGE_KEYS.VAULT_META,
    JSON.stringify(meta),
    SECURE_STORE_OPTIONS
  );
}

/**
 * Delete all vault chunks
 */
async function deleteAllChunks(chunkCount: number): Promise<void> {
  const deletePromises: Promise<void>[] = [];
  
  for (let i = 0; i < chunkCount; i++) {
    deletePromises.push(
      SecureStore.deleteItemAsync(
        `${STORAGE_KEYS.VAULT_CHUNK_PREFIX}${i}`,
        SECURE_STORE_OPTIONS
      )
    );
  }
  
  await Promise.all(deletePromises);
}

/**
 * Load vault data from SecureStore
 * Handles chunked storage automatically
 */
export async function loadVault(): Promise<VaultData> {
  try {
    const meta = await loadVaultMeta();
    
    if (!meta) {
      logger.vaultOperation('load', 0);
      return { version: 1, items: [] };
    }
    
    // Load all chunks
    const chunkPromises: Promise<string | null>[] = [];
    for (let i = 0; i < meta.chunkCount; i++) {
      chunkPromises.push(
        SecureStore.getItemAsync(
          `${STORAGE_KEYS.VAULT_CHUNK_PREFIX}${i}`,
          SECURE_STORE_OPTIONS
        )
      );
    }
    
    const chunks = await Promise.all(chunkPromises);
    
    // Check for missing chunks
    if (chunks.some(chunk => chunk === null)) {
      logger.warn('Missing vault chunks, starting fresh');
      return { version: 1, items: [] };
    }
    
    // Reassemble JSON
    const jsonStr = chunks.join('');
    const data = JSON.parse(jsonStr);
    
    if (!isVaultData(data)) {
      logger.warn('Invalid vault data format, starting fresh');
      return { version: 1, items: [] };
    }
    
    logger.vaultOperation('load', data.items.length);
    return data;
  } catch (error) {
    // Don't log as error - can happen in Expo Go
    logger.debug('Could not load vault, starting fresh');
    return { version: 1, items: [] };
  }
}

/**
 * Save vault data to SecureStore
 * Automatically chunks data if needed
 * Note: May fail in Expo Go - use development build for full persistence
 */
export async function saveVault(data: VaultData): Promise<boolean> {
  try {
    // Check availability
    const isAvailable = await SecureStore.isAvailableAsync();
    if (!isAvailable) {
      logger.debug('SecureStore not available, vault will not persist');
      return false;
    }

    const jsonStr = JSON.stringify(data);
    const chunks = chunkString(jsonStr, CHUNK_SIZE);
    
    // Get existing meta to clean up old chunks
    const existingMeta = await loadVaultMeta();
    if (existingMeta && existingMeta.chunkCount > chunks.length) {
      // Delete extra chunks from previous save
      for (let i = chunks.length; i < existingMeta.chunkCount; i++) {
        await SecureStore.deleteItemAsync(
          `${STORAGE_KEYS.VAULT_CHUNK_PREFIX}${i}`,
          SECURE_STORE_OPTIONS
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
          SECURE_STORE_OPTIONS
        )
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
    // In Expo Go, SecureStore may fail - this is expected
    logger.debug('Vault not persisted (expected in Expo Go)');
    return false;
  }
}

/**
 * Add a new item to the vault
 * Returns the new item even if persistence fails (for in-memory use in Expo Go)
 */
export async function addItem(
  item: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<VaultItem | null> {
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
    logger.debug('Could not add item');
    return null;
  }
}

/**
 * Update an existing item in the vault
 * Returns updated item even if persistence fails
 */
export async function updateItem(
  id: string,
  updates: Partial<Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<VaultItem | null> {
  try {
    const vault = await loadVault();
    
    const index = vault.items.findIndex(item => item.id === id);
    if (index === -1) {
      logger.debug('Item not found for update');
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
    logger.debug('Could not update item');
    return null;
  }
}

/**
 * Delete an item from the vault
 * Returns true even if persistence fails (item removed from memory)
 * Also cleans up associated images
 */
export async function deleteItem(id: string): Promise<boolean> {
  try {
    const vault = await loadVault();
    
    const index = vault.items.findIndex(item => item.id === id);
    if (index === -1) {
      logger.debug('Item not found for deletion');
      return false;
    }

    // Get the item to delete its images
    const itemToDelete = vault.items[index];
    
    // Delete associated images if any
    if (itemToDelete.images && itemToDelete.images.length > 0) {
      await deleteImages(itemToDelete.images);
      logger.debug(`Deleted ${itemToDelete.images.length} images for item`);
    }
    
    vault.items.splice(index, 1);
    
    // Try to save
    await saveVault(vault);
    logger.vaultOperation('delete item');
    return true;
  } catch (error) {
    logger.debug('Could not delete item');
    return false;
  }
}

/**
 * Get a single item by ID
 */
export async function getItem(id: string): Promise<VaultItem | null> {
  try {
    const vault = await loadVault();
    return vault.items.find(item => item.id === id) || null;
  } catch (error) {
    logger.debug('Could not get item');
    return null;
  }
}

/**
 * Clear all vault data (for testing or user request)
 */
export async function clearVault(): Promise<boolean> {
  try {
    const meta = await loadVaultMeta();
    
    if (meta) {
      await deleteAllChunks(meta.chunkCount);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.VAULT_META, SECURE_STORE_OPTIONS);
    }
    
    logger.vaultOperation('clear');
    return true;
  } catch (error) {
    // May fail in Expo Go
    logger.debug('Could not clear vault');
    return true; // Return true anyway to allow UI to proceed
  }
}

// ============================================
// Settings Storage
// ============================================

/**
 * Load app settings from SecureStore
 */
export async function loadSettings(): Promise<AppSettings> {
  try {
    // Check if SecureStore is available first
    const isAvailable = await SecureStore.isAvailableAsync();
    if (!isAvailable) {
      logger.warn('SecureStore not available, using default settings');
      return DEFAULT_SETTINGS;
    }

    const settingsStr = await SecureStore.getItemAsync(
      STORAGE_KEYS.APP_SETTINGS,
      SECURE_STORE_OPTIONS
    );
    
    if (!settingsStr) {
      // First run - no settings stored yet, this is normal
      logger.debug('No settings found, using defaults');
      return DEFAULT_SETTINGS;
    }
    
    const settings = JSON.parse(settingsStr);
    
    if (!isAppSettings(settings)) {
      logger.warn('Invalid settings format, using defaults');
      return DEFAULT_SETTINGS;
    }
    
    return settings;
  } catch (error) {
    // Only log as debug since this can happen normally on first run
    logger.debug('Could not load settings, using defaults');
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save app settings to SecureStore
 * Note: In Expo Go, SecureStore may report as available but fail on write.
 * This is expected behavior - settings will persist only in development builds.
 */
export async function saveSettings(settings: AppSettings): Promise<boolean> {
  try {
    // Check if SecureStore is available
    const isAvailable = await SecureStore.isAvailableAsync();
    if (!isAvailable) {
      logger.debug('SecureStore not available, settings will not persist');
      return false;
    }

    await SecureStore.setItemAsync(
      STORAGE_KEYS.APP_SETTINGS,
      JSON.stringify(settings),
      SECURE_STORE_OPTIONS
    );
    
    logger.debug('Settings saved');
    return true;
  } catch (error) {
    // In Expo Go, SecureStore may fail even when isAvailableAsync returns true
    // This is expected - settings will use defaults each session
    logger.debug('Settings not persisted (expected in Expo Go)');
    return false;
  }
}

/**
 * Update specific settings
 * Returns the updated settings even if persistence fails (for in-memory use)
 */
export async function updateSettings(
  updates: Partial<AppSettings>
): Promise<AppSettings | null> {
  try {
    const current = await loadSettings();
    const updated = { ...current, ...updates };
    
    // Try to save, but return updated settings even if save fails
    // This allows the app to work with in-memory settings in Expo Go
    await saveSettings(updated);
    return updated;
  } catch (error) {
    logger.debug('Could not update settings');
    return null;
  }
}

/**
 * Mark onboarding as complete
 * Note: In Expo Go, this may not persist between sessions
 */
export async function completeOnboarding(): Promise<boolean> {
  const result = await updateSettings({ hasCompletedOnboarding: true });
  // Return true even if persistence fails - allows app to continue
  return true;
}

/**
 * Check if vault is available (SecureStore is working)
 */
export async function checkVaultAvailability(): Promise<boolean> {
  try {
    const available = await SecureStore.isAvailableAsync();
    return available;
  } catch {
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
  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (!isAvailable) {
      logger.debug('SecureStore not available, using default categories');
      return { version: 1, categories: DEFAULT_CATEGORIES };
    }

    const categoriesStr = await SecureStore.getItemAsync(
      STORAGE_KEYS.CATEGORIES,
      SECURE_STORE_OPTIONS
    );
    
    if (!categoriesStr) {
      logger.debug('No categories found, using defaults');
      return { version: 1, categories: DEFAULT_CATEGORIES };
    }
    
    const data = JSON.parse(categoriesStr);
    
    if (!isCategoriesData(data)) {
      logger.warn('Invalid categories data format, using defaults');
      return { version: 1, categories: DEFAULT_CATEGORIES };
    }
    
    logger.debug('Categories loaded:', data.categories.length);
    return data;
  } catch (error) {
    logger.debug('Could not load categories, using defaults');
    return { version: 1, categories: DEFAULT_CATEGORIES };
  }
}

/**
 * Save categories to SecureStore
 */
export async function saveCategories(data: CategoriesData): Promise<boolean> {
  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (!isAvailable) {
      logger.debug('SecureStore not available, categories will not persist');
      return false;
    }

    await SecureStore.setItemAsync(
      STORAGE_KEYS.CATEGORIES,
      JSON.stringify(data),
      SECURE_STORE_OPTIONS
    );
    
    logger.debug('Categories saved:', data.categories.length);
    return true;
  } catch (error) {
    logger.debug('Categories not persisted (expected in Expo Go)');
    return false;
  }
}

/**
 * Add a new category
 */
export async function addCategory(
  category: Omit<CustomCategory, 'createdAt' | 'updatedAt'>
): Promise<CustomCategory | null> {
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
    
    logger.debug('Category added:', newCategory.id);
    return newCategory;
  } catch (error) {
    logger.debug('Could not add category');
    return null;
  }
}

/**
 * Update an existing category
 */
export async function updateCategory(
  id: string,
  updates: Partial<Omit<CustomCategory, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<CustomCategory | null> {
  try {
    const data = await loadCategories();
    
    const index = data.categories.findIndex(cat => cat.id === id);
    if (index === -1) {
      logger.debug('Category not found for update');
      return null;
    }
    
    const updatedCategory: CustomCategory = {
      ...data.categories[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    data.categories[index] = updatedCategory;
    await saveCategories(data);
    
    logger.debug('Category updated:', id);
    return updatedCategory;
  } catch (error) {
    logger.debug('Could not update category');
    return null;
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string): Promise<boolean> {
  try {
    const data = await loadCategories();
    
    const index = data.categories.findIndex(cat => cat.id === id);
    if (index === -1) {
      logger.debug('Category not found for deletion');
      return false;
    }
    
    data.categories.splice(index, 1);
    await saveCategories(data);
    
    logger.debug('Category deleted:', id);
    return true;
  } catch (error) {
    logger.debug('Could not delete category');
    return false;
  }
}

/**
 * Get a single category by ID
 */
export async function getCategory(id: string): Promise<CustomCategory | null> {
  try {
    const data = await loadCategories();
    return data.categories.find(cat => cat.id === id) || null;
  } catch (error) {
    logger.debug('Could not get category');
    return null;
  }
}

/**
 * Reset categories to defaults
 */
export async function resetCategoriesToDefaults(): Promise<boolean> {
  try {
    await saveCategories({ version: 1, categories: DEFAULT_CATEGORIES });
    logger.debug('Categories reset to defaults');
    return true;
  } catch (error) {
    logger.debug('Could not reset categories');
    return false;
  }
}

