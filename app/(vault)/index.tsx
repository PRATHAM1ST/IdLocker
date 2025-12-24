/**
 * Vault home screen - Categories as main view with search & settings in header
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DynamicCategoryFilterCard } from '../../src/components/CategoryCard';
import { EmptyState } from '../../src/components/EmptyState';
import { ThemedText } from '../../src/components/ThemedText';
import { ThemedView } from '../../src/components/ThemedView';
import { VaultItemGridCard } from '../../src/components/VaultItemGridCard';
import { useCategories } from '../../src/context/CategoryProvider';
import { useHomeFilter } from '../../src/context/HomeFilterProvider';
import { useTheme } from '../../src/context/ThemeProvider';
import { useVault } from '../../src/context/VaultProvider';
import { borderRadius, layout, spacing } from '../../src/styles/theme';
import type { VaultItem, VaultItemType } from '../../src/utils/types';

type FilterType = VaultItemType | 'all';

export default function VaultHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { items, searchItems } = useVault();
  const { categories } = useCategories();
  const { setHomeFilter } = useHomeFilter();

  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  // Sync selected filter to context for FAB to access
  useEffect(() => {
    setHomeFilter(selectedFilter);
  }, [selectedFilter, setHomeFilter]);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const swipeableRef = useRef<SwipeableMethods>(null);

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

  // Filter and search items
  const searchResults = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    const baseResults = trimmedQuery ? searchItems(trimmedQuery) : items;
    const filteredResults =
      selectedFilter === 'all'
        ? baseResults
        : baseResults.filter((item) => item.type === selectedFilter);

    return [...filteredResults].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [items, searchItems, searchQuery, selectedFilter]);

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

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    inputRef.current?.focus();
  }, []);

  // Get the selected category
  const selectedCategory = useMemo(() => {
    if (selectedFilter === 'all') return null;
    return categories.find((c) => c.id === selectedFilter) || null;
  }, [selectedFilter, categories]);

  // Create unified filter list for swipe navigation
  const filterList = useMemo(() => {
    return ['all' as FilterType, ...categories.map((c) => c.id as FilterType)];
  }, [categories]);

  const currentFilterIndex = filterList.indexOf(selectedFilter);

  // Get previous and next category info for swipe indicators
  const prevCategory = useMemo(() => {
    if (currentFilterIndex <= 0) return null;
    const prevFilter = filterList[currentFilterIndex - 1];
    if (prevFilter === 'all')
      return {
        id: 'all',
        label: 'All Items',
        icon: 'apps',
        color: { gradientStart: colors.accent, gradientEnd: colors.accentLight },
      };
    return categories.find((c) => c.id === prevFilter) || null;
  }, [currentFilterIndex, filterList, categories]);

  const nextCategory = useMemo(() => {
    if (currentFilterIndex >= filterList.length - 1) return null;
    const nextFilter = filterList[currentFilterIndex + 1];
    if (nextFilter === 'all')
      return {
        id: 'all',
        label: 'All Items',
        icon: 'apps',
        color: { gradientStart: colors.accent, gradientEnd: colors.accentLight },
      };
    return categories.find((c) => c.id === nextFilter) || null;
  }, [currentFilterIndex, filterList, categories]);

  // Render right swipe action (shows next category)
  const renderRightActions = useCallback(() => {
    if (!nextCategory) return null;
    return (
      <View style={[styles.swipeAction, styles.swipeActionRight]}>
        <View
          style={[
            styles.swipeActionContent,
            { backgroundColor: nextCategory?.color?.gradientStart, borderRadius: borderRadius.md },
          ]}
        >
          <Ionicons name={(nextCategory.icon || 'folder') as any} size={24} color={colors.text} />
          <ThemedText variant="caption" style={styles.swipeActionText} color="primary">
            {nextCategory.label}
          </ThemedText>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </View>
      </View>
    );
  }, [nextCategory, isDark, colors]);

  // Render left swipe action (shows previous category)
  const renderLeftActions = useCallback(() => {
    if (!prevCategory) return null;
    return (
      <View style={[styles.swipeAction, styles.swipeActionLeft]}>
        <View
          style={[
            styles.swipeActionContent,
            { backgroundColor: prevCategory?.color?.gradientStart, borderRadius: borderRadius.md },
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
          <ThemedText variant="caption" style={styles.swipeActionText} color="primary">
            {prevCategory.label}
          </ThemedText>
          <Ionicons name={(prevCategory.icon || 'folder') as any} size={24} color={colors.text} />
        </View>
      </View>
    );
  }, [prevCategory, isDark, colors]);

  // Handle swipe gesture to navigate between categories
  const handleSwipeOpen = useCallback(
    (direction: 'left' | 'right') => {
      if (direction === 'right') {
        // Swipe left (reveals right side) → go to PREVIOUS
        if (currentFilterIndex > 0) {
          setSelectedFilter(filterList[currentFilterIndex - 1]);
        }
      } else {
        // Swipe right (reveals left side) → go to NEXT
        if (currentFilterIndex < filterList.length - 1) {
          setSelectedFilter(filterList[currentFilterIndex + 1]);
        }
      }
      // Close swipeable after action
      swipeableRef.current?.close();
    },
    [currentFilterIndex, filterList],
  );

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

        <Animated.View
          style={{
            ...styles.searchContainer,
            borderRadius: borderRadius.sm - 1,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0,0,0,0.1)',
          }}
          layout={LinearTransition.springify().damping(18)}
        >
          <Ionicons
            name="search"
            size={20}
            color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}
          />
          <TextInput
            ref={inputRef}
            style={{ ...styles.searchInput, color: colors.text }}
            placeholder="Search vault items..."
            placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Animated.View entering={ZoomIn.duration(150)} exiting={ZoomOut.duration(150)}>
              <TouchableOpacity onPress={handleClearSearch}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}
                  x
                />
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
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
        <Animated.View
          style={styles.sectionHeader}
          layout={LinearTransition.springify().damping(15)}
        >
          <Animated.View key={selectedFilter} entering={FadeIn.duration(200)}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>
              {selectedFilter === 'all' ? 'All Items' : selectedCategory?.label || 'Items'}
            </ThemedText>
          </Animated.View>
          <Animated.View key={`count-${searchResults.length}`} entering={ZoomIn.duration(200)}>
            <ThemedText variant="caption" color="secondary">
              {`${searchResults.length} ${searchResults.length === 1 ? 'item' : 'items'}`}
            </ThemedText>
          </Animated.View>
        </Animated.View>

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
            {searchResults.length > 0 ? (
              <View style={styles.itemsGrid}>
                {searchResults.map((item, index) => (
                  <Animated.View
                    key={item.id}
                    entering={FadeIn.delay(index * 50)
                      .duration(300)
                      .springify()}
                    exiting={FadeOut.duration(300).springify()}
                    layout={LinearTransition}
                  >
                    <VaultItemGridCard item={item} onPress={handleItemPress} />
                  </Animated.View>
                ))}
              </View>
            ) : (
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
                  onAction={() =>
                    handleAddItem(selectedFilter === 'all' ? undefined : selectedFilter)
                  }
                  actionButtonColor={selectedCategory?.color.gradientStart}
                />
              </Animated.View>
            )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.base,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xs,
    paddingBottom: spacing.base,
    flexGrow: 0,
    flexShrink: 0,
    gap: spacing.sm,
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
  swipeAction: {
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.md,
  },
  swipeActionLeft: {
    alignItems: 'flex-start',
  },
  swipeActionRight: {
    alignItems: 'flex-end',
  },
  swipeActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  swipeActionText: {
    fontWeight: '600',
  },
});
