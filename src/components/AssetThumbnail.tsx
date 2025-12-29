/**
 * Asset thumbnail component for displaying images and documents
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import { formatFileSize } from '../storage/assetStorage';
import { borderRadius, spacing } from '../styles/theme';
import { getAssetIcon } from '../utils/assetHelpers';
import type { Asset } from '../utils/types';
import { ThemedText } from './ThemedText';

interface AssetThumbnailProps {
  asset: Asset;
  onPress: () => void;
  onLongPress?: () => void;
}

export function AssetThumbnail({ asset, onPress, onLongPress }: AssetThumbnailProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.thumbnail, { borderColor: colors.border }]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={200}
      activeOpacity={0.8}
    >
      {asset.type === 'image' ? (
        <Image source={{ uri: asset.uri }} style={styles.imageInner} />
      ) : (
        <View style={[styles.docInner, { backgroundColor: colors.backgroundTertiary }]}>
          <Ionicons name={getAssetIcon(asset.type)} size={28} color={colors.primary} />
          <ThemedText variant="caption" numberOfLines={1} style={styles.docName}>
            {asset.originalFilename}
          </ThemedText>
        </View>
      )}
      <View style={styles.dimensions}>
        <ThemedText variant="caption" style={styles.dimensionsText}>
          {asset.type === 'image'
            ? `${asset.width}×${asset.height}`
            : formatFileSize(asset.size)}
        </ThemedText>
      </View>
      {/* Type badge */}
      <View style={[styles.typeBadge, { backgroundColor: colors.accent }]}>
        <Ionicons name={getAssetIcon(asset.type)} size={10} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  thumbnail: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
    marginRight: spacing.sm,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  imageInner: {
    width: '100%',
    height: '100%',
  },
  docInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  docName: {
    marginTop: spacing.xs,
    textAlign: 'center',
    fontSize: 9,
  },
  dimensions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  dimensionsText: {
    color: '#FFFFFF',
    fontSize: 10,
    textAlign: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

