/**
 * Vault home screen - Categories as main view with search & settings in header
 */

import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import {
  CategoryFilterList,
  useSwipeableActions,
  VaultHeader,
  VaultItemsGrid,
  VaultSearchBar,
  VaultSectionHeader,
} from '../../src/components';
import { ThemedView } from '../../src/components/ThemedView';
import { useCategories } from '../../src/context/CategoryProvider';
import { useHomeFilter } from '../../src/context/HomeFilterProvider';
import { useTheme } from '../../src/context/ThemeProvider';
import { useCategoryNavigation } from '../../src/hooks/useCategoryNavigation';
import { useVaultFiltering } from '../../src/hooks/useVaultFiltering';
import { borderRadius, spacing } from '../../src/styles/theme';
import type { VaultItem, VaultItemType } from '../../src/utils/types';

type FilterType = VaultItemType | 'all';

export default function VaultHomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { categories } = useCategories();
  const { setHomeFilter } = useHomeFilter();

  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const swipeableRef = useRef<SwipeableMethods>(null);

  // Sync selected filter to context for FAB to access
  useEffect(() => {
    setHomeFilter(selectedFilter);
  }, [selectedFilter, setHomeFilter]);

  // Custom hooks for filtering and navigation
  const { categoryCounts, searchResults } = useVaultFiltering(searchQuery, selectedFilter);
  const {
    prevCategory,
    nextCategory,
    navigateToPrevious,
    navigateToNext,
  } = useCategoryNavigation(selectedFilter);

  // Get the selected category
  const selectedCategory = useMemo(() => {
    if (selectedFilter === 'all') return null;
    return categories.find((c) => c.id === selectedFilter) || null;
  }, [selectedFilter, categories]);

  // Swipeable actions
  const { renderLeftActions, renderRightActions } = useSwipeableActions({
    prevCategory,
    nextCategory,
  });

  // Handlers
  const handleItemPress = useCallback(
    (item: VaultItem) => {
      router.push(`/(vault)/item/${item.id}` as any);
    },
    [router],
  );

  const handleAddItem = useCallback(
    (type?: VaultItemType) => {
      if (type) {
        router.push(`/(vault)/add?type=${type}` as any);
      } else {
        router.push('/(vault)/add' as any);
      }
    },
    [router],
  );

  const handleAssetsPress = useCallback(() => {
    router.push('/(vault)/assets' as any);
  }, [router]);

  const handleSettingsPress = useCallback(() => {
    router.push('/(vault)/settings' as any);
  }, [router]);

  // Handle swipe gesture to navigate between categories
  const handleSwipeOpen = useCallback(
    (direction: 'left' | 'right') => {
      if (direction === 'right') {
        // Swipe left (reveals right side) → go to PREVIOUS
        const prevFilter = navigateToPrevious();
        if (prevFilter) {
          setSelectedFilter(prevFilter);
        }
      } else {
        // Swipe right (reveals left side) → go to NEXT
        const nextFilter = navigateToNext();
        if (nextFilter) {
          setSelectedFilter(nextFilter);
        }
      }
      // Close swipeable after action
      swipeableRef.current?.close();
    },
    [navigateToPrevious, navigateToNext],
  );

  return (
    <ThemedView style={styles.container}>
      <VaultHeader onAssetsPress={handleAssetsPress} onSettingsPress={handleSettingsPress} />

      <View style={[styles.content, { backgroundColor: colors.background }]}>
        <VaultSearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <CategoryFilterList
          selectedFilter={selectedFilter}
          categoryCounts={categoryCounts}
          onFilterChange={setSelectedFilter}
        />

        <VaultSectionHeader
          selectedFilter={selectedFilter}
          selectedCategory={selectedCategory}
          itemCount={searchResults.length}
        />

        <Swipeable
          ref={swipeableRef}
          onSwipeableOpen={handleSwipeOpen}
          renderLeftActions={prevCategory ? renderLeftActions : undefined}
          renderRightActions={nextCategory ? renderRightActions : undefined}
        >
          <ScrollView
            contentContainerStyle={{
              paddingBottom: 500,
              backgroundColor: colors.background,
            }}
            showsVerticalScrollIndicator={false}
          >
            <VaultItemsGrid
              items={searchResults}
              selectedFilter={selectedFilter}
              selectedCategory={selectedCategory}
              onItemPress={handleItemPress}
              onAddItem={handleAddItem}
            />
          </ScrollView>
        </Swipeable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    marginTop: -spacing.md,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.sm,
    overflow: 'hidden',
  },
});
