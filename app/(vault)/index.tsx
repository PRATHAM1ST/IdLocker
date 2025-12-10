/**
 * Vault home screen - Categories as main view with search & settings in header
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  EntryExitTransition,
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

  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

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

  const handleSearchPress = useCallback(() => {
    router.push('/(vault)/search' as any);
  }, [router]);

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
        <Animated.View
          style={{
            ...styles.searchContainer,
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
                x/>
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

        <ScrollView
          contentContainerStyle={{
            paddingBottom: layout.tabBarHeight + spacing.xl,
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
                  exiting={FadeOut.duration(200)}
                  layout={LinearTransition}
                >
                  <VaultItemGridCard item={item} onPress={handleItemPress} />
                </Animated.View>
              ))}
            </View>
          ) : (
            <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
              <EmptyState
                icon="folder-open-outline"
                title="No items found"
                description={
                  selectedFilter === 'all'
                    ? 'Your vault is empty. Add your first item to get started.'
                    : `No ${selectedCategory?.label.toLowerCase() || 'matching'} items yet.`
                }
                actionLabel="Add Item"
                onAction={() =>
                  handleAddItem(selectedFilter === 'all' ? undefined : selectedFilter)
                }
              />
            </Animated.View>
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
});
