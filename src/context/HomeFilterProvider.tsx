/**
 * Home filter context provider
 * Shares the selected category filter and search query from home screen with other components (like the FAB in layout)
 */

import React, { createContext, useCallback, useContext, useState } from 'react';
import type { VaultItemType } from '../utils/types';

export type FilterType = VaultItemType | 'all';

interface HomeFilterContextValue {
  /** Currently selected filter on the home screen */
  homeFilter: FilterType;
  /** Update the home filter */
  setHomeFilter: (filter: FilterType) => void;
  /** Currently active search query on the home screen */
  searchQuery: string;
  /** Update the search query */
  setSearchQuery: (query: string) => void;
}

const HomeFilterContext = createContext<HomeFilterContextValue | null>(null);

interface HomeFilterProviderProps {
  children: React.ReactNode;
}

export function HomeFilterProvider({ children }: HomeFilterProviderProps) {
  const [homeFilter, setHomeFilterState] = useState<FilterType>('all');
  const [searchQuery, setSearchQueryState] = useState<string>('');

  const setHomeFilter = useCallback((filter: FilterType) => {
    setHomeFilterState(filter);
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const value: HomeFilterContextValue = {
    homeFilter,
    setHomeFilter,
    searchQuery,
    setSearchQuery,
  };

  return <HomeFilterContext.Provider value={value}>{children}</HomeFilterContext.Provider>;
}

/**
 * Hook to access the home filter context
 */
export function useHomeFilter(): HomeFilterContextValue {
  const context = useContext(HomeFilterContext);
  if (!context) {
    throw new Error('useHomeFilter must be used within a HomeFilterProvider');
  }
  return context;
}

