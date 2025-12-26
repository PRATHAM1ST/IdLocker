/**
 * Vault section header component (shows title and item count)
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition, ZoomIn } from 'react-native-reanimated';
import { ThemedText } from './ThemedText';
import { spacing } from '../styles/theme';
import type { CustomCategory } from '../utils/types';
import type { VaultItemType } from '../utils/types';

type FilterType = VaultItemType | 'all';

interface VaultSectionHeaderProps {
  selectedFilter: FilterType;
  selectedCategory: CustomCategory | null;
  itemCount: number;
}

export function VaultSectionHeader({
  selectedFilter,
  selectedCategory,
  itemCount,
}: VaultSectionHeaderProps) {
  const title = selectedFilter === 'all' ? 'All Items' : selectedCategory?.label || 'Items';

  return (
    <Animated.View style={styles.sectionHeader} layout={LinearTransition.springify().damping(15)}>
      <Animated.View key={selectedFilter} entering={FadeIn.duration(200)}>
        <ThemedText variant="subtitle" style={styles.sectionTitle}>
          {title}
        </ThemedText>
      </Animated.View>
      <Animated.View key={`count-${itemCount}`} entering={ZoomIn.duration(200)}>
        <ThemedText variant="caption" color="secondary">
          {`${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
        </ThemedText>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontWeight: '700',
  },
});

