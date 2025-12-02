/**
 * Category Card component with gradient background
 * Squircle design language
 * Supports both preset and custom categories
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import { borderRadius, getCategoryColor, shadows, spacing } from '../styles/theme';
import { ITEM_TYPE_CONFIGS } from '../utils/constants';
import type { CustomCategory, VaultItemType } from '../utils/types';
import { ThemedText } from './ThemedText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.base * 2 - spacing.md) / 2;
const CARD_HEIGHT = 110;

interface CategoryCardProps {
  type: VaultItemType;
  count: number;
  onPress: () => void;
}

export function CategoryCard({ type, count, onPress }: CategoryCardProps) {
  const { isDark } = useTheme();
  const config = ITEM_TYPE_CONFIGS[type];
  const categoryColor = getCategoryColor(type, isDark);

  return (
    <TouchableOpacity
      style={[styles.container, shadows.md]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={[categoryColor.gradientStart, categoryColor.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name={config.icon as any}
            size={24}
            color="rgba(255, 255, 255, 0.9)"
          />
        </View>

        {/* Label */}
        <View style={styles.labelContainer}>
          <ThemedText variant="label" style={styles.label}>
            {config.label}
          </ThemedText>
          {count > 0 && (
            <View style={styles.countBadge}>
              <ThemedText variant="caption" style={styles.countText}>
                {count}
              </ThemedText>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

/**
 * Large category card for grid view
 */
interface CategoryCardLargeProps extends CategoryCardProps {
  subtitle?: string;
}

export function CategoryCardLarge({ type, count, onPress }: CategoryCardLargeProps) {
  const { isDark } = useTheme();
  const config = ITEM_TYPE_CONFIGS[type];
  const categoryColor = getCategoryColor(type, isDark);

  return (
    <TouchableOpacity
      style={[styles.largeContainer, shadows.md]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={[categoryColor.gradientStart, categoryColor.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.largeGradient}
      >
        {/* Icon */}
        <View style={styles.largeIconContainer}>
          <Ionicons
            name={config.icon as any}
            size={32}
            color="rgba(255, 255, 255, 0.95)"
          />
        </View>

        {/* Content */}
        <View style={styles.largeContent}>
          <ThemedText variant="subtitle" style={styles.largeLabel}>
            {config.label}
          </ThemedText>
          <ThemedText variant="caption" style={styles.largeSubtitle}>
            {count} {count === 1 ? 'item' : 'items'}
          </ThemedText>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

/**
 * Dynamic category card that works with CustomCategory
 */
interface DynamicCategoryCardProps {
  category: CustomCategory;
  count: number;
  onPress: () => void;
}

export function DynamicCategoryCard({ category, count, onPress }: DynamicCategoryCardProps) {
  return (
    <TouchableOpacity
      style={[styles.largeContainer, shadows.md]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={[category.color.gradientStart, category.color.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.largeGradient}
      >
        {/* Icon */}
        <View style={styles.largeIconContainer}>
          <Ionicons
            name={category.icon as any}
            size={32}
            color="rgba(255, 255, 255, 0.95)"
          />
        </View>

        {/* Content */}
        <View style={styles.largeContent}>
          <ThemedText variant="subtitle" style={styles.largeLabel}>
            {category.label}
          </ThemedText>
          <ThemedText variant="caption" style={styles.largeSubtitle}>
            {count} {count === 1 ? 'item' : 'items'}
          </ThemedText>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

/**
 * Category filter card - looks like CategoryCard but works as a selectable filter
 */
interface CategoryFilterCardProps {
  type: VaultItemType | 'all';
  label: string;
  icon: string;
  isSelected: boolean;
  count?: number;
  onPress: () => void;
}

const FILTER_CARD_WIDTH = 90;
const FILTER_CARD_HEIGHT = 72;

export function CategoryFilterCard({ type, label, icon, isSelected, count, onPress }: CategoryFilterCardProps) {
  const { colors, isDark } = useTheme();
  
  const categoryColor = type !== 'all' ? getCategoryColor(type, isDark) : null;
  
  // For 'all' type, use accent color
  const gradientColors: [string, string] = type !== 'all' && categoryColor
    ? [categoryColor.gradientStart, categoryColor.gradientEnd]
    : [colors.accent, colors.accentLight];

  return (
    <TouchableOpacity
      style={[
        styles.filterCard,
        isSelected && shadows.md,
        !isSelected && { opacity: 0.6 },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.filterGradient}
      >
        {/* Icon */}
        <View style={styles.filterIconContainer}>
          <Ionicons
            name={icon as any}
            size={16}
            color="rgba(255, 255, 255, 0.9)"
          />
        </View>

        {/* Label and count */}
        <View style={styles.filterLabelContainer}>
          <ThemedText variant="caption" style={styles.filterLabel} numberOfLines={1}>
            {label}
          </ThemedText>
          {count !== undefined && (
            <ThemedText variant="caption" style={styles.filterCount}>
              {count}
            </ThemedText>
          )}
        </View>

        {/* Selection indicator */}
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

/**
 * Dynamic category filter card that works with CustomCategory
 */
interface DynamicCategoryFilterCardProps {
  category: CustomCategory | null; // null for 'all'
  isSelected: boolean;
  count: number;
  onPress: () => void;
}

export function DynamicCategoryFilterCard({ category, isSelected, count, onPress }: DynamicCategoryFilterCardProps) {
  const { colors } = useTheme();
  
  // For 'all' type (null category), use accent color
  const gradientColors: [string, string] = category
    ? [category.color.gradientStart, category.color.gradientEnd]
    : [colors.accent, colors.accentLight];

  const icon = category ? category.icon : 'grid-outline';
  const label = category ? category.label : 'All';

  return (
    <TouchableOpacity
      style={[
        styles.filterCard,
        isSelected && shadows.md,
        !isSelected && { opacity: 0.6 },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.filterGradient}
      >
        {/* Icon */}
        <View style={styles.filterIconContainer}>
          <Ionicons
            name={icon as any}
            size={16}
            color="rgba(255, 255, 255, 0.9)"
          />
        </View>

        {/* Label and count */}
        <View style={styles.filterLabelContainer}>
          <ThemedText variant="caption" style={styles.filterLabel} numberOfLines={1}>
            {label}
          </ThemedText>
          <ThemedText variant="caption" style={styles.filterCount}>
            {count}
          </ThemedText>
        </View>

        {/* Selection indicator */}
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

/**
 * Minimal category chip for filter/selection (legacy)
 */
interface CategoryChipProps {
  type: VaultItemType | 'all';
  label: string;
  icon: string;
  isSelected: boolean;
  count?: number;
  onPress: () => void;
}

export function CategoryChip({ type, label, icon, isSelected, count, onPress }: CategoryChipProps) {
  const { colors, isDark } = useTheme();
  
  const categoryColor = type !== 'all' ? getCategoryColor(type, isDark) : null;

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: isSelected 
            ? categoryColor?.gradientStart || colors.accent 
            : colors.backgroundTertiary,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon as any}
        size={16}
        color={isSelected ? '#FFFFFF' : colors.textSecondary}
      />
      <ThemedText
        variant="caption"
        style={[
          styles.chipLabel,
          { color: isSelected ? '#FFFFFF' : colors.textSecondary },
        ]}
      >
        {label}
      </ThemedText>
      {count !== undefined && count > 0 && (
        <View
          style={[
            styles.chipBadge,
            {
              backgroundColor: isSelected 
                ? 'rgba(255,255,255,0.3)' 
                : colors.border,
            },
          ]}
        >
          <ThemedText
            variant="caption"
            style={{
              color: isSelected ? '#FFFFFF' : colors.textSecondary,
              fontSize: 10,
            }}
          >
            {count}
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  gradient: {
    flex: 1,
    padding: spacing.base,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  // Large card styles
  largeContainer: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  largeGradient: {
    flex: 1,
    padding: spacing.base,
    justifyContent: 'space-between',
  },
  largeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeContent: {
    // Bottom aligned via space-between
  },
  largeLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  largeSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Filter card styles (like CategoryCard but smaller, for filters)
  filterCard: {
    width: FILTER_CARD_WIDTH,
    height: FILTER_CARD_HEIGHT,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  filterGradient: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  filterIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 11,
    flex: 1,
  },
  filterCount: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '600',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  // Chip styles
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  chipLabel: {
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  chipBadge: {
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    minWidth: 18,
    alignItems: 'center',
  },
});
