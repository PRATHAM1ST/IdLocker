/**
 * Vault home screen - displays all vault items with search and filter
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '../../src/components/ThemedView';
import { ThemedText } from '../../src/components/ThemedText';
import { VaultItemCard } from '../../src/components/VaultItemCard';
import { CategoryTabs } from '../../src/components/CategoryTabs';
import { EmptyState } from '../../src/components/EmptyState';
import { IconButton } from '../../src/components/Button';
import { useTheme } from '../../src/context/ThemeProvider';
import { useVault, useGroupedItems } from '../../src/context/VaultProvider';
import { spacing, borderRadius } from '../../src/styles/theme';
import type { VaultItem, VaultItemType } from '../../src/utils/types';

type CategoryFilter = VaultItemType | 'all';

export default function VaultHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { items, isLoading, refreshVault } = useVault();
  const groupedItems = useGroupedItems();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
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

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    let result = items;

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(item => item.type === selectedCategory);
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
  }, [items, selectedCategory, searchQuery]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshVault();
    setIsRefreshing(false);
  }, [refreshVault]);

  const handleItemPress = useCallback((item: VaultItem) => {
    router.push(`/(vault)/item/${item.id}` as any);
  }, [router]);

  const handleAddItem = useCallback(() => {
    router.push('/(vault)/add' as any);
  }, [router]);

  const handleSettings = useCallback(() => {
    router.push('/(vault)/settings' as any);
  }, [router]);

  const renderItem = useCallback(({ item }: { item: VaultItem }) => (
    <VaultItemCard item={item} onPress={handleItemPress} />
  ), [handleItemPress]);

  const renderHeader = () => (
    <View>
      {/* Category tabs */}
      <CategoryTabs
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        counts={categoryCounts}
      />
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (searchQuery) {
      return (
        <EmptyState
          icon="search-outline"
          title="No results found"
          description={`No items match "${searchQuery}"`}
        />
      );
    }

    if (selectedCategory !== 'all') {
      return (
        <EmptyState
          icon="folder-open-outline"
          title="No items in this category"
          description="Add your first item to get started"
          actionLabel="Add Item"
          onAction={handleAddItem}
        />
      );
    }

    return (
      <EmptyState
        icon="shield-outline"
        title="Your vault is empty"
        description="Start adding your sensitive information to keep it secure"
        actionLabel="Add Your First Item"
        onAction={handleAddItem}
      />
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerTop}>
          <View style={styles.titleRow}>
            <View style={[styles.logoMini, { backgroundColor: colors.primary }]}>
              <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
            </View>
            <ThemedText variant="title">Vault</ThemedText>
          </View>
          <IconButton
            icon="settings-outline"
            onPress={handleSettings}
            color={colors.textSecondary}
          />
        </View>

        {/* Search bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.backgroundTertiary }]}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search vault..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Item list */}
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          filteredItems.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: colors.primary, bottom: insets.bottom + spacing.lg },
        ]}
        onPress={handleAddItem}
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
  header: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoMini: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: spacing.sm,
    paddingVertical: spacing.xs,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

