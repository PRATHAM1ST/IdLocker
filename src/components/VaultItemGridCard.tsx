/**
 * Vault item grid card component - squircle box design
 * Displays item info in a visually rich card format with image previews
 */

import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeProvider';
import { useCategories } from '../context/CategoryProvider';
import { ThemedText } from './ThemedText';
import { spacing, borderRadius, shadows, typography } from '../styles/theme';
import type { VaultItem } from '../utils/types';
import { getItemPreview, formatCardExpiry } from '../utils/validation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.base * 2 - CARD_GAP) / 2;

interface VaultItemGridCardProps {
  item: VaultItem;
  onPress: (item: VaultItem) => void;
}

export function VaultItemGridCard({ item, onPress }: VaultItemGridCardProps) {
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

  // Get secondary info based on item type or category
  const secondaryInfo = useMemo(() => {
    switch (item.type) {
      case 'bankAccount':
        return item.fields.bankName || 'Bank Account';
      case 'card':
        const expiry = formatCardExpiry(
          item.fields.expiryMonth || '',
          item.fields.expiryYear || '',
        );
        return expiry ? `Exp: ${expiry}` : item.fields.brand || 'Card';
      case 'govId':
        return item.fields.idType || 'Government ID';
      case 'login':
        return item.fields.serviceName || 'Login';
      case 'note':
        return 'Secure Note';
      default:
        return category?.label || 'Item';
    }
  }, [item, category]);

  // Format last updated time
  const lastUpdated = useMemo(() => {
    const date = new Date(item.updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
      }
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)}w ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }, [item.updatedAt]);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card }, shadows.md]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {/* Header section - Image or Gradient */}
      {hasImages && primaryImage ? (
        <View style={styles.imageHeader}>
          <Image source={{ uri: primaryImage.uri }} style={styles.headerImage} resizeMode="cover" />
          {/* Overlay gradient for readability */}
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.imageOverlay} />
          {/* Category badge on image */}
          <View style={styles.imageHeaderBadges}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor.gradientStart }]}>
              <Ionicons
                name={(category?.icon || 'folder-outline') as any}
                size={12}
                color="#FFFFFF"
              />
            </View>
            {imageCount > 1 && (
              <View style={styles.imageCountBadge}>
                <Ionicons name="images" size={10} color="#FFFFFF" />
                <ThemedText style={styles.imageCountText}>{imageCount}</ThemedText>
              </View>
            )}
          </View>
          {/* Type badge at bottom */}
          <View style={styles.typeBadgeOnImage}>
            <ThemedText style={styles.typeBadgeText}>{category?.label || 'Item'}</ThemedText>
          </View>
        </View>
      ) : (
        <LinearGradient
          colors={[categoryColor.gradientStart, categoryColor.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name={(category?.icon || 'folder-outline') as any}
              size={28}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.typeBadge}>
            <ThemedText style={styles.typeBadgeText}>{category?.label || 'Item'}</ThemedText>
          </View>
        </LinearGradient>
      )}

      {/* Content section */}
      <View style={styles.content}>
        <ThemedText variant="label" numberOfLines={2} style={styles.label}>
          {item.label}
        </ThemedText>

        <View style={{ flexGrow: 1 }}>
          <ThemedText
            variant="caption"
            color="secondary"
            numberOfLines={1}
            style={styles.secondaryInfo}
          >
            {secondaryInfo}
          </ThemedText>

          <View style={styles.previewRow}>
            <ThemedText
              variant="bodySmall"
              color="tertiary"
              numberOfLines={1}
              style={styles.preview}
            >
              {preview}
            </ThemedText>
          </View>
        </View>

        {/* Footer with time and image indicator */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={[styles.dot, { backgroundColor: categoryColor.icon }]} />
            <ThemedText variant="caption" color="tertiary" style={styles.time}>
              {lastUpdated}
            </ThemedText>
          </View>
          {hasImages && (
            <View style={styles.attachmentIndicator}>
              <Ionicons name="attach" size={12} color={colors.textTertiary} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: CARD_GAP,
  },
  // Gradient header (no image)
  headerGradient: {
    height: 72,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    lineHeight: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.1,
  },
  // Image header styles
  imageHeader: {
    height: 88,
    position: 'relative',
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
  },
  imageHeaderBadges: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    width: 26,
    height: 26,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  imageCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
    gap: 8,
  },
  imageCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 10,
    fontWeight: '600',
  },
  typeBadgeOnImage: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  // Content section
  content: {
    flexGrow: 1,
    padding: spacing.md,
    paddingTop: spacing.sm,
    justifyContent: 'space-between',
  },
  label: {
    fontWeight: '600',
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  secondaryInfo: {
    marginBottom: 0,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  preview: {
    fontFamily: 'monospace',
    fontSize: typography.sizes.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  time: {
    fontSize: 11,
  },
  attachmentIndicator: {
    opacity: 0.7,
  },
});
