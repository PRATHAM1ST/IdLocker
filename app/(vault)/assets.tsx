/**
 * Assets browser screen - displays all centralized assets
 * Supports filtering by type, preview, and management
 */

import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  GestureResponderEvent,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { ImageShareModal } from '../../src/components/ImageShareModal';
import { PageContent } from '../../src/components/PageContent';
import { PageHeader } from '../../src/components/PageHeader';
import { ThemedText } from '../../src/components/ThemedText';
import { ThemedView } from '../../src/components/ThemedView';
import { useAssets } from '../../src/context/AssetProvider';
import { useTheme } from '../../src/context/ThemeProvider';
import { useVault } from '../../src/context/VaultProvider';
import { formatFileSize, shareAsset } from '../../src/storage/assetStorage';
import { borderRadius, spacing } from '../../src/styles/theme';
import { assetToImageAttachment } from '../../src/utils/assetHelpers';
import type { Asset, AssetType } from '../../src/utils/types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const GRID_SPACING = spacing.sm;
const ITEM_SIZE =
  (screenWidth - spacing.base * 2 - GRID_SPACING * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

type FilterType = 'all' | AssetType;

const FILTERS: { key: FilterType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'apps-outline' },
  { key: 'image', label: 'Images', icon: 'image-outline' },
  { key: 'pdf', label: 'PDFs', icon: 'document-text-outline' },
  { key: 'document', label: 'Docs', icon: 'document-outline' },
];

