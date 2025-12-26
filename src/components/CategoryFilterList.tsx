/**
 * Category filter list component (horizontal scrollable)
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { DynamicCategoryFilterCard } from './CategoryCard';
import { useCategories } from '../context/CategoryProvider';
import { spacing } from '../styles/theme';
import type { VaultItemType } from '../utils/types';

type FilterType = VaultItemType | 'all';

interface CategoryFilterListProps {
  selectedFilter: FilterType;
  categoryCounts: Record<string, number>;
  onFilterChange: (filter: FilterType) => void;
}

export function CategoryFilterList({
  selectedFilter,
  categoryCounts,
  onFilterChange,
}: CategoryFilterListProps) {
  const { categories } = useCategories();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterScroll}
      style={styles.scrollView}
    >
      <DynamicCategoryFilterCard
        category={null}
        isSelected={selectedFilter === 'all'}
        count={categoryCounts.all}
        onPress={() => onFilterChange('all')}
      />
      {categories.map((category) => (
        <DynamicCategoryFilterCard
          key={category.id}
          category={category}
          isSelected={selectedFilter === category.id}
          count={categoryCounts[category.id] || 0}
          onPress={() => onFilterChange(category.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterScroll: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xs,
    paddingBottom: spacing.base,
    flexGrow: 0,
    flexShrink: 0,
    gap: spacing.sm,
  },
});

