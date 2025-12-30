/**
 * Vault items grid component
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { spacing } from '../styles/theme';
import type { CustomCategory, VaultItem, VaultItemType } from '../utils/types';
import { EmptyState } from './EmptyState';
import { VaultItemGridCard } from './VaultItemGridCard';

type FilterType = VaultItemType | 'all';

interface VaultItemsGridProps {
  items: VaultItem[];
  selectedFilter: FilterType;
  selectedCategory: CustomCategory | null;
  onItemPress: (item: VaultItem) => void;
  onAddItem: (type?: VaultItemType) => void;
  isSelectionMode?: boolean;
  selectedItemIds?: Set<string>;
  onItemLongPress?: (item: VaultItem) => void;
  onItemSelect?: (itemId: string) => void;
}

export function VaultItemsGrid({
  items,
  selectedFilter,
  selectedCategory,
  onItemPress,
  onAddItem,
  isSelectionMode = false,
  selectedItemIds = new Set(),
  onItemLongPress,
  onItemSelect,
}: VaultItemsGridProps) {
  if (items.length === 0) {
    return (
      <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
        <EmptyState
          icon={
            selectedFilter === 'all'
              ? 'folder-open-outline'
              : (selectedCategory?.icon as any)
          }
          title={
            selectedFilter === 'all'
              ? 'No items found'
              : `No ${selectedCategory?.label.toLowerCase()} items found.`
          }
          description={
            selectedFilter === 'all'
              ? 'Your vault is empty. Add your first item to get started.'
              : `Please add your first ${selectedCategory?.label.toLowerCase()} item to get started or change the filter to see other items.`
          }
          actionLabel="Add Item"
          onAction={() => onAddItem(selectedFilter === 'all' ? undefined : selectedFilter)}
          actionButtonColor={selectedCategory?.color.gradientStart}
        />
      </Animated.View>
    );
  }

  return (
    <View style={styles.itemsGrid}>
      {items.map((item, index) => (
        <Animated.View
          key={item.id}
          entering={FadeIn.delay(index * 50).duration(300).springify()}
          exiting={FadeOut.duration(300).springify()}
          layout={LinearTransition}
        >
          <VaultItemGridCard
            item={item}
            onPress={onItemPress}
            isSelectionMode={isSelectionMode}
            isSelected={selectedItemIds.has(item.id)}
            onLongPress={onItemLongPress ? () => onItemLongPress(item) : undefined}
            onSelect={onItemSelect ? () => onItemSelect(item.id) : undefined}
          />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
  },
});