export default function AssetsScreen() {
  const { colors } = useTheme();
  const { assets, isLoading, deleteAsset, refreshAssets } = useAssets();
  const { items } = useVault();

  const [filter, setFilter] = useState<FilterType>('all');
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageToolsAsset, setImageToolsAsset] = useState<Asset | null>(null);

  // Filter assets
  const filteredAssets = useMemo(() => {
    if (filter === 'all') return assets;
    return assets.filter((a) => a.type === filter);
  }, [assets, filter]);

  // Sort by date (newest first)
  const sortedAssets = useMemo(() => {
    return [...filteredAssets].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [filteredAssets]);

  // Get items that reference an asset
  const getReferencingItems = useCallback(
    (assetId: string) => {
      return items.filter(
        (item) =>
          item.assetRefs?.some((ref) => ref.assetId === assetId) ||
          item.images?.some((img) => img.id === assetId),
      );
    },
    [items],
  );

  const handleOpenImageTools = useCallback((asset: Asset) => {
    if (asset.type === 'image') {
      setImageToolsAsset(asset);
    }
  }, []);

  const handleCloseImageTools = useCallback(() => {
    setImageToolsAsset(null);
  }, []);

  const imageToolsAttachment = useMemo(
    () => assetToImageAttachment(imageToolsAsset),
    [imageToolsAsset],
  );

  const handleNavigateToItem = useCallback(
    (itemId: string) => {
      setPreviewAsset(null);
      router.push(`/(vault)/item/${itemId}` as any);
    },
    [router],
  );

  const previewLinkedItems = useMemo(() => {
    if (!previewAsset) {
      return [];
    }
    return getReferencingItems(previewAsset.id);
  }, [previewAsset, getReferencingItems]);

  const getAssetIcon = (type: AssetType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'image':
        return 'image-outline';
      case 'pdf':
        return 'document-text-outline';
      case 'document':
        return 'document-outline';
      default:
        return 'attach-outline';
    }
  };

  const handleShare = useCallback(async (asset: Asset) => {
    await shareAsset(asset.uri, asset.mimeType);
  }, []);

  const handleDelete = useCallback(
    (asset: Asset) => {
      const referencingItems = getReferencingItems(asset.id);

      if (referencingItems.length > 0) {
        Alert.alert(
          'Asset In Use',
          `This asset is used by ${referencingItems.length} item(s). Remove it from those items first before deleting.`,
          [{ text: 'OK' }],
        );
        return;
      }

      Alert.alert(
        'Delete Asset',
        `Are you sure you want to delete "${asset.originalFilename}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setIsDeleting(true);
              await deleteAsset(asset.id);
              setIsDeleting(false);
              setPreviewAsset(null);
            },
          },
        ],
      );
    },
    [getReferencingItems, deleteAsset],
  );

  const renderFilterTab = (filterConfig: (typeof FILTERS)[0]) => {
    const isActive = filter === filterConfig.key;
    return (
      <TouchableOpacity
        key={filterConfig.key}
        style={[
          styles.filterTab,
          isActive && { backgroundColor: colors.primary },
          !isActive && { backgroundColor: colors.backgroundSecondary },
        ]}
        onPress={() => setFilter(filterConfig.key)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={filterConfig.icon}
          size={16}
          color={isActive ? '#FFFFFF' : colors.textSecondary}
        />
        <ThemedText
          variant="caption"
          style={[styles.filterTabText, { color: isActive ? '#FFFFFF' : colors.textSecondary }]}
        >
          {filterConfig.label}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  const renderAssetItem = ({ item }: { item: Asset }) => {
    const referencingItems = getReferencingItems(item.id);
    const refCount = referencingItems.length;
    const connectionLabel =
      refCount === 0
        ? 'Not linked'
        : refCount === 1
          ? referencingItems[0].label
          : `${referencingItems[0].label} +${refCount - 1}`;
    const linkDisabled = refCount === 0;

    return (
      <TouchableOpacity
        style={[styles.assetItem, { backgroundColor: colors.card }]}
        onPress={() => setPreviewAsset(item)}
        onLongPress={() => item.type === 'image' && handleOpenImageTools(item)}
        delayLongPress={200}
        activeOpacity={0.8}
      >
        {item.type === 'image' ? (
          <Image source={{ uri: item.uri }} style={styles.assetImage} />
        ) : (
          <View style={[styles.assetDocIcon, { backgroundColor: colors.backgroundTertiary }]}>
            <Ionicons name={getAssetIcon(item.type)} size={28} color={colors.primary} />
          </View>
        )}

        {/* Reference count badge */}
        {refCount > 0 && (
          <View style={[styles.refBadge, { backgroundColor: colors.primary }]}>
            <ThemedText variant="caption" style={styles.refBadgeText}>
              {refCount}
            </ThemedText>
          </View>
        )}

        {/* Type indicator */}
        <View style={[styles.typeBadge, { backgroundColor: colors.accent }]}>
          <Ionicons name={getAssetIcon(item.type)} size={10} color="#FFFFFF" />
        </View>

        {/* Connection badge */}
        <TouchableOpacity
          style={[
            styles.assetLinkBadge,
            {
              backgroundColor: linkDisabled ? colors.backgroundTertiary : colors.backgroundSecondary,
            },
          ]}
          onPress={(event: GestureResponderEvent) => {
            event.stopPropagation();
            if (linkDisabled) {
              return;
            }
            if (refCount === 1) {
              handleNavigateToItem(referencingItems[0].id);
            } else {
              setPreviewAsset(item);
            }
          }}
          activeOpacity={linkDisabled ? 1 : 0.7}
        >
          <Ionicons
            name="link-outline"
            size={12}
            color={linkDisabled ? colors.textTertiary : colors.primary}
          />
          <ThemedText
            variant="caption"
            style={[
              styles.assetLinkText,
              { color: linkDisabled ? colors.textTertiary : colors.text },
            ]}
            numberOfLines={1}
          >
            {connectionLabel}
          </ThemedText>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="folder-open-outline" size={64} color={colors.textTertiary} />
      <ThemedText variant="subtitle" color="secondary" style={styles.emptyTitle}>
        No Assets Yet
      </ThemedText>
      <ThemedText variant="body" color="tertiary" style={styles.emptyText}>
        {filter === 'all'
          ? 'Assets you upload to items will appear here.'
          : `No ${filter}s found. Try a different filter.`}
      </ThemedText>
    </View>
  );

  const renderStats = () => {
    const totalSize = assets.reduce((sum, a) => sum + a.size, 0);
    const imageCount = assets.filter((a) => a.type === 'image').length;
    const pdfCount = assets.filter((a) => a.type === 'pdf').length;
    const docCount = assets.filter((a) => a.type === 'document').length;

    return (
      <View style={[styles.statsContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={styles.statItem}>
          <ThemedText variant="title" style={{ color: colors.primary }}>
            {assets.length}
          </ThemedText>
          <ThemedText variant="caption" color="secondary">
            Total
          </ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <ThemedText variant="title" style={{ color: colors.accent }}>
            {formatFileSize(totalSize)}
          </ThemedText>
          <ThemedText variant="caption" color="secondary">
            Storage
          </ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <ThemedText variant="body">{imageCount}</ThemedText>
              <Ionicons name="image-outline" size={16} color={colors.textSecondary} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <ThemedText variant="body">{pdfCount}</ThemedText>
              <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <ThemedText variant="body">{docCount}</ThemedText>
              <Ionicons name="document-outline" size={16} color={colors.textSecondary} />
            </View>
          </View>
          <ThemedText variant="caption" color="secondary">
            By Type
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <PageHeader
        title="Assets"
        rightActions={[
          {
            icon: 'refresh-outline',
            onPress: refreshAssets,
          },
        ]}
      />

      <PageContent scrollable={false} contentPadding={false}>
        <View style={[styles.mainContent, { backgroundColor: colors.background }]}>
        {/* Stats */}
        {assets.length > 0 && renderStats()}

        {/* Filter tabs */}
        <View style={styles.filterContainer}>{FILTERS.map(renderFilterTab)}</View>

        {/* Assets grid */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : sortedAssets.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={sortedAssets}
            renderItem={renderAssetItem}
            keyExtractor={(item) => item.id}
            numColumns={COLUMN_COUNT}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
          />
        )}
        </View>
      </PageContent>

      {/* Preview Modal */}
      <Modal
        visible={previewAsset !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewAsset(null)}
        statusBarTranslucent={false}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.9)' }]}
          onPress={() => setPreviewAsset(null)}
        >
          <View style={styles.modalContent}>
            {previewAsset && (
              <>
                {previewAsset.type === 'image' ? (
                  <Image
                    source={{ uri: previewAsset.uri }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.documentPreview}>
                    <Ionicons name={getAssetIcon(previewAsset.type)} size={64} color="#FFFFFF" />
                    <ThemedText variant="body" style={styles.previewDocName}>
                      {previewAsset.originalFilename}
                    </ThemedText>
                  </View>
                )}

                {/* Info panel */}
                <View
                  style={[styles.previewInfoPanel, { backgroundColor: colors.backgroundSecondary }]}
                >
                  <ThemedText variant="body" numberOfLines={1}>
                    {previewAsset.originalFilename}
                  </ThemedText>
                  <ThemedText variant="caption" color="secondary">
                    {formatFileSize(previewAsset.size)} • {previewAsset.type.toUpperCase()}
                    {previewAsset.type === 'image' &&
                      ` • ${previewAsset.width}×${previewAsset.height}`}
                  </ThemedText>
                  <View style={styles.linkedItemsContainer}>
                    {previewLinkedItems.length === 0 ? (
                      <ThemedText variant="caption" color="tertiary">
                        Not linked to any items yet.
                      </ThemedText>
                    ) : (
                      <>
                        <ThemedText
                          variant="caption"
                          color="secondary"
                          style={styles.linkedItemsTitle}
                        >
                          Connected to
                        </ThemedText>
                        {previewLinkedItems.slice(0, 4).map((linkedItem) => (
                          <TouchableOpacity
                            key={linkedItem.id}
                            style={[styles.linkedItemButton, { borderColor: colors.border }]}
                            onPress={() => handleNavigateToItem(linkedItem.id)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.linkedItemTextWrapper}>
                              <ThemedText variant="body" numberOfLines={1}>
                                {linkedItem.label}
                              </ThemedText>
                              <ThemedText variant="caption" color="tertiary">
                                {linkedItem.type}
                              </ThemedText>
                            </View>
                            <Ionicons
                              name="arrow-forward-circle-outline"
                              size={18}
                              color={colors.primary}
                            />
                          </TouchableOpacity>
                        ))}
                        {previewLinkedItems.length > 4 && (
                          <ThemedText variant="caption" color="tertiary">
                            +{previewLinkedItems.length - 4} more linked item(s)
                          </ThemedText>
                        )}
                      </>
                    )}
                  </View>
                </View>

                {/* Action buttons */}
                <View style={styles.previewActions}>
                  {previewAsset?.type === 'image' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.accent }]}
                      onPress={() => handleOpenImageTools(previewAsset)}
                    >
                      <Ionicons name="color-wand-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleShare(previewAsset)}
                  >
                    <Ionicons name="share-outline" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.error }]}
                    onPress={() => handleDelete(previewAsset)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Close button */}
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.backgroundSecondary }]}
                  onPress={() => setPreviewAsset(null)}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      <ImageShareModal
        visible={imageToolsAttachment !== null}
        image={imageToolsAttachment}
        onClose={handleCloseImageTools}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xs,
    gap: spacing.xs,
  },
  filterTabText: {
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.md,
  },
  emptyText: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  gridContainer: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  gridRow: {
    justifyContent: 'flex-start',
    gap: GRID_SPACING,
    marginBottom: GRID_SPACING,
  },
  assetItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  assetImage: {
    width: '100%',
    height: '100%',
  },
  assetDocIcon: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  refBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  typeBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetLinkBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    borderRadius: borderRadius.sm,
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  assetLinkText: {
    fontWeight: '600',
    fontSize: 11,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: screenWidth - spacing.xl * 2,
    height: screenHeight * 0.5,
  },
  documentPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  previewDocName: {
    color: '#FFFFFF',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  previewInfoPanel: {
    position: 'absolute',
    bottom: 120,
    left: spacing.lg,
    right: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  linkedItemsContainer: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  linkedItemsTitle: {
    fontWeight: '600',
  },
  linkedItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  linkedItemTextWrapper: {
    flex: 1,
    marginRight: spacing.xs,
  },
  previewActions: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


