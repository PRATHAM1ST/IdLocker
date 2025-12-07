/**
 * Categories management screen
 * List, add, edit, and delete categories
 */

import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '../../src/components/ThemedView';
import { ThemedText } from '../../src/components/ThemedText';
import { Button } from '../../src/components/Button';
import { useTheme } from '../../src/context/ThemeProvider';
import { useCategories } from '../../src/context/CategoryProvider';
import { useVault } from '../../src/context/VaultProvider';
import { spacing, borderRadius, shadows, layout } from '../../src/styles/theme';
import type { CustomCategory } from '../../src/utils/types';

export default function CategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { categories, deleteCategory, resetToDefaults } = useCategories();
  const { items } = useVault();

  // Get count of items per category
  const getCategoryItemCount = useCallback(
    (categoryId: string) => {
      return items.filter((item) => item.type === categoryId).length;
    },
    [items],
  );

  const handleAddCategory = useCallback(() => {
    router.push('/(vault)/category/new' as any);
  }, [router]);

  const handleEditCategory = useCallback(
    (category: CustomCategory) => {
      router.push(`/(vault)/category/${category.id}` as any);
    },
    [router],
  );

  const handleDeleteCategory = useCallback(
    (category: CustomCategory) => {
      const itemCount = getCategoryItemCount(category.id);

      if (itemCount > 0) {
        Alert.alert(
          'Cannot Delete',
          `This category has ${itemCount} item${itemCount === 1 ? '' : 's'}. Please delete or move the items first.`,
          [{ text: 'OK' }],
        );
        return;
      }

      Alert.alert(
        'Delete Category',
        `Are you sure you want to delete "${category.label}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const success = await deleteCategory(category.id);
              if (!success) {
                Alert.alert('Error', 'Failed to delete category.');
              }
            },
          },
        ],
      );
    },
    [deleteCategory, getCategoryItemCount],
  );

  const handleResetToDefaults = useCallback(() => {
    Alert.alert(
      'Reset Categories',
      'This will reset all categories to their default state. Custom categories will be deleted. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const success = await resetToDefaults();
            if (success) {
              Alert.alert('Success', 'Categories have been reset to defaults.');
            } else {
              Alert.alert('Error', 'Failed to reset categories.');
            }
          },
        },
      ],
    );
  }, [resetToDefaults]);

  const renderCategoryItem = (category: CustomCategory) => {
    const itemCount = getCategoryItemCount(category.id);

    return (
      <TouchableOpacity
        key={category.id}
        style={[styles.categoryCard, { backgroundColor: colors.card }, shadows.sm]}
        onPress={() => handleEditCategory(category)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[category.color.gradientStart, category.color.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.categoryIcon}
        >
          <Ionicons name={category.icon as any} size={24} color="#FFFFFF" />
        </LinearGradient>

        <View style={styles.categoryInfo}>
          <View style={styles.categoryHeader}>
            <ThemedText variant="body" style={styles.categoryName}>
              {category.label}
            </ThemedText>
          </View>
          <ThemedText variant="caption" color="secondary">
            {category.fields.length} field{category.fields.length !== 1 ? 's' : ''} • {itemCount}{' '}
            item{itemCount !== 1 ? 's' : ''}
          </ThemedText>
        </View>

        <View style={styles.categoryActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.backgroundTertiary }]}
            onPress={() => handleEditCategory(category)}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={16} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error + '15' }]}
            onPress={() => handleDeleteCategory(category)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header */}
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
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <ThemedText variant="subtitle" style={styles.headerTitle}>
            Manage Categories
          </ThemedText>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddCategory}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={[styles.content, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: layout.tabBarHeight + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Info card */}
          <View style={[styles.infoCard, { backgroundColor: colors.primary + '10' }]}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <ThemedText variant="bodySmall" color="secondary" style={styles.infoText}>
              Tap a category to edit its fields. Categories with items cannot be deleted.
            </ThemedText>
          </View>

          {/* Categories list */}
          <View style={styles.categoryList}>{categories.map(renderCategoryItem)}</View>

          {/* Add category button */}
          <TouchableOpacity
            style={[styles.addCategoryCard, { borderColor: colors.border }]}
            onPress={handleAddCategory}
            activeOpacity={0.7}
          >
            <View style={[styles.addIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="add" size={24} color={colors.primary} />
            </View>
            <ThemedText variant="body" style={{ color: colors.primary }}>
              Create New Category
            </ThemedText>
          </TouchableOpacity>

          {/* Reset button */}
          <View style={styles.resetSection}>
            <Button
              title="Reset to Defaults"
              onPress={handleResetToDefaults}
              variant="outline"
              icon="refresh-outline"
              size="sm"
            />
            <ThemedText variant="caption" color="tertiary" style={styles.resetHint}>
              This will restore all preset categories and remove custom ones
            </ThemedText>
          </View>
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
    fontWeight: '600',
  },
  addButton: {
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
    paddingTop: spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    lineHeight: 20,
  },
  categoryList: {
    gap: spacing.md,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  categoryName: {
    fontWeight: '600',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  addIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetSection: {
    marginTop: spacing['2xl'],
    alignItems: 'center',
  },
  resetHint: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
