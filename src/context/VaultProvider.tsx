/**
 * Vault data context provider
 * Manages vault items state and CRUD operations
 * Works in-memory first, then tries to persist to SecureStore
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import type { VaultItem, VaultItemType, VaultData } from '../utils/types';
import * as vaultStorage from '../storage/vaultStorage';
import { useAuthLock } from './AuthLockProvider';
import { logger } from '../utils/logger';
import { shouldUseDummyData } from '../config';
import { DUMMY_VAULT_ITEMS, getDummyDataSummary } from '../data/dummyData';

/**
 * Generate a simple UUID v4
 * Fallback that works in React Native without external dependencies
 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface VaultContextValue {
  // State
  items: VaultItem[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refreshVault: () => Promise<void>;
  addItem: (item: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<VaultItem | null>;
  updateItem: (id: string, updates: Partial<Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<VaultItem | null>;
  deleteItem: (id: string) => Promise<boolean>;
  getItem: (id: string) => VaultItem | undefined;
  
  // Filtered views
  getItemsByType: (type: VaultItemType) => VaultItem[];
  searchItems: (query: string) => VaultItem[];
}

const VaultContext = createContext<VaultContextValue | null>(null);

interface VaultProviderProps {
  children: React.ReactNode;
}

export function VaultProvider({ children }: VaultProviderProps) {
  const { isLocked } = useAuthLock();
  
  const [items, setItems] = useState<VaultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load vault when unlocked
  useEffect(() => {
    if (!isLocked && !hasLoaded) {
      refreshVault();
    }
    
    // Clear items when locked for security
    if (isLocked) {
      setItems([]);
      setHasLoaded(false);
    }
  }, [isLocked, hasLoaded]);

  // Refresh vault data from storage
  const refreshVault = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if dummy data should be loaded
      if (shouldUseDummyData()) {
        const summary = getDummyDataSummary();
        console.log('🧪 [DEV] Loading dummy data:', summary);
        setItems(DUMMY_VAULT_ITEMS);
        setHasLoaded(true);
        logger.vaultOperation('refresh (DUMMY DATA)', DUMMY_VAULT_ITEMS.length);
        return;
      }

      const data = await vaultStorage.loadVault();
      setItems(data.items);
      setHasLoaded(true);
      logger.vaultOperation('refresh', data.items.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load vault';
      setError(message);
      logger.error('Failed to refresh vault:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add new item - manages state in-memory first, then tries to persist
  const addItem = useCallback(async (
    item: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<VaultItem | null> => {
    // Create item with ID and timestamps locally
    const now = new Date().toISOString();
    const newItem: VaultItem = {
      id: generateId(),
      type: item.type,
      label: item.label,
      fields: { ...item.fields },
      images: item.images, // Include images
      createdAt: now,
      updatedAt: now,
    };
    
    // Update local state immediately
    setItems(prev => [...prev, newItem]);
    logger.vaultOperation('add item');
    
    // Try to persist to storage in background (may fail in Expo Go)
    // Use setTimeout to ensure state is updated first
    setTimeout(() => {
      setItems(currentItems => {
        vaultStorage.saveVault({ version: 1, items: currentItems }).catch(() => {
          logger.debug('Item added to memory but not persisted');
        });
        return currentItems;
      });
    }, 100);
    
    return newItem;
  }, []);

  // Update existing item - manages state in-memory first, then tries to persist
  const updateItem = useCallback(async (
    id: string,
    updates: Partial<Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<VaultItem | null> => {
    // Find existing item
    const existingItem = items.find(item => item.id === id);
    if (!existingItem) {
      logger.debug('Item not found for update');
      return null;
    }
    
    // Create updated item locally
    const updatedItem: VaultItem = {
      id: existingItem.id,
      type: updates.type ?? existingItem.type,
      label: updates.label ?? existingItem.label,
      fields: updates.fields ? { ...updates.fields } : { ...existingItem.fields },
      images: updates.images !== undefined ? updates.images : existingItem.images, // Include images
      createdAt: existingItem.createdAt,
      updatedAt: new Date().toISOString(),
    };
    
    // Update local state immediately
    setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
    logger.vaultOperation('update item');
    
    // Try to persist in background
    setTimeout(() => {
      setItems(currentItems => {
        vaultStorage.saveVault({ version: 1, items: currentItems }).catch(() => {
          logger.debug('Item updated in memory but not persisted');
        });
        return currentItems;
      });
    }, 100);
    
    return updatedItem;
  }, [items]);

  // Delete item - manages state in-memory first, then tries to persist
  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    // Check if item exists
    const existingItem = items.find(item => item.id === id);
    if (!existingItem) {
      logger.debug('Item not found for deletion');
      return false;
    }
    
    // Update local state immediately
    setItems(prev => prev.filter(item => item.id !== id));
    logger.vaultOperation('delete item');
    
    // Try to persist in background
    setTimeout(() => {
      setItems(currentItems => {
        vaultStorage.saveVault({ version: 1, items: currentItems }).catch(() => {
          logger.debug('Item deleted from memory but not persisted');
        });
        return currentItems;
      });
    }, 100);
    
    return true;
  }, [items]);

  // Get single item by ID
  const getItem = useCallback((id: string): VaultItem | undefined => {
    return items.find(item => item.id === id);
  }, [items]);

  // Get items filtered by type
  const getItemsByType = useCallback((type: VaultItemType): VaultItem[] => {
    return items.filter(item => item.type === type);
  }, [items]);

  // Search items
  const searchItems = useCallback((query: string): VaultItem[] => {
    const lowerQuery = query.toLowerCase().trim();
    
    if (!lowerQuery) return items;
    
    return items.filter(item => {
      // Search in label
      if (item.label.toLowerCase().includes(lowerQuery)) return true;
      
      // Search in non-sensitive fields
      const searchableFields = ['bankName', 'serviceName', 'cardNickname', 'idType', 'title'];
      for (const key of searchableFields) {
        if (item.fields[key]?.toLowerCase().includes(lowerQuery)) return true;
      }
      
      // Match last 4 digits exactly
      if (/^\d{4}$/.test(lowerQuery)) {
        if (item.fields.lastFourDigits === lowerQuery) return true;
        if (item.fields.accountNumber?.endsWith(lowerQuery)) return true;
      }
      
      return false;
    });
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      isLoading,
      error,
      refreshVault,
      addItem,
      updateItem,
      deleteItem,
      getItem,
      getItemsByType,
      searchItems,
    }),
    [
      items,
      isLoading,
      error,
      refreshVault,
      addItem,
      updateItem,
      deleteItem,
      getItem,
      getItemsByType,
      searchItems,
    ]
  );

  return (
    <VaultContext.Provider value={value}>
      {children}
    </VaultContext.Provider>
  );
}

/**
 * Hook to access vault context
 */
export function useVault(): VaultContextValue {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}

/**
 * Hook to get items grouped by type
 */
export function useGroupedItems(): Map<VaultItemType, VaultItem[]> {
  const { items } = useVault();
  
  return useMemo(() => {
    const grouped = new Map<VaultItemType, VaultItem[]>();
    
    for (const item of items) {
      const existing = grouped.get(item.type) || [];
      grouped.set(item.type, [...existing, item]);
    }
    
    return grouped;
  }, [items]);
}

