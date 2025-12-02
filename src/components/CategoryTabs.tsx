/**
 * Category tabs component for filtering vault items
 */

import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeProvider';
import { ThemedText } from './ThemedText';
import { spacing, borderRadius } from '../styles/theme';
import type { VaultItemType } from '../utils/types';
import { ITEM_TYPE_CONFIGS, VAULT_ITEM_TYPES } from '../utils/constants';

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
        
        return (
          <TouchableOpacity
            key={type}
            style={[
              styles.tab,
              {
                backgroundColor: isSelected 
                  ? colors.primary 
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
    borderRadius: borderRadius.full,
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
    borderRadius: borderRadius.full,
    minWidth: 18,
    alignItems: 'center',
  },
});

