/**
 * Asset data context provider
 * Manages centralized asset storage and CRUD operations
 * Handles transparent migration from legacy ImageAttachment
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as assetStorage from '../storage/assetStorage';
import { logger } from '../utils/logger';
import type { Asset, AssetReference, AssetType, VaultItem } from '../utils/types';
import { useAuthLock } from './AuthLockProvider';

interface AssetContextValue {
  // State
  assets: Asset[];
  isLoading: boolean;
  error: string | null;
  isMigrating: boolean;

  // Actions
  refreshAssets: () => Promise<void>;
  saveImageAsset: (
    uri: string,
    originalFilename: string,
    width: number,
    height: number,
  ) => Promise<Asset | null>;
  saveDocumentAsset: (
    uri: string,
    originalFilename: string,
    mimeType: string,
  ) => Promise<Asset | null>;
  deleteAsset: (id: string) => Promise<boolean>;
  getAssetById: (id: string) => Asset | undefined;
  getAssetsByIds: (ids: string[]) => Asset[];
  getAssetsForItem: (item: VaultItem) => Asset[];
  ensureAssetsLoaded: (assetIds: string[]) => Promise<void>;

  // Filtered views
  getAssetsByType: (type: AssetType) => Asset[];
  searchAssets: (query: string) => Asset[];

  // Migration
  migrateItemAssets: (item: VaultItem) => Promise<AssetReference[]>;
  cleanupOrphanedAssets: (items: VaultItem[]) => Promise<number>;
}

const AssetContext = createContext<AssetContextValue | null>(null);

interface AssetProviderProps {
  children: React.ReactNode;
}

export function AssetProvider({ children }: AssetProviderProps) {
  const { isLocked } = useAuthLock();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load assets when unlocked
  useEffect(() => {
    if (!isLocked && !hasLoaded) {
      refreshAssets();
    }

    // Clear assets when locked for security
    if (isLocked) {
      setAssets([]);
      setHasLoaded(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocked, hasLoaded]);

  // Refresh assets from storage
  const refreshAssets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allAssets = await assetStorage.getAllAssets();
      setAssets(allAssets);
      setHasLoaded(true);
      logger.debug('Assets refreshed:', allAssets.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load assets';
      setError(message);
      logger.error('Failed to refresh assets:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save image asset
  const saveImageAsset = useCallback(
    async (
      uri: string,
      originalFilename: string,
      width: number,
      height: number,
    ): Promise<Asset | null> => {
      try {
        const asset = await assetStorage.saveImageAsset(uri, originalFilename, width, height);
        if (asset) {
          // Update local state - avoid duplicates
          setAssets((prev) => {
            const exists = prev.some((a) => a.id === asset.id);
            if (exists) return prev;
            return [...prev, asset];
          });
        }
        return asset;
      } catch (err) {
        logger.error('Failed to save image asset:', err);
        return null;
      }
    },
    [],
  );

  // Save document asset
  const saveDocumentAsset = useCallback(
    async (uri: string, originalFilename: string, mimeType: string): Promise<Asset | null> => {
      try {
        const asset = await assetStorage.saveDocumentAsset(uri, originalFilename, mimeType);
        if (asset) {
          // Update local state - avoid duplicates
          setAssets((prev) => {
            const exists = prev.some((a) => a.id === asset.id);
            if (exists) return prev;
            return [...prev, asset];
          });
        }
        return asset;
      } catch (err) {
        logger.error('Failed to save document asset:', err);
        return null;
      }
    },
    [],
  );

  // Delete asset
  const deleteAsset = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await assetStorage.deleteAsset(id);
      if (success) {
        setAssets((prev) => prev.filter((a) => a.id !== id));
      }
      return success;
    } catch (err) {
      logger.error('Failed to delete asset:', err);
      return false;
    }
  }, []);

  // Get asset by ID
  const getAssetById = useCallback(
    (id: string): Asset | undefined => {
      return assets.find((a) => a.id === id);
    },
    [assets],
  );

  // Get assets by IDs
  const getAssetsByIds = useCallback(
    (ids: string[]): Asset[] => {
      const idSet = new Set(ids);
      return assets.filter((a) => idSet.has(a.id));
    },
    [assets],
  );

  // Ensure specific assets are loaded into memory (fetch on demand if missing)
  const ensureAssetsLoaded = useCallback(
    async (assetIds: string[]): Promise<void> => {
      if (!assetIds || assetIds.length === 0) {
        return;
      }

      const uniqueIds = Array.from(new Set(assetIds.filter(Boolean)));
      if (uniqueIds.length === 0) {
        return;
      }

      const missingIds = uniqueIds.filter((id) => !assets.some((asset) => asset.id === id));
      if (missingIds.length === 0) {
        return;
      }

      try {
        const fetchedAssets = await assetStorage.getAssetsByIds(missingIds);
        if (fetchedAssets.length === 0) {
          return;
        }

        setAssets((prev) => {
          const merged = new Map(prev.map((asset) => [asset.id, asset] as const));
          for (const asset of fetchedAssets) {
            merged.set(asset.id, asset);
          }
          return Array.from(merged.values());
        });
      } catch (err) {
        logger.error('Failed to ensure assets loaded:', err);
      }
    },
    [assets],
  );

  // Get assets for a vault item (from assetRefs)
  const getAssetsForItem = useCallback(
    (item: VaultItem): Asset[] => {
      if (!item.assetRefs || item.assetRefs.length === 0) {
        // Fallback to legacy images for backward compatibility
        if (item.images && item.images.length > 0) {
          // Return assets that match legacy image IDs
          const legacyIds = new Set(item.images.map((img) => img.id));
          return assets.filter((a) => legacyIds.has(a.id));
        }
        return [];
      }

      const refIds = item.assetRefs.map((ref) => ref.assetId);
      return getAssetsByIds(refIds);
    },
    [assets, getAssetsByIds],
  );

  // Get assets by type
  const getAssetsByType = useCallback(
    (type: AssetType): Asset[] => {
      return assets.filter((a) => a.type === type);
    },
    [assets],
  );

  // Search assets
  const searchAssets = useCallback(
    (query: string): Asset[] => {
      const lowerQuery = query.toLowerCase().trim();

      if (!lowerQuery) return assets;

      return assets.filter(
        (asset) =>
          asset.originalFilename.toLowerCase().includes(lowerQuery) ||
          asset.type.toLowerCase().includes(lowerQuery),
      );
    },
    [assets],
  );

  // Migrate legacy images from a vault item to centralized assets
  const migrateItemAssets = useCallback(async (item: VaultItem): Promise<AssetReference[]> => {
    if (!item.images || item.images.length === 0) {
      return item.assetRefs || [];
    }

    // Already migrated
    if (item.assetRefs && item.assetRefs.length > 0) {
      return item.assetRefs;
    }

    setIsMigrating(true);
    const newRefs: AssetReference[] = [];

    try {
      for (const legacyImage of item.images) {
        const asset = await assetStorage.migrateImageToAsset(legacyImage);
        if (asset) {
          newRefs.push({
            assetId: asset.id,
            addedAt: legacyImage.createdAt,
          });

          // Update local state - avoid duplicates
          setAssets((prev) => {
            const exists = prev.some((a) => a.id === asset.id);
            if (exists) return prev;
            return [...prev, asset];
          });
        }
      }

      logger.debug(`Migrated ${newRefs.length} images for item ${item.id}`);
    } catch (err) {
      logger.error('Failed to migrate item assets:', err);
    } finally {
      setIsMigrating(false);
    }

    return newRefs;
  }, []);

  // Cleanup orphaned assets
  const cleanupOrphanedAssets = useCallback(
    async (items: VaultItem[]): Promise<number> => {
      // Collect all referenced asset IDs
      const referencedIds = new Set<string>();

      for (const item of items) {
        if (item.assetRefs) {
          for (const ref of item.assetRefs) {
            referencedIds.add(ref.assetId);
          }
        }
        // Also consider legacy images
        if (item.images) {
          for (const img of item.images) {
            referencedIds.add(img.id);
          }
        }
      }

      const deletedCount = await assetStorage.cleanupOrphanedAssets(referencedIds);

      if (deletedCount > 0) {
        // Refresh assets to reflect changes
        await refreshAssets();
      }

      return deletedCount;
    },
    [refreshAssets],
  );

  const value = useMemo(
    () => ({
      assets,
      isLoading,
      error,
      isMigrating,
      refreshAssets,
      saveImageAsset,
      saveDocumentAsset,
      deleteAsset,
      getAssetById,
      getAssetsByIds,
      getAssetsForItem,
      ensureAssetsLoaded,
      getAssetsByType,
      searchAssets,
      migrateItemAssets,
      cleanupOrphanedAssets,
    }),
    [
      assets,
      isLoading,
      error,
      isMigrating,
      refreshAssets,
      saveImageAsset,
      saveDocumentAsset,
      deleteAsset,
      getAssetById,
      getAssetsByIds,
      getAssetsForItem,
      ensureAssetsLoaded,
      getAssetsByType,
      searchAssets,
      migrateItemAssets,
      cleanupOrphanedAssets,
    ],
  );

  return <AssetContext.Provider value={value}>{children}</AssetContext.Provider>;
}

/**
 * Hook to access asset context
 */
export function useAssets(): AssetContextValue {
  const context = useContext(AssetContext);
  if (!context) {
    throw new Error('useAssets must be used within an AssetProvider');
  }
  return context;
}

/**
 * Hook to get assets grouped by type
 */
export function useGroupedAssets(): Map<AssetType, Asset[]> {
  const { assets } = useAssets();

  return useMemo(() => {
    const grouped = new Map<AssetType, Asset[]>();

    for (const asset of assets) {
      const existing = grouped.get(asset.type) || [];
      grouped.set(asset.type, [...existing, asset]);
    }

    return grouped;
  }, [assets]);
}
