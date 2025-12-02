/**
 * Vault home screen - fully scrollable with illustrated header
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../src/components/ThemedText';
import { VaultItemCard } from '../../src/components/VaultItemCard';
import { CategoryCard } from '../../src/components/CategoryCard';
import { IllustratedHeader } from '../../src/components/IllustratedHeader';
import { EmptyState } from '../../src/components/EmptyState';
import { useTheme } from '../../src/context/ThemeProvider';
import { useVault, useGroupedItems } from '../../src/context/VaultProvider';
import { spacing, borderRadius, layout } from '../../src/styles/theme';
import { VAULT_ITEM_TYPES } from '../../src/utils/constants';
import type { VaultItem, VaultItemType } from '../../src/utils/types';

export default function VaultHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { items, isLoading, refreshVault } = useVault();
  const groupedItems = useGroupedItems();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<VaultItemType, number> = {
      bankAccount: groupedItems.get('bankAccount')?.length || 0,
      card: groupedItems.get('card')?.length || 0,
      govId: groupedItems.get('govId')?.length || 0,
      login: groupedItems.get('login')?.length || 0,
      note: groupedItems.get('note')?.length || 0,
      other: groupedItems.get('other')?.length || 0,
    };
    return counts;
  }, [groupedItems]);

  // Get recent items (last 10)
  const recentItems = useMemo(() => {
    return [...items]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);
  }, [items]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshVault();
    setIsRefreshing(false);
  }, [refreshVault]);

  const handleItemPress = useCallback((item: VaultItem) => {
    router.push(`/(vault)/item/${item.id}` as any);
  }, [router]);

  const handleCategoryPress = useCallback((type: VaultItemType) => {
    router.push(`/(vault)/categories?filter=${type}` as any);
  }, [router]);

  const handleSearchPress = useCallback(() => {
    router.push('/(vault)/search' as any);
  }, [router]);

  const handleAddItem = useCallback(() => {
    router.push('/(vault)/add' as any);
  }, [router]);

  if (isLoading && items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        {/* Illustrated Header - scrolls with content */}
        <IllustratedHeader
          title="IdLocker"
          subtitle="Your secure vault"
          onSearchPress={handleSearchPress}
        />

        {/* Main Content */}
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Categories Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText variant="subtitle" style={styles.sectionTitle}>
                Categories
              </ThemedText>
              <ThemedText variant="caption" color="secondary">
                {items.length} items total
              </ThemedText>
            </View>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {VAULT_ITEM_TYPES.map(({ type }) => (
                <CategoryCard
                  key={type}
                  type={type}
                  count={categoryCounts[type]}
                  onPress={() => handleCategoryPress(type)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Recent Items Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText variant="subtitle" style={styles.sectionTitle}>
                Recent Items
              </ThemedText>
              {recentItems.length > 0 && (
                <TouchableOpacity 
                  onPress={() => router.push('/(vault)/categories' as any)}
                  activeOpacity={0.7}
                >
                  <ThemedText variant="caption" color="accent" style={styles.seeAllText}>
                    See All
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
            
            {recentItems.length > 0 ? (
              <View style={styles.itemsList}>
                {recentItems.map((item) => (
                  <VaultItemCard
                    key={item.id}
                    item={item}
                    onPress={handleItemPress}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="shield-outline"
                title="Your vault is empty"
                description="Start adding your sensitive information to keep it secure"
                actionLabel="Add Your First Item"
                onAction={handleAddItem}
              />
            )}
          </View>
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
        onPress={handleAddItem}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
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
  content: {
    flex: 1,
    marginTop: -spacing.lg,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
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
  seeAllText: {
    fontWeight: '600',
  },
  categoryScroll: {
    paddingHorizontal: spacing.base,
  },
  itemsList: {
    // Items have their own horizontal margin
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
