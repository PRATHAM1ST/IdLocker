/**
 * Vault home screen - Categories as main view with search & settings in header
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DynamicCategoryFilterCard } from '../../src/components/CategoryCard';
import { EmptyState } from '../../src/components/EmptyState';
import { ThemedText } from '../../src/components/ThemedText';
import { ThemedView } from '../../src/components/ThemedView';
import { VaultItemGridCard } from '../../src/components/VaultItemGridCard';
import { useCategories } from '../../src/context/CategoryProvider';
import { useTheme } from '../../src/context/ThemeProvider';
import { useVault } from '../../src/context/VaultProvider';
import { borderRadius, layout, spacing } from '../../src/styles/theme';
import type { VaultItem, VaultItemType } from '../../src/utils/types';

type FilterType = VaultItemType | 'all';

export default function VaultHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { items } = useVault();
  const { categories } = useCategories();

  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  // Calculate category counts dynamically
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: items.length,
    };

    // Calculate counts for each category
    for (const category of categories) {
      counts[category.id] = items.filter((item) => item.type === category.id).length;
    }

    return counts;
  }, [items, categories]);

  // Filter items based on selection
  const filteredItems = useMemo(() => {
    let result = items;

    if (selectedFilter !== 'all') {
      result = result.filter((item) => item.type === selectedFilter);
    }

    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [items, selectedFilter]);

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

  const handleSearchPress = useCallback(() => {
    router.push('/(vault)/search' as any);
  }, [router]);

  const handleAssetsPress = useCallback(() => {
    router.push('/(vault)/assets' as any);
  }, [router]);

  const handleSettingsPress = useCallback(() => {
    router.push('/(vault)/settings' as any);
  }, [router]);

  // Get the selected category
  const selectedCategory = useMemo(() => {
    if (selectedFilter === 'all') return null;
    return categories.find((c) => c.id === selectedFilter) || null;
  }, [selectedFilter, categories]);

  return (
    <ThemedView style={styles.container}>
      {/* Header - scrolls with content */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={styles.headerContent}>
          <ThemedText variant="title" style={styles.headerTitle}>
            IdLocker
          </ThemedText>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleAssetsPress}
              activeOpacity={0.7}
            >
              <Ionicons name="folder-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleSearchPress}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleSettingsPress}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={[styles.content, { backgroundColor: colors.background }]}>
        {/* Filter cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          style={{
            flexGrow: 0,
            flexShrink: 0,
          }}
        >
          <DynamicCategoryFilterCard
            category={null}
            isSelected={selectedFilter === 'all'}
            count={categoryCounts.all}
            onPress={() => setSelectedFilter('all')}
          />
          {categories.map((category) => (
            <DynamicCategoryFilterCard
              key={category.id}
              category={category}
              isSelected={selectedFilter === category.id}
              count={categoryCounts[category.id] || 0}
              onPress={() => setSelectedFilter(category.id)}
            />
          ))}
        </ScrollView>

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>
            {selectedFilter === 'all' ? 'All Items' : selectedCategory?.label || 'Items'}
          </ThemedText>
          <ThemedText variant="caption" color="secondary">
            {`${filteredItems.length} ${filteredItems.length === 1 ? 'item' : 'items'}`}
          </ThemedText>
        </View>

        <ScrollView
           contentContainerStyle={{
            paddingBottom: layout.tabBarHeight + spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
        >
          {filteredItems.length > 0 ? (
            <View style={styles.itemsGrid}>
              {filteredItems.map((item) => (
                <VaultItemGridCard key={item.id} item={item} onPress={handleItemPress} />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="folder-open-outline"
              title="No items found"
              description={
                selectedFilter === 'all'
                  ? 'Your vault is empty. Add your first item to get started.'
                  : `No ${selectedCategory?.label.toLowerCase() || 'matching'} items yet.`
              }
              actionLabel="Add Item"
              onAction={() => handleAddItem(selectedFilter === 'all' ? undefined : selectedFilter)}
            />
          )}
        </ScrollView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.base,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginTop: -spacing.md,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.sm,
    overflow: 'hidden',
  },
  filterScroll: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
    flexGrow: 0,
    flexShrink: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
  },
  createCategoryCard: {
    width: (Dimensions.get('window').width - spacing.base * 2 - spacing.md) / 2,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
  },
  createCategoryIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  createCategoryContent: {
    alignItems: 'center',
  },
  createCategoryLabel: {
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontSize: 16,
  },
  createCategoryHint: {
    fontSize: 11,
  },
});
