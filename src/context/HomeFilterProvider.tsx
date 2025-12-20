/**
 * Home filter context provider
 * Shares the selected category filter from home screen with other components (like the FAB in layout)
 */

import React, { createContext, useCallback, useContext, useState } from 'react';
import type { VaultItemType } from '../utils/types';

export type FilterType = VaultItemType | 'all';

interface HomeFilterContextValue {
  /** Currently selected filter on the home screen */
  homeFilter: FilterType;
  /** Update the home filter */
  setHomeFilter: (filter: FilterType) => void;
}

const HomeFilterContext = createContext<HomeFilterContextValue | null>(null);

interface HomeFilterProviderProps {
  children: React.ReactNode;
}

export function HomeFilterProvider({ children }: HomeFilterProviderProps) {
  const [homeFilter, setHomeFilterState] = useState<FilterType>('all');

  const setHomeFilter = useCallback((filter: FilterType) => {
    setHomeFilterState(filter);
  }, []);

  const value: HomeFilterContextValue = {
    homeFilter,
    setHomeFilter,
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

