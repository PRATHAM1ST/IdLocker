/**
 * Search screen - fully scrollable search experience
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedView } from '../../src/components/ThemedView';
import { ThemedText } from '../../src/components/ThemedText';
import { VaultItemCard } from '../../src/components/VaultItemCard';
import { CategoryChip } from '../../src/components/CategoryCard';
import { EmptyState } from '../../src/components/EmptyState';
import { useTheme } from '../../src/context/ThemeProvider';
import { useVault } from '../../src/context/VaultProvider';
import { spacing, borderRadius, layout } from '../../src/styles/theme';
import { VAULT_ITEM_TYPES } from '../../src/utils/constants';
import type { VaultItem, VaultItemType } from '../../src/utils/types';

type FilterType = VaultItemType | 'all';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { items } = useVault();
  const inputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Auto-focus search input
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Filter and search items
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() && selectedFilter === 'all') {
      return [];
    }

    let result = items;

    // Filter by category
    if (selectedFilter !== 'all') {
      result = result.filter(item => item.type === selectedFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => {
        // Search in label
        if (item.label.toLowerCase().includes(query)) return true;

        // Search in non-sensitive fields
        const searchableFields = ['bankName', 'serviceName', 'cardNickname', 'idType', 'title'];
        for (const key of searchableFields) {
          if (item.fields[key]?.toLowerCase().includes(query)) return true;
        }

        // Match last 4 digits exactly
        if (/^\d{4}$/.test(query)) {
          if (item.fields.lastFourDigits === query) return true;
          if (item.fields.accountNumber?.endsWith(query)) return true;
        }

        return false;
      });
    }

    // Sort by updated date
    return result.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [items, selectedFilter, searchQuery]);

  const handleItemPress = useCallback((item: VaultItem) => {
    // Save to recent searches
    if (searchQuery.trim() && !recentSearches.includes(searchQuery.trim())) {
      setRecentSearches(prev => [searchQuery.trim(), ...prev.slice(0, 4)]);
    }
    router.push(`/(vault)/item/${item.id}` as any);
  }, [router, searchQuery, recentSearches]);

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

  const showEmptyState = searchQuery.trim() || selectedFilter !== 'all';
  const showRecentSearches = !searchQuery.trim() && selectedFilter === 'all' && recentSearches.length > 0;
  const showSearchTips = !searchQuery.trim() && selectedFilter === 'all' && recentSearches.length === 0;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: layout.tabBarHeight + spacing.xl }
        ]}
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
          <ThemedText variant="title" style={styles.headerTitle}>
            Search
          </ThemedText>
          
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
          {/* Filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
            keyboardShouldPersistTaps="handled"
          >
            <CategoryChip
              type="all"
              label="All"
              icon="grid-outline"
              isSelected={selectedFilter === 'all'}
              onPress={() => setSelectedFilter('all')}
            />
            {VAULT_ITEM_TYPES.map(({ type, label, icon }) => (
              <CategoryChip
                key={type}
                type={type}
                label={label}
                icon={icon}
                isSelected={selectedFilter === type}
                onPress={() => setSelectedFilter(type)}
              />
            ))}
          </ScrollView>

          {/* Search results */}
          {searchResults.length > 0 && (
            <View style={styles.resultsSection}>
              <ThemedText variant="label" color="secondary" style={styles.sectionLabel}>
                {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
              </ThemedText>
              {searchResults.map((item) => (
                <VaultItemCard
                  key={item.id}
                  item={item}
                  onPress={handleItemPress}
                />
              ))}
            </View>
          )}

          {/* Empty state for search */}
          {showEmptyState && searchResults.length === 0 && (
            <EmptyState
              icon="search-outline"
              title="No results found"
              description={searchQuery 
                ? `No items match "${searchQuery}"${selectedFilter !== 'all' ? ` in ${VAULT_ITEM_TYPES.find(t => t.type === selectedFilter)?.label}` : ''}`
                : `No ${VAULT_ITEM_TYPES.find(t => t.type === selectedFilter)?.label.toLowerCase()} items in your vault`
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
                <View style={[styles.tipsIcon, { backgroundColor: colors.backgroundTertiary }]}>
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.base,
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
    paddingVertical: spacing.md,
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
  chipScroll: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  resultsSection: {
    paddingTop: spacing.sm,
  },
  sectionLabel: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
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
