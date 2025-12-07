/**
 * Search screen - fully scrollable search experience
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
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

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { items, searchItems } = useVault();
  const { categories } = useCategories();
  const inputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Ensure selected filter stays valid when category list changes
  useEffect(() => {
    if (
      selectedFilter !== 'all' &&
      !categories.some((category) => category.id === selectedFilter)
    ) {
      setSelectedFilter('all');
    }
  }, [categories, selectedFilter]);

  // Auto-focus search input
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const categoryCounts = useMemo(() => {
    return items.reduce<Record<string, number>>((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});
  }, [items]);

  // Filter and search items
  const searchResults = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery && selectedFilter === 'all') {
      return [];
    }
    const baseResults = trimmedQuery ? searchItems(trimmedQuery) : items;
    const filteredResults =
      selectedFilter === 'all'
        ? baseResults
        : baseResults.filter((item) => item.type === selectedFilter);

    return [...filteredResults].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [items, searchItems, searchQuery, selectedFilter]);

  const selectedCategory = useMemo(() => {
    if (selectedFilter === 'all') {
      return null;
    }
    return categories.find((category) => category.id === selectedFilter);
  }, [categories, selectedFilter]);

  const hasQuery = searchQuery.trim().length > 0;

  const handleItemPress = useCallback(
    (item: VaultItem) => {
      // Save to recent searches
      if (hasQuery && !recentSearches.includes(searchQuery.trim())) {
        setRecentSearches((prev) => [searchQuery.trim(), ...prev.slice(0, 4)]);
      }
      router.push(`/(vault)/item/${item.id}` as any);
    },
    [router, hasQuery, searchQuery, recentSearches],
  );

  const handleRecentSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    inputRef.current?.focus();
  }, []);

  const handleClearRecent = useCallback(() => {
    setRecentSearches([]);
  }, []);

  const showEmptyState = hasQuery || selectedFilter !== 'all';
  const showRecentSearches = !hasQuery && selectedFilter === 'all' && recentSearches.length > 0;
  const showSearchTips = !hasQuery && selectedFilter === 'all' && recentSearches.length === 0;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[{ paddingBottom: layout.tabBarHeight + spacing.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        {/* Header with search - scrolls with content */}
        <LinearGradient
          colors={[colors.headerGradientStart, colors.headerGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <ThemedText variant="title" style={styles.headerTitle}>
              Search
            </ThemedText>
            <View style={{ width: 40 }} />
          </View>

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search vault items..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch}>
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* Main Content */}
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Filter cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
            keyboardShouldPersistTaps="handled"
          >
            <DynamicCategoryFilterCard
              category={null}
              count={items.length}
              isSelected={selectedFilter === 'all'}
              onPress={() => setSelectedFilter('all')}
            />
            {categories.map((category) => (
              <DynamicCategoryFilterCard
                key={category.id}
                category={category}
                count={categoryCounts[category.id] || 0}
                isSelected={selectedFilter === category.id}
                onPress={() => setSelectedFilter(category.id)}
              />
            ))}
          </ScrollView>

          {/* Search results - Grid layout */}
          {searchResults.length > 0 && (
            <View style={styles.resultsSection}>
              <ThemedText variant="label" color="secondary" style={styles.sectionLabel}>
                {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
              </ThemedText>
              <View style={styles.gridContainer}>
                {searchResults.map((item) => (
                  <VaultItemGridCard key={item.id} item={item} onPress={handleItemPress} />
                ))}
              </View>
            </View>
          )}

          {/* Empty state for search */}
          {showEmptyState && searchResults.length === 0 && (
            <EmptyState
              icon="search-outline"
              title="No results found"
              description={
                hasQuery
                  ? `No items match "${searchQuery}"${
                      selectedFilter !== 'all'
                        ? ` in ${selectedCategory?.label || 'this category'}`
                        : ''
                    }`
                  : selectedCategory
                    ? `No ${selectedCategory.label.toLowerCase()} items in your vault`
                    : 'No items in this category'
              }
            />
          )}

          {/* Recent searches */}
          {showRecentSearches && (
            <View style={styles.recentSection}>
              <View style={styles.recentHeader}>
                <ThemedText variant="subtitle" style={styles.sectionTitle}>
                  Recent Searches
                </ThemedText>
                <TouchableOpacity onPress={handleClearRecent}>
                  <ThemedText variant="caption" color="accent">
                    Clear
                  </ThemedText>
                </TouchableOpacity>
              </View>
              {recentSearches.map((query, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.recentItem, { backgroundColor: colors.card }]}
                  onPress={() => handleRecentSearch(query)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="time-outline" size={18} color={colors.textTertiary} />
                  <ThemedText variant="body" style={styles.recentText}>
                    {query}
                  </ThemedText>
                  <Ionicons name="arrow-forward" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Search tips */}
          {showSearchTips && (
            <View style={styles.tipsSection}>
              <View style={[styles.tipsCard, { backgroundColor: colors.card }]}>
                <View
                  style={[
                    styles.tipsIcon,
                    {
                      backgroundColor: colors.backgroundTertiary,
                    },
                  ]}
                >
                  <Ionicons name="bulb-outline" size={24} color={colors.accent} />
                </View>
                <ThemedText variant="subtitle" style={styles.tipsTitle}>
                  Search Tips
                </ThemedText>

                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <ThemedText variant="bodySmall" color="secondary" style={styles.tipText}>
                    Search by item name or label
                  </ThemedText>
                </View>

                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <ThemedText variant="bodySmall" color="secondary" style={styles.tipText}>
                    Enter last 4 digits to find cards or accounts
                  </ThemedText>
                </View>

                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <ThemedText variant="bodySmall" color="secondary" style={styles.tipText}>
                    Use filters to narrow down by category
                  </ThemedText>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
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
  header: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.base,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: spacing.sm,
  },
  content: {
    flex: 1,
    marginTop: -spacing.md,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  resultsSection: {
    paddingHorizontal: spacing.base,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  recentSection: {
    padding: spacing.base,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  recentText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  tipsSection: {
    padding: spacing.base,
  },
  tipsCard: {
    padding: spacing.base,
    borderRadius: borderRadius.lg,
  },
  tipsIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  tipsTitle: {
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tipText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
});
