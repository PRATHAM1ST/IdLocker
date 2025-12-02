/**
 * Vault storage layer using expo-secure-store with chunking support
 * Handles all persistence operations for vault data and settings
 */

import * as SecureStore from 'expo-secure-store';
import { v4 as uuidv4 } from 'uuid';
import type { VaultData, VaultItem, VaultMeta, AppSettings } from '../utils/types';
import { isVaultData, isAppSettings } from '../utils/types';
import { STORAGE_KEYS, CHUNK_SIZE, DEFAULT_SETTINGS } from '../utils/constants';
import { logger } from '../utils/logger';

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
    const metaStr = await SecureStore.getItemAsync(
      STORAGE_KEYS.VAULT_META,
      SECURE_STORE_OPTIONS
    );
    
    if (!metaStr) return null;
    
    const meta = JSON.parse(metaStr) as VaultMeta;
    return meta;
  } catch (error) {
    logger.error('Failed to load vault metadata:', error);
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
      logger.error('Missing vault chunks, data may be corrupted');
      return { version: 1, items: [] };
    }
    
    // Reassemble JSON
    const jsonStr = chunks.join('');
    const data = JSON.parse(jsonStr);
    
    if (!isVaultData(data)) {
      logger.error('Invalid vault data format');
      return { version: 1, items: [] };
    }
    
    logger.vaultOperation('load', data.items.length);
    return data;
  } catch (error) {
    logger.error('Failed to load vault:', error);
    return { version: 1, items: [] };
  }
}

/**
 * Save vault data to SecureStore
 * Automatically chunks data if needed
 */
export async function saveVault(data: VaultData): Promise<boolean> {
  try {
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
    logger.error('Failed to save vault:', error);
    return false;
  }
}

/**
 * Add a new item to the vault
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
    
    const success = await saveVault(vault);
    if (!success) return null;
    
    logger.vaultOperation('add item');
    return newItem;
  } catch (error) {
    logger.error('Failed to add item:', error);
    return null;
  }
}

/**
 * Update an existing item in the vault
 */
export async function updateItem(
  id: string,
  updates: Partial<Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<VaultItem | null> {
  try {
    const vault = await loadVault();
    
    const index = vault.items.findIndex(item => item.id === id);
    if (index === -1) {
      logger.warn('Item not found for update:', id);
      return null;
    }
    
    const updatedItem: VaultItem = {
      ...vault.items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    vault.items[index] = updatedItem;
    
    const success = await saveVault(vault);
    if (!success) return null;
    
    logger.vaultOperation('update item');
    return updatedItem;
  } catch (error) {
    logger.error('Failed to update item:', error);
    return null;
  }
}

/**
 * Delete an item from the vault
 */
export async function deleteItem(id: string): Promise<boolean> {
  try {
    const vault = await loadVault();
    
    const index = vault.items.findIndex(item => item.id === id);
    if (index === -1) {
      logger.warn('Item not found for deletion:', id);
      return false;
    }
    
    vault.items.splice(index, 1);
    
    const success = await saveVault(vault);
    logger.vaultOperation('delete item');
    return success;
  } catch (error) {
    logger.error('Failed to delete item:', error);
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
    logger.error('Failed to get item:', error);
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
    logger.error('Failed to clear vault:', error);
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
  try {
    const settingsStr = await SecureStore.getItemAsync(
      STORAGE_KEYS.APP_SETTINGS,
      SECURE_STORE_OPTIONS
    );
    
    if (!settingsStr) {
      return DEFAULT_SETTINGS;
    }
    
    const settings = JSON.parse(settingsStr);
    
    if (!isAppSettings(settings)) {
      logger.warn('Invalid settings format, using defaults');
      return DEFAULT_SETTINGS;
    }
    
    return settings;
  } catch (error) {
    logger.error('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save app settings to SecureStore
 */
export async function saveSettings(settings: AppSettings): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(
      STORAGE_KEYS.APP_SETTINGS,
      JSON.stringify(settings),
      SECURE_STORE_OPTIONS
    );
    
    logger.info('Settings saved');
    return true;
  } catch (error) {
    logger.error('Failed to save settings:', error);
    return false;
  }
}

/**
 * Update specific settings
 */
export async function updateSettings(
  updates: Partial<AppSettings>
): Promise<AppSettings | null> {
  try {
    const current = await loadSettings();
    const updated = { ...current, ...updates };
    
    const success = await saveSettings(updated);
    return success ? updated : null;
  } catch (error) {
    logger.error('Failed to update settings:', error);
    return null;
  }
}

/**
 * Mark onboarding as complete
 */
export async function completeOnboarding(): Promise<boolean> {
  const result = await updateSettings({ hasCompletedOnboarding: true });
  return result !== null;
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

