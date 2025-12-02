/**
 * Vault home screen - Categories as main view with search & settings in header
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  DynamicCategoryCard,
  DynamicCategoryFilterCard,
} from "../../src/components/CategoryCard";
import { EmptyState } from "../../src/components/EmptyState";
import { ThemedText } from "../../src/components/ThemedText";
import { ThemedView } from "../../src/components/ThemedView";
import { VaultItemGridCard } from "../../src/components/VaultItemGridCard";
import { useCategories } from "../../src/context/CategoryProvider";
import { useTheme } from "../../src/context/ThemeProvider";
import { useGroupedItems, useVault } from "../../src/context/VaultProvider";
import { borderRadius, layout, spacing } from "../../src/styles/theme";
import type { VaultItem, VaultItemType } from "../../src/utils/types";

type FilterType = VaultItemType | "all";

export default function VaultHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { items, isLoading, refreshVault } = useVault();
  const { categories, refreshCategories } = useCategories();
  const groupedItems = useGroupedItems();

  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Calculate category counts dynamically
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: items.length,
    };
    
    // Calculate counts for each category
    for (const category of categories) {
      counts[category.id] = items.filter(item => item.type === category.id).length;
    }
    
    return counts;
  }, [items, categories]);

  // Filter items based on selection
  const filteredItems = useMemo(() => {
    let result = items;

    if (selectedFilter !== "all") {
      result = result.filter((item) => item.type === selectedFilter);
    }

    return result.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [items, selectedFilter]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refreshVault(), refreshCategories()]);
    setIsRefreshing(false);
  }, [refreshVault, refreshCategories]);

  const handleItemPress = useCallback(
    (item: VaultItem) => {
      router.push(`/(vault)/item/${item.id}` as any);
    },
    [router]
  );

  const handleCategoryPress = useCallback((categoryId: string) => {
    setSelectedFilter(categoryId);
    setViewMode("list");
  }, []);

  const handleAddItem = useCallback(
    (type?: VaultItemType) => {
      if (type) {
        router.push(`/(vault)/add?type=${type}` as any);
      } else {
        router.push("/(vault)/add" as any);
      }
    },
    [router]
  );

  const handleSearchPress = useCallback(() => {
    router.push("/(vault)/search" as any);
  }, [router]);

  const handleSettingsPress = useCallback(() => {
    router.push("/(vault)/settings" as any);
  }, [router]);

  const handleCategoriesPress = useCallback(() => {
    router.push("/(vault)/categories" as any);
  }, [router]);

  // Get the selected category
  const selectedCategory = useMemo(() => {
    if (selectedFilter === "all") return null;
    return categories.find(c => c.id === selectedFilter) || null;
  }, [selectedFilter, categories]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          { paddingBottom: layout.tabBarHeight + spacing.xl },
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
              IdLocker
            </ThemedText>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleSearchPress}
                activeOpacity={0.7}
              >
                <Ionicons name="search" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleCategoriesPress}
                activeOpacity={0.7}
              >
                <Ionicons name="layers-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleSettingsPress}
                activeOpacity={0.7}
              >
                <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewToggle}
                onPress={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
                activeOpacity={0.7}
              >
                <Ionicons
                  name={viewMode === "grid" ? "list" : "grid"}
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Main Content */}
        <View
          style={[styles.content, { backgroundColor: colors.background }]}
        >
          {/* Filter cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <DynamicCategoryFilterCard
              category={null}
              isSelected={selectedFilter === "all"}
              count={categoryCounts.all}
              onPress={() => setSelectedFilter("all")}
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
              {selectedFilter === "all"
                ? "All Items"
                : selectedCategory?.label || "Items"}
            </ThemedText>
            <ThemedText variant="caption" color="secondary">
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "item" : "items"}
            </ThemedText>
          </View>

          {/* Grid or List view */}
          {viewMode === "grid" && selectedFilter === "all" ? (
            <View style={styles.gridContainer}>
              {categories.map((category) => (
                <DynamicCategoryCard
                  key={category.id}
                  category={category}
                  count={categoryCounts[category.id] || 0}
                  onPress={() => handleCategoryPress(category.id)}
                />
              ))}
            </View>
          ) : (
            <>
              {filteredItems.length > 0 ? (
                <View style={styles.itemsGrid}>
                  {filteredItems.map((item) => (
                    <VaultItemGridCard
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
                  description={
                    selectedFilter === "all"
                      ? "Your vault is empty. Add your first item to get started."
                      : `No ${selectedCategory?.label.toLowerCase() || "matching"} items yet.`
                  }
                  actionLabel="Add Item"
                  onAction={() =>
                    handleAddItem(
                      selectedFilter === "all" ? undefined : selectedFilter
                    )
                  }
                />
              )}
            </>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontWeight: "700",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
  },
});
