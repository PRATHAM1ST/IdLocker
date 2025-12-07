/**
 * Category data context provider
 * Manages categories state and CRUD operations
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { CustomCategory, CategoryColor } from '../utils/types';
import * as vaultStorage from '../storage/vaultStorage';
import { useAuthLock } from './AuthLockProvider';
import { logger } from '../utils/logger';
import { DEFAULT_CATEGORIES, CATEGORY_COLORS } from '../utils/constants';

/**
 * Generate a simple UUID v4
 */
function generateId(): string {
  return (
    'cat-' +
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    })
  );
}

interface CategoryContextValue {
  // State
  categories: CustomCategory[];
  isLoading: boolean;
  error: string | null;

  // Actions
  refreshCategories: () => Promise<void>;
  addCategory: (
    category: Omit<CustomCategory, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<CustomCategory | null>;
  updateCategory: (
    id: string,
    updates: Partial<Omit<CustomCategory, 'id' | 'createdAt' | 'updatedAt'>>,
  ) => Promise<CustomCategory | null>;
  deleteCategory: (id: string) => Promise<boolean>;
  getCategoryById: (id: string) => CustomCategory | undefined;
  resetToDefaults: () => Promise<boolean>;

  // Helpers
  getDefaultColor: () => CategoryColor;
  generateCategoryId: () => string;
}

const CategoryContext = createContext<CategoryContextValue | null>(null);

interface CategoryProviderProps {
  children: React.ReactNode;
}

export function CategoryProvider({ children }: CategoryProviderProps) {
  const { isLocked } = useAuthLock();

  const [categories, setCategories] = useState<CustomCategory[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load categories when unlocked
  useEffect(() => {
    if (!isLocked && !hasLoaded) {
      refreshCategories();
    }

    // Reset to defaults when locked for security
    if (isLocked) {
      setCategories(DEFAULT_CATEGORIES);
      setHasLoaded(false);
    }
  }, [isLocked, hasLoaded]);

  // Refresh categories from storage
  const refreshCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await vaultStorage.loadCategories();
      setCategories(data.categories);
      setHasLoaded(true);
      logger.debug('Categories refreshed:', data.categories.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load categories';
      setError(message);
      logger.error('Failed to refresh categories:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add new category
  const addCategory = useCallback(
    async (
      category: Omit<CustomCategory, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<CustomCategory | null> => {
      const now = new Date().toISOString();
      const newCategory: CustomCategory = {
        ...category,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      } as CustomCategory;

      // Update local state immediately
      setCategories((prev) => [...prev, newCategory]);
      logger.debug('Category added:', newCategory);

      // Persist in background
      setTimeout(() => {
        setCategories((currentCategories) => {
          vaultStorage.saveCategories({ version: 1, categories: currentCategories }).catch(() => {
            logger.debug('Category added to memory but not persisted');
          });
          return currentCategories;
        });
      }, 100);

      return newCategory;
    },
    [],
  );

  // Update existing category
  const updateCategory = useCallback(
    async (
      id: string,
      updates: Partial<Omit<CustomCategory, 'id' | 'createdAt' | 'updatedAt'>>,
    ): Promise<CustomCategory | null> => {
      const existingCategory = categories.find((cat) => cat.id === id);
      if (!existingCategory) {
        logger.debug('Category not found for update');
        return null;
      }

      const updatedCategory: CustomCategory = {
        ...existingCategory,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Update local state immediately
      setCategories((prev) => prev.map((cat) => (cat.id === id ? updatedCategory : cat)));
      logger.debug('Category updated:', id);

      // Persist in background
      setTimeout(() => {
        setCategories((currentCategories) => {
          vaultStorage.saveCategories({ version: 1, categories: currentCategories }).catch(() => {
            logger.debug('Category updated in memory but not persisted');
          });
          return currentCategories;
        });
      }, 100);

      return updatedCategory;
    },
    [categories],
  );

  // Delete category
  const deleteCategory = useCallback(
    async (id: string): Promise<boolean> => {
      const existingCategory = categories.find((cat) => cat.id === id);
      if (!existingCategory) {
        logger.debug('Category not found for deletion');
        return false;
      }

      // Update local state immediately
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      logger.debug('Category deleted:', id);

      // Persist in background
      setTimeout(() => {
        setCategories((currentCategories) => {
          vaultStorage.saveCategories({ version: 1, categories: currentCategories }).catch(() => {
            logger.debug('Category deleted from memory but not persisted');
          });
          return currentCategories;
        });
      }, 100);

      return true;
    },
    [categories],
  );

  // Get single category by ID
  const getCategoryById = useCallback(
    (id: string): CustomCategory | undefined => {
      return categories.find((cat) => cat.id === id);
    },
    [categories],
  );

  // Reset to defaults
  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    setCategories(DEFAULT_CATEGORIES);

    // Persist in background
    setTimeout(() => {
      vaultStorage.saveCategories({ version: 1, categories: DEFAULT_CATEGORIES }).catch(() => {
        logger.debug('Categories reset in memory but not persisted');
      });
    }, 100);

    return true;
  }, []);

  // Get a default color for new categories
  const getDefaultColor = useCallback((): CategoryColor => {
    // Pick a random color from available colors
    const randomIndex = Math.floor(Math.random() * CATEGORY_COLORS.length);
    const color = CATEGORY_COLORS[randomIndex];
    return {
      gradientStart: color.gradientStart,
      gradientEnd: color.gradientEnd,
      bg: color.bg,
      icon: color.icon,
      text: color.text,
    };
  }, []);

  // Generate a new category ID
  const generateCategoryId = useCallback((): string => {
    return generateId();
  }, []);

  const value = useMemo(
    () => ({
      categories,
      isLoading,
      error,
      refreshCategories,
      addCategory,
      updateCategory,
      deleteCategory,
      getCategoryById,
      resetToDefaults,
      getDefaultColor,
      generateCategoryId,
    }),
    [
      categories,
      isLoading,
      error,
      refreshCategories,
      addCategory,
      updateCategory,
      deleteCategory,
      getCategoryById,
      resetToDefaults,
      getDefaultColor,
      generateCategoryId,
    ],
  );

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
}

/**
 * Hook to access category context
 */
export function useCategories(): CategoryContextValue {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
}

/**
 * Hook to get category color (with dark mode support)
 */
export function useCategoryColor(categoryId: string, isDark: boolean): CategoryColor | null {
  const { getCategoryById } = useCategories();
  const category = getCategoryById(categoryId);

  if (!category) return null;

  // For dark mode, we could potentially have different colors
  // For now, return the same color but it could be enhanced
  return category.color;
}
