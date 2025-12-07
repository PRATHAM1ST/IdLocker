/**
 * Category tabs component for filtering vault items
 * Squircle chip-style design
 */

import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeProvider';
import { ThemedText } from './ThemedText';
import { spacing, borderRadius, getCategoryColor } from '../styles/theme';
import type { VaultItemType } from '../utils/types';
import { VAULT_ITEM_TYPES } from '../utils/constants';

type CategoryFilter = VaultItemType | 'all';

interface CategoryTabsProps {
  selected: CategoryFilter;
  onSelect: (category: CategoryFilter) => void;
  counts?: Record<VaultItemType | 'all', number>;
}

export function CategoryTabs({ selected, onSelect, counts }: CategoryTabsProps) {
  const { colors, isDark } = useTheme();

  const categories: { type: CategoryFilter; label: string; icon: string }[] = [
    { type: 'all', label: 'All', icon: 'grid-outline' },
    ...VAULT_ITEM_TYPES,
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map(({ type, label, icon }) => {
        const isSelected = selected === type;
        const count = counts?.[type];
        const categoryColor = type !== 'all' ? getCategoryColor(type, isDark) : null;

        return (
          <TouchableOpacity
            key={type}
            style={[
              styles.tab,
              {
                backgroundColor: isSelected
                  ? categoryColor?.gradientStart || colors.accent
                  : colors.backgroundTertiary,
              },
            ]}
            onPress={() => onSelect(type)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={icon as any}
              size={16}
              color={isSelected ? '#FFFFFF' : colors.textSecondary}
              style={styles.icon}
            />
            <ThemedText
              variant="caption"
              style={{
                ...styles.label,
                color: isSelected ? '#FFFFFF' : colors.textSecondary,
              }}
            >
              {label}
            </ThemedText>
            {count !== undefined && count > 0 && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : colors.border,
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
      })}
    </ScrollView>
  );
}

/**
 * Visual category cards for home screen horizontal scroll
 */
interface CategoryCardsProps {
  onCategoryPress: (type: VaultItemType) => void;
  counts?: Record<VaultItemType, number>;
}

export function CategoryCards({ onCategoryPress, counts }: CategoryCardsProps) {
  const { colors, isDark } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.cardsContainer}
    >
      {VAULT_ITEM_TYPES.map(({ type, label, icon }) => {
        const categoryColor = getCategoryColor(type, isDark);
        const count = counts?.[type] || 0;

        return (
          <TouchableOpacity
            key={type}
            style={styles.card}
            onPress={() => onCategoryPress(type)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[categoryColor.gradientStart, categoryColor.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Icon */}
              <View style={styles.cardIconContainer}>
                <Ionicons name={icon as any} size={20} color="rgba(255, 255, 255, 0.9)" />
              </View>

              {/* Label & Count */}
              <View style={styles.cardFooter}>
                <ThemedText variant="caption" style={styles.cardLabel}>
                  {label}
                </ThemedText>
                {count > 0 && (
                  <View style={styles.cardBadge}>
                    <ThemedText variant="caption" style={styles.cardBadgeText}>
                      {count}
                    </ThemedText>
                  </View>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  icon: {
    marginRight: spacing.xs,
  },
  label: {
    fontWeight: '500',
  },
  badge: {
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    minWidth: 18,
    alignItems: 'center',
  },
  // Card styles
  cardsContainer: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  card: {
    width: 140,
    height: 100,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    padding: spacing.md,
    position: 'relative',
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  cardBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});
