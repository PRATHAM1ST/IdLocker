/**
 * Category Card component with gradient background
 * Squircle design language
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeProvider';
import { ThemedText } from './ThemedText';
import { spacing, borderRadius, getCategoryColor, shadows } from '../styles/theme';
import type { VaultItemType } from '../utils/types';
import { ITEM_TYPE_CONFIGS } from '../utils/constants';

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
 * Minimal category chip for filter/selection
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
  // Chip styles
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  chipLabel: {
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  chipBadge: {
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    minWidth: 18,
    alignItems: 'center',
  },
});
