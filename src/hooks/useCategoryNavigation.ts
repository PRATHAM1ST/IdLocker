/**
 * Custom hook for category navigation logic (swipe navigation)
 */

import { useMemo } from 'react';
import { useTheme } from '../context/ThemeProvider';
import { useCategories } from '../context/CategoryProvider';
import type { VaultItemType } from '../utils/types';

type FilterType = VaultItemType | 'all';

interface CategoryInfo {
  id: string;
  label: string;
  icon: string;
  color: { gradientStart: string; gradientEnd: string };
}

export function useCategoryNavigation(selectedFilter: FilterType) {
  const { colors } = useTheme();
  const { categories } = useCategories();

  // Create unified filter list for swipe navigation
  const filterList = useMemo(() => {
    return ['all' as FilterType, ...categories.map((c) => c.id as FilterType)];
  }, [categories]);

  const currentFilterIndex = filterList.indexOf(selectedFilter);

  // Helper to create category info object
  const createCategoryInfo = (filter: FilterType): CategoryInfo | null => {
    if (filter === 'all') {
      return {
        id: 'all',
        label: 'All Items',
        icon: 'apps',
        color: { gradientStart: colors.accent, gradientEnd: colors.accentLight },
      };
    }
    const category = categories.find((c) => c.id === filter);
    return category
      ? {
          id: category.id,
          label: category.label,
          icon: category.icon,
          color: category.color,
        }
      : null;
  };

  // Get previous and next category info for swipe indicators
  const prevCategory = useMemo(() => {
    if (currentFilterIndex <= 0) return null;
    const prevFilter = filterList[currentFilterIndex - 1];
    return createCategoryInfo(prevFilter);
  }, [currentFilterIndex, filterList, categories, colors]);

  const nextCategory = useMemo(() => {
    if (currentFilterIndex >= filterList.length - 1) return null;
    const nextFilter = filterList[currentFilterIndex + 1];
    return createCategoryInfo(nextFilter);
  }, [currentFilterIndex, filterList, categories, colors]);

  const navigateToPrevious = (): FilterType | null => {
    if (currentFilterIndex > 0) {
      return filterList[currentFilterIndex - 1];
    }
    return null;
  };

  const navigateToNext = (): FilterType | null => {
    if (currentFilterIndex < filterList.length - 1) {
      return filterList[currentFilterIndex + 1];
    }
    return null;
  };

  return {
    filterList,
    currentFilterIndex,
    prevCategory,
    nextCategory,
    navigateToPrevious,
    navigateToNext,
  };
}

