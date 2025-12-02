/**
 * Categories screen - fully scrollable with grid view and filtered list
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedView } from '../../src/components/ThemedView';
import { ThemedText } from '../../src/components/ThemedText';
import { VaultItemCard } from '../../src/components/VaultItemCard';
import { CategoryCardLarge, CategoryChip } from '../../src/components/CategoryCard';
import { EmptyState } from '../../src/components/EmptyState';
import { useTheme } from '../../src/context/ThemeProvider';
import { useVault, useGroupedItems } from '../../src/context/VaultProvider';
import { spacing, borderRadius, layout } from '../../src/styles/theme';
import { VAULT_ITEM_TYPES } from '../../src/utils/constants';
import type { VaultItem, VaultItemType } from '../../src/utils/types';

type FilterType = VaultItemType | 'all';

export default function CategoriesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ filter?: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { items, isLoading, refreshVault } = useVault();
  const groupedItems = useGroupedItems();

  const [selectedFilter, setSelectedFilter] = useState<FilterType>(
    (params.filter as VaultItemType) || 'all'
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<FilterType, number> = {
      all: items.length,
      bankAccount: groupedItems.get('bankAccount')?.length || 0,
      card: groupedItems.get('card')?.length || 0,
      govId: groupedItems.get('govId')?.length || 0,
      login: groupedItems.get('login')?.length || 0,
      note: groupedItems.get('note')?.length || 0,
      other: groupedItems.get('other')?.length || 0,
    };
    return counts;
  }, [items, groupedItems]);

  // Filter items based on selection
  const filteredItems = useMemo(() => {
    let result = items;
    
    if (selectedFilter !== 'all') {
      result = result.filter(item => item.type === selectedFilter);
    }

    return result.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [items, selectedFilter]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshVault();
    setIsRefreshing(false);
  }, [refreshVault]);

  const handleItemPress = useCallback((item: VaultItem) => {
    router.push(`/(vault)/item/${item.id}` as any);
  }, [router]);

  const handleCategoryPress = useCallback((type: VaultItemType) => {
    setSelectedFilter(type);
    setViewMode('list');
  }, []);

  const handleAddItem = useCallback((type?: VaultItemType) => {
    if (type) {
      router.push(`/(vault)/add?type=${type}` as any);
    } else {
      router.push('/(vault)/add' as any);
    }
  }, [router]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: layout.tabBarHeight + spacing.xl }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header - scrolls with content */}
        <LinearGradient
          colors={[colors.headerGradientStart, colors.headerGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        >
          <View style={styles.headerContent}>
            <ThemedText variant="title" style={styles.headerTitle}>
              Categories
            </ThemedText>
            <TouchableOpacity
              style={styles.viewToggle}
              onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              activeOpacity={0.7}
            >
              <Ionicons
                name={viewMode === 'grid' ? 'list' : 'grid'}
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Main Content */}
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
          >
            <CategoryChip
              type="all"
              label="All"
              icon="grid-outline"
              isSelected={selectedFilter === 'all'}
              count={categoryCounts.all}
              onPress={() => setSelectedFilter('all')}
            />
            {VAULT_ITEM_TYPES.map(({ type, label, icon }) => (
              <CategoryChip
                key={type}
                type={type}
                label={label}
                icon={icon}
                isSelected={selectedFilter === type}
                count={categoryCounts[type]}
                onPress={() => setSelectedFilter(type)}
              />
            ))}
          </ScrollView>

          {/* Section header */}
          <View style={styles.sectionHeader}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>
              {selectedFilter === 'all' ? 'All Items' : VAULT_ITEM_TYPES.find(t => t.type === selectedFilter)?.label}
            </ThemedText>
            <ThemedText variant="caption" color="secondary">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </ThemedText>
          </View>

          {/* Grid or List view */}
          {viewMode === 'grid' && selectedFilter === 'all' ? (
            <View style={styles.gridContainer}>
              {VAULT_ITEM_TYPES.map(({ type }) => (
                <CategoryCardLarge
                  key={type}
                  type={type}
                  count={categoryCounts[type]}
                  onPress={() => handleCategoryPress(type)}
                />
              ))}
            </View>
          ) : (
            <>
              {filteredItems.length > 0 ? (
                <View style={styles.itemsList}>
                  {filteredItems.map((item) => (
                    <VaultItemCard
                      key={item.id}
                      item={item}
                      onPress={handleItemPress}
                    />
                  ))}
                </View>
              ) : (
                <EmptyState
                  icon="folder-open-outline"
                  title="No items found"
                  description={selectedFilter === 'all' 
                    ? "Your vault is empty. Add your first item to get started."
                    : `No ${VAULT_ITEM_TYPES.find(t => t.type === selectedFilter)?.label.toLowerCase()} items yet.`}
                  actionLabel="Add Item"
                  onAction={() => handleAddItem(selectedFilter === 'all' ? undefined : selectedFilter)}
                />
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          { 
            backgroundColor: colors.accent,
            bottom: layout.tabBarHeight + spacing.md,
          },
        ]}
        onPress={() => handleAddItem(selectedFilter === 'all' ? undefined : selectedFilter)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    paddingTop: spacing.md,
  },
  chipScroll: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
  },
  itemsList: {
    // Items have their own horizontal margin
  },
  fab: {
    position: 'absolute',
    right: spacing.base,
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
