/**
 * Vault item card component for list display
 * Squircle design language
 */

import React, { useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeProvider';
import { ThemedText } from './ThemedText';
import { spacing, borderRadius, getCategoryColor, shadows } from '../styles/theme';
import type { VaultItem } from '../utils/types';
import { ITEM_TYPE_CONFIGS } from '../utils/constants';
import { getItemPreview } from '../utils/validation';

interface VaultItemCardProps {
  item: VaultItem;
  onPress: (item: VaultItem) => void;
  showMenu?: boolean;
}

export function VaultItemCard({ item, onPress, showMenu = false }: VaultItemCardProps) {
  const { colors, isDark } = useTheme();
  
  const config = ITEM_TYPE_CONFIGS[item.type];
  const categoryColor = getCategoryColor(item.type, isDark);
  const preview = useMemo(() => getItemPreview(item), [item]);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.card },
        shadows.md,
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {/* Gradient accent bar */}
      <LinearGradient
        colors={[categoryColor.gradientStart, categoryColor.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.accentBar}
      />
      
      <View style={[styles.iconContainer, { backgroundColor: categoryColor.bg }]}>
        <Ionicons
          name={config.icon as any}
          size={22}
          color={categoryColor.icon}
        />
      </View>
      
      <View style={styles.content}>
        <ThemedText variant="label" numberOfLines={1} style={styles.label}>
          {item.label}
        </ThemedText>
        <ThemedText variant="caption" color="secondary" numberOfLines={1}>
          {preview}
        </ThemedText>
      </View>

      {showMenu ? (
        <TouchableOpacity style={styles.menuButton} activeOpacity={0.7}>
          <Ionicons
            name="ellipsis-vertical"
            size={18}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
      ) : (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textTertiary}
        />
      )}
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
    padding: spacing.base,
    paddingLeft: spacing.sm,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.base,
    marginVertical: spacing.xs,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  label: {
    marginBottom: 2,
  },
  menuButton: {
    padding: spacing.xs,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  compactIcon: {
    width: 36,
    height: 36,
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
