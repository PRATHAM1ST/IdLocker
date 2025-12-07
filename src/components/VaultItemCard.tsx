/**
 * Vault item card component for list display
 * Squircle design language with image preview support
 */

import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeProvider';
import { useCategories } from '../context/CategoryProvider';
import { ThemedText } from './ThemedText';
import { spacing, borderRadius, shadows } from '../styles/theme';
import type { VaultItem } from '../utils/types';
import { getItemPreview } from '../utils/validation';

interface VaultItemCardProps {
  item: VaultItem;
  onPress: (item: VaultItem) => void;
  showMenu?: boolean;
}

export function VaultItemCard({ item, onPress, showMenu = false }: VaultItemCardProps) {
  const { colors, isDark } = useTheme();
  const { getCategoryById } = useCategories();

  const category = useMemo(() => getCategoryById(item.type), [item.type, getCategoryById]);
  const categoryColor = category?.color || {
    gradientStart: '#6B7280',
    gradientEnd: '#9CA3AF',
    icon: '#6B7280',
    bg: '#F3F4F6',
    text: '#374151',
  };
  const preview = useMemo(() => getItemPreview(item, category), [item, category]);
  const hasImages = item.images && item.images.length > 0;
  const imageCount = item.images?.length || 0;
  const primaryImage = hasImages ? item.images![0] : null;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card }, shadows.md]}
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

      {/* Icon or Image thumbnail */}
      {hasImages && primaryImage ? (
        <View style={[styles.imageContainer, { borderColor: categoryColor.bg }]}>
          <Image
            source={{ uri: primaryImage.uri }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
          {imageCount > 1 && (
            <View style={styles.miniImageCount}>
              <ThemedText style={styles.miniImageCountText}>+{imageCount - 1}</ThemedText>
            </View>
          )}
          {/* Small category indicator */}
          <View style={[styles.categoryDot, { backgroundColor: categoryColor.icon }]} />
        </View>
      ) : (
        <View style={[styles.iconContainer, { backgroundColor: categoryColor.bg }]}>
          <Ionicons
            name={(category?.icon || 'folder-outline') as any}
            size={22}
            color={categoryColor.icon}
          />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.labelRow}>
          <ThemedText variant="label" numberOfLines={1} style={styles.label}>
            {item.label}
          </ThemedText>
          {hasImages && (
            <Ionicons
              name="attach"
              size={14}
              color={colors.textTertiary}
              style={styles.attachIcon}
            />
          )}
        </View>
        <ThemedText variant="caption" color="secondary" numberOfLines={1}>
          {preview}
        </ThemedText>
      </View>

      {showMenu ? (
        <TouchableOpacity style={styles.menuButton} activeOpacity={0.7}>
          <Ionicons name="ellipsis-vertical" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  );
}

/**
 * Compact card variant for grouped lists
 */
export function VaultItemCardCompact({ item, onPress }: VaultItemCardProps) {
  const { colors, isDark } = useTheme();
  const { getCategoryById } = useCategories();

  const category = useMemo(() => getCategoryById(item.type), [item.type, getCategoryById]);
  const categoryColor = category?.color || {
    gradientStart: '#6B7280',
    gradientEnd: '#9CA3AF',
    icon: '#6B7280',
    bg: '#F3F4F6',
    text: '#374151',
  };
  const preview = useMemo(() => getItemPreview(item, category), [item, category]);
  const hasImages = item.images && item.images.length > 0;
  const primaryImage = hasImages ? item.images![0] : null;

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
      {hasImages && primaryImage ? (
        <View style={[styles.compactImageContainer, { borderColor: categoryColor.bg }]}>
          <Image
            source={{ uri: primaryImage.uri }}
            style={styles.compactThumbnail}
            resizeMode="cover"
          />
          <View style={[styles.compactCategoryDot, { backgroundColor: categoryColor.icon }]} />
        </View>
      ) : (
        <View style={[styles.compactIcon, { backgroundColor: categoryColor.bg }]}>
          <Ionicons
            name={(category?.icon || 'folder-outline') as any}
            size={18}
            color={categoryColor.icon}
          />
        </View>
      )}

      <View style={styles.compactContent}>
        <View style={styles.compactLabelRow}>
          <ThemedText variant="bodySmall" numberOfLines={1} style={styles.compactLabel}>
            {item.label}
          </ThemedText>
          {hasImages && <Ionicons name="image-outline" size={12} color={colors.textTertiary} />}
        </View>
        <ThemedText variant="caption" color="tertiary" numberOfLines={1}>
          {preview}
        </ThemedText>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
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
  // Image thumbnail styles for main card
  imageContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
    overflow: 'hidden',
    borderWidth: 2,
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  miniImageCount: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  miniImageCountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  categoryDot: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  label: {
    flex: 1,
  },
  attachIcon: {
    marginLeft: spacing.xs,
    opacity: 0.6,
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
  compactImageContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    position: 'relative',
  },
  compactThumbnail: {
    width: '100%',
    height: '100%',
  },
  compactCategoryDot: {
    position: 'absolute',
    top: 1,
    left: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  compactContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  compactLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  compactLabel: {
    flex: 1,
  },
});
