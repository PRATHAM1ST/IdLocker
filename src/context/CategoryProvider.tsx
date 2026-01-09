/**
 * Category data context provider
 * Manages categories state and CRUD operations
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as vaultStorage from '../storage/vaultStorage';
import { CATEGORY_COLORS, DEFAULT_CATEGORIES } from '../utils/constants';
import { logger } from '../utils/logger';
import type { CategoryColor, CustomCategory } from '../utils/types';
import { generatePrefixedId } from '../utils/uuid';
import { useAuthLock } from './AuthLockProvider';

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

  // Debounced save timeout ref
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  }, [isLocked, hasLoaded, refreshCategories]);

  // Migrate categories from old icon property to iconLight/iconDark
  const migrateCategories = useCallback((categories: CustomCategory[]): CustomCategory[] => {
    return categories.map((category) => {
      // @ts-ignore - Check if category has old 'icon' property
      if (category.color && 'icon' in category.color && !('iconLight' in category.color)) {
        const oldIconColor = (category.color as any).icon;
        // Derive iconLight and iconDark from old icon color
        // Use the old color for light mode, brighten it for dark mode
        const iconLight = oldIconColor;
        // Brighten the color for dark mode (simple approach: increase brightness by ~30%)
        const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(oldIconColor);
        if (rgb) {
          const r = Math.min(255, parseInt(rgb[1], 16) + Math.floor((255 - parseInt(rgb[1], 16)) * 0.3));
          const g = Math.min(255, parseInt(rgb[2], 16) + Math.floor((255 - parseInt(rgb[2], 16)) * 0.3));
          const b = Math.min(255, parseInt(rgb[3], 16) + Math.floor((255 - parseInt(rgb[3], 16)) * 0.3));
          const iconDark = '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
          
          // Remove old icon property by destructuring
          const { icon, ...colorWithoutIcon } = category.color as any;
          
          return {
            ...category,
            color: {
              ...colorWithoutIcon,
              iconLight,
              iconDark,
            } as CategoryColor,
          };
        }
      }
      return category;
    });
  }, []);

  // Refresh categories from storage
  const refreshCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await vaultStorage.loadCategories();
      // Migrate categories if needed
      const migratedCategories = migrateCategories(data.categories);
      
      // If migration occurred, save the migrated categories
      if (migratedCategories.some((cat, idx) => cat !== data.categories[idx])) {
        await vaultStorage.saveCategories({ version: 1, categories: migratedCategories });
        logger.debug('Categories migrated to new icon color format');
      }
      
      setCategories(migratedCategories);
      setHasLoaded(true);
      logger.debug('Categories refreshed:', migratedCategories.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load categories';
      setError(message);
      logger.error('Failed to refresh categories:', err);
    } finally {
      setIsLoading(false);
    }
  }, [migrateCategories]);

  // Debounced save function to prevent race conditions
  const debouncedSave = useCallback(
    (currentCategories: CustomCategory[], immediate: boolean = false) => {
      // Clear any pending save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      const performSave = async () => {
        try {
          await vaultStorage.saveCategories({ version: 1, categories: currentCategories });
        } catch (err) {
          logger.debug('Categories save failed (expected in Expo Go)', err);
        }
      };

      if (immediate) {
        // Save immediately for critical operations (delete, reset)
        performSave();
      } else {
        // Debounce saves for add/update operations
        saveTimeoutRef.current = setTimeout(performSave, 100);
      }
    },
    [],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, []);

  // Add new category
  const addCategory = useCallback(
    async (
      category: Omit<CustomCategory, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<CustomCategory | null> => {
      const now = new Date().toISOString();
      const newCategory: CustomCategory = {
        ...category,
        id: generatePrefixedId('cat'),
        createdAt: now,
        updatedAt: now,
      } as CustomCategory;

      // Update local state immediately
      setCategories((prev) => {
        const updated = [...prev, newCategory];
        // Schedule debounced save
        debouncedSave(updated, false);
        return updated;
      });
      logger.debug('Category added:', newCategory);

      return newCategory;
    },
    [debouncedSave],
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
      setCategories((prev) => {
        const updated = prev.map((cat) => (cat.id === id ? updatedCategory : cat));
        // Schedule debounced save
        debouncedSave(updated, false);
        return updated;
      });
      logger.debug('Category updated:', id);

      return updatedCategory;
    },
    [categories, debouncedSave],
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
      setCategories((prev) => {
        const updated = prev.filter((cat) => cat.id !== id);
        // Save immediately for delete operations (critical)
        debouncedSave(updated, true);
        return updated;
      });
      logger.debug('Category deleted:', id);

      return true;
    },
    [categories, debouncedSave],
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
    // Save immediately for reset operations (critical)
    debouncedSave(DEFAULT_CATEGORIES, true);
    return true;
  }, [debouncedSave]);

  // Get a default color for new categories
  const getDefaultColor = useCallback((): CategoryColor => {
    // Pick a random color from available colors
    const randomIndex = Math.floor(Math.random() * CATEGORY_COLORS.length);
    const color = CATEGORY_COLORS[randomIndex];
    return {
      gradientStart: color.gradientStart,
      gradientEnd: color.gradientEnd,
      bg: color.bg,
      iconLight: color.iconLight,
      iconDark: color.iconDark,
      text: color.text,
    };
  }, []);

  // Generate a new category ID
  const generateCategoryId = useCallback((): string => {
    return generatePrefixedId('cat');
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
