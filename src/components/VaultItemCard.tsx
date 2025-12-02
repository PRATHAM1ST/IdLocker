/**
 * Vault item card component for list display
 */

import React, { useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeProvider';
import { ThemedText } from './ThemedText';
import { spacing, borderRadius, getCategoryColor } from '../styles/theme';
import type { VaultItem, VaultItemType } from '../utils/types';
import { ITEM_TYPE_CONFIGS } from '../utils/constants';
import { getItemPreview } from '../utils/validation';

interface VaultItemCardProps {
  item: VaultItem;
  onPress: (item: VaultItem) => void;
}

export function VaultItemCard({ item, onPress }: VaultItemCardProps) {
  const { colors, isDark, shadows } = useTheme();
  
  const config = ITEM_TYPE_CONFIGS[item.type];
  const categoryColor = getCategoryColor(item.type, isDark);
  const preview = useMemo(() => getItemPreview(item), [item]);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.card },
        shadows.sm,
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: categoryColor.bg }]}>
        <Ionicons
          name={config.icon as any}
          size={22}
          color={categoryColor.icon}
        />
      </View>
      
      <View style={styles.content}>
        <ThemedText variant="label" numberOfLines={1}>
          {item.label}
        </ThemedText>
        <ThemedText variant="caption" color="secondary" numberOfLines={1}>
          {preview}
        </ThemedText>
      </View>
      
      <Ionicons
        name="chevron-forward"
        size={20}
        color={colors.textTertiary}
      />
    </TouchableOpacity>
  );
}

/**
 * Compact card variant for grouped lists
 */
export function VaultItemCardCompact({ item, onPress }: VaultItemCardProps) {
  const { colors, isDark } = useTheme();
  
  const config = ITEM_TYPE_CONFIGS[item.type];
  const categoryColor = getCategoryColor(item.type, isDark);
  const preview = useMemo(() => getItemPreview(item), [item]);

  return (
    <TouchableOpacity
      style={[
        styles.compactContainer,
        { 
          backgroundColor: colors.backgroundSecondary,
          borderBottomColor: colors.border,
        },
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.compactIcon, { backgroundColor: categoryColor.bg }]}>
        <Ionicons
          name={config.icon as any}
          size={18}
          color={categoryColor.icon}
        />
      </View>
      
      <View style={styles.compactContent}>
        <ThemedText variant="bodySmall" numberOfLines={1}>
          {item.label}
        </ThemedText>
        <ThemedText variant="caption" color="tertiary" numberOfLines={1}>
          {preview}
        </ThemedText>
      </View>
      
      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.textTertiary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.base,
    marginVertical: spacing.xs,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  compactIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  compactContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
});

