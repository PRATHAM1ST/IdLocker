/**
 * Custom hook for vault filtering and searching logic
 */

import { useMemo } from 'react';
import { useCategories } from '../context/CategoryProvider';
import { useVault } from '../context/VaultProvider';
import type { VaultItem, VaultItemType } from '../utils/types';

type FilterType = VaultItemType | 'all';

export function useVaultFiltering(searchQuery: string, selectedFilter: FilterType) {
  const { items, searchItems } = useVault();
  const { categories } = useCategories();

  // Calculate category counts dynamically
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: items.length,
    };

    // Count items for each unique type
    items.forEach((item) => {
      counts[item.type] = (counts[item.type] || 0) + 1;
    });

    return counts;
  }, [items]);

  // Filter and search items
  const searchResults = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    
    if (!trimmedQuery) {
      // No search query - just filter by selected category
      const filteredResults =
        selectedFilter === 'all'
          ? items
          : items.filter((item) => item.type === selectedFilter);

      return [...filteredResults].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    }

    const lowerQuery = trimmedQuery.toLowerCase();
    
    // Get items that match the search query (label, fields, custom fields, etc.)
    const searchMatchedItems = searchItems(trimmedQuery);
    
    // Also find items whose category name matches the query
    const categoryMatchedItems = items.filter((item) => {
      const category = categories.find((cat) => cat.id === item.type);
      if (category && category.label.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      return false;
    });

    // Combine both sets and remove duplicates
    const combinedResults = new Map<string, VaultItem>();
    [...searchMatchedItems, ...categoryMatchedItems].forEach((item) => {
      combinedResults.set(item.id, item);
    });

    const baseResults = Array.from(combinedResults.values());
    
    // Apply category filter
    const filteredResults =
      selectedFilter === 'all'
        ? baseResults
        : baseResults.filter((item) => item.type === selectedFilter);

    return [...filteredResults].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [items, searchItems, searchQuery, selectedFilter, categories]);

  return {
    categoryCounts,
    searchResults,
  };
}

