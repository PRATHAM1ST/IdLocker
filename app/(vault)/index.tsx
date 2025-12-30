/**
 * Vault home screen - Categories as main view with search & settings in header
 */

import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, ScrollView, StyleSheet, View } from 'react-native';
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
import { useVault } from '../../src/context/VaultProvider';
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
  const { deleteItem } = useVault();

  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const swipeableRef = useRef<SwipeableMethods>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Sync selected filter to context for FAB to access
  useEffect(() => {
    setHomeFilter(selectedFilter);
  }, [selectedFilter, setHomeFilter]);

  // Android hardware back button handler - exit selection mode
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isSelectionMode) {
        handleExitSelectionMode();
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior
    });

    }, [isSelectionMode]);

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

  // Selection mode handlers
  const handleLongPress = useCallback(
    (item: VaultItem) => {
      if (!isSelectionMode) {
        setIsSelectionMode(true);
        setSelectedItemIds(new Set([item.id]));
      }
    },
    [isSelectionMode],
  );

  const handleItemSelect = useCallback(
    (itemId: string) => {
      setSelectedItemIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        // Exit selection mode if no items are selected
        if (newSet.size === 0) {
          setIsSelectionMode(false);
        }
        return newSet;
      });
    },
    [],
  );

  const handleExitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedItemIds(new Set());
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    const selectedCount = selectedItemIds.size;
    if (selectedCount === 0) return;

    Alert.alert(
      'Delete Items',
      `Are you sure you want to delete ${selectedCount} item${selectedCount === 1 ? '' : 's'}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const idsToDelete = Array.from(selectedItemIds);
            let successCount = 0;
            let failCount = 0;

            for (const id of idsToDelete) {
              const success = await deleteItem(id);
              if (success) {
                successCount++;
              } else {
                failCount++;
              }
            }

            // Exit selection mode
            handleExitSelectionMode();

            // Show error if any deletions failed
            if (failCount > 0) {
              Alert.alert(
                'Deletion Incomplete',
                `Failed to delete ${failCount} item${failCount === 1 ? '' : 's'}. ${successCount} item${successCount === 1 ? '' : 's'} deleted successfully.`,
              );
            }
          },
        },
      ],
    );
  }, [selectedItemIds, deleteItem, handleExitSelectionMode]);

  // Handlers
  const handleItemPress = useCallback(
    (item: VaultItem) => {
      if (isSelectionMode) {
        handleItemSelect(item.id);
      } else {
        router.push(`/(vault)/item/${item.id}` as any);
      }
    },
    [isSelectionMode, handleItemSelect, router],
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
      <VaultHeader
        onAssetsPress={handleAssetsPress}
        onSettingsPress={handleSettingsPress}
        isSelectionMode={isSelectionMode}
        selectedCount={selectedItemIds.size}
        onDelete={handleDeleteSelected}
        onCancelSelection={handleExitSelectionMode}
      />

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
              paddingBottom: isSelectionMode ? 100 : 500,
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
              isSelectionMode={isSelectionMode}
              selectedItemIds={selectedItemIds}
              onItemLongPress={handleLongPress}
              onItemSelect={handleItemSelect}
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
