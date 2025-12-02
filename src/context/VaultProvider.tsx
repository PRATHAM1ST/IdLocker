/**
 * Vault data context provider
 * Manages vault items state and CRUD operations
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

  // Add new item
  const addItem = useCallback(async (
    item: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<VaultItem | null> => {
    try {
      const newItem = await vaultStorage.addItem(item);
      
      if (newItem) {
        setItems(prev => [...prev, newItem]);
        return newItem;
      }
      
      setError('Failed to add item');
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add item';
      setError(message);
      logger.error('Failed to add item:', err);
      return null;
    }
  }, []);

  // Update existing item
  const updateItem = useCallback(async (
    id: string,
    updates: Partial<Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<VaultItem | null> => {
    try {
      const updatedItem = await vaultStorage.updateItem(id, updates);
      
      if (updatedItem) {
        setItems(prev => prev.map(item => 
          item.id === id ? updatedItem : item
        ));
        return updatedItem;
      }
      
      setError('Failed to update item');
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update item';
      setError(message);
      logger.error('Failed to update item:', err);
      return null;
    }
  }, []);

  // Delete item
  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await vaultStorage.deleteItem(id);
      
      if (success) {
        setItems(prev => prev.filter(item => item.id !== id));
        return true;
      }
      
      setError('Failed to delete item');
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete item';
      setError(message);
      logger.error('Failed to delete item:', err);
      return false;
    }
  }, []);

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

