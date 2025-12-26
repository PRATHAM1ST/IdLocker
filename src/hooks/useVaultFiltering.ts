/**
 * Custom hook for vault filtering and searching logic
 */

import { useMemo } from 'react';
import { useVault } from '../context/VaultProvider';
import type { VaultItem, VaultItemType } from '../utils/types';

type FilterType = VaultItemType | 'all';

export function useVaultFiltering(searchQuery: string, selectedFilter: FilterType) {
  const { items, searchItems } = useVault();

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
    const baseResults = trimmedQuery ? searchItems(trimmedQuery) : items;
    const filteredResults =
      selectedFilter === 'all'
        ? baseResults
        : baseResults.filter((item) => item.type === selectedFilter);

    return [...filteredResults].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [items, searchItems, searchQuery, selectedFilter]);

  return {
    categoryCounts,
    searchResults,
  };
}

