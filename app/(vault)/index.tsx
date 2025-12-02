/**
 * Vault home screen - redesigned with illustrated header and bottom sheet style
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
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
import { spacing, borderRadius } from '../../src/styles/theme';
import { VAULT_ITEM_TYPES } from '../../src/utils/constants';
import type { VaultItem, VaultItemType } from '../../src/utils/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  const renderCategorySection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText variant="title" style={styles.sectionTitle}>
          Categories
        </ThemedText>
        <ThemedText variant="caption" color="secondary">
          Quick access
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
  );

  const renderRecentSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText variant="title" style={styles.sectionTitle}>
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
        recentItems.map((item) => (
          <VaultItemCard
            key={item.id}
            item={item}
            onPress={handleItemPress}
          />
        ))
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
  );

  if (isLoading && items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <IllustratedHeader onSearchPress={handleSearchPress} />
        <View style={[styles.bottomSheet, { backgroundColor: colors.background }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.headerGradientStart }]}>
      {/* Illustrated Header */}
      <IllustratedHeader onSearchPress={handleSearchPress} />

      {/* Bottom Sheet Content */}
      <View style={[styles.bottomSheet, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Drag indicator */}
          <View style={styles.dragIndicatorContainer}>
            <View style={[styles.dragIndicator, { backgroundColor: colors.border }]} />
          </View>

          {/* Categories */}
          {renderCategorySection()}

          {/* Recent Items */}
          {renderRecentSection()}
        </ScrollView>
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          { 
            backgroundColor: colors.accent,
            bottom: insets.bottom + 100,
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
  bottomSheet: {
    flex: 1,
    marginTop: -24,
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  section: {
    paddingTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  seeAllText: {
    fontWeight: '600',
  },
  categoryScroll: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
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
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
