/**
 * Category Card components with gradient background
 * Squircle design language
 * Dynamic components that work with CustomCategory
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import { borderRadius, shadows, spacing } from '../styles/theme';
import type { CustomCategory } from '../utils/types';
import { ThemedText } from './ThemedText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.base * 2 - spacing.md) / 2;
const FILTER_CARD_WIDTH = 80;
const FILTER_CARD_HEIGHT = 64;

/**
 * Dynamic category card that works with CustomCategory
 * Enhanced with edit/delete buttons and additional info
 */
interface DynamicCategoryCardProps {
  category: CustomCategory;
  count: number;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  customStyle?: StyleProp<ViewStyle>;
}

export function DynamicCategoryCard({
  category,
  count,
  onPress,
  onEdit,
  onDelete,
  showActions = false,
  customStyle,
}: DynamicCategoryCardProps) {
  return (
    <View style={[styles.cardContainer, shadows.md, customStyle]}>
      <TouchableOpacity style={{ flex: 1 }} onPress={onPress} activeOpacity={0.85}>
        <LinearGradient
          colors={[category.color.gradientStart, category.color.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Top section with icon and actions */}
          <View style={styles.topSection}>
            <View style={styles.iconContainer}>
              <Ionicons name={category.icon as any} size={28} color="rgba(255, 255, 255, 0.95)" />
            </View>

            {/* Action buttons overlay */}
            {showActions && (onEdit || onDelete) && (
              <View style={styles.actionOverlay}>
                {onEdit && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                {onDelete && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Content section */}
          <View style={styles.contentSection}>
            <View style={styles.titleRow}>
              <ThemedText variant="subtitle" style={styles.cardLabel} numberOfLines={1}>
                {category.label}
              </ThemedText>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="cube-outline" size={12} color="rgba(255, 255, 255, 0.8)" />
                <ThemedText variant="caption" style={styles.statText}>
                  {count}
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="list-outline" size={12} color="rgba(255, 255, 255, 0.8)" />
                <ThemedText variant="caption" style={styles.statText}>
                  {category.fields.length}
                </ThemedText>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
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

export function DynamicCategoryFilterCard({
  category,
  isSelected,
  count,
  onPress,
}: DynamicCategoryFilterCardProps) {
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
        { transform: [{ scale: isSelected ? 1.05 : 1 }] },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 1)', 'transparent', 'transparent', 'rgba(255, 255, 255, 1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.filterOuterGradient}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.filterInnerGradient}
        >
          {/* Icon */}
          <View style={styles.filterIconContainer}>
            <Ionicons name={icon as any} size={16} color="rgba(255, 255, 255, 0.9)" />
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
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Card styles
  cardContainer: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  cardGradient: {
    minHeight: 160,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionOverlay: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentSection: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  cardLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  // Filter card styles
  filterCard: {
    width: FILTER_CARD_WIDTH,
    height: FILTER_CARD_HEIGHT,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  filterOuterGradient: {
    borderRadius: borderRadius.sm,
    padding: 1,
    flex: 1,
  },
  filterInnerGradient: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.sm - 1,
  },
  filterIconContainer: {
    width: 16,
    height: 16,
    flexGrow: 1,
  },
  filterLabelContainer: {
    height: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
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
    top: 8,
    right: 8,
  },
});
