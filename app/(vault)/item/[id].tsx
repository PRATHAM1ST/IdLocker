/**
 * Item detail screen - displays all fields with copy/show functionality
 * Redesigned with category-colored gradient header
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AssetThumbnail } from '../../../src/components/AssetThumbnail';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { ImageShareModal } from '../../../src/components/ImageShareModal';
import { ModalActionButton } from '../../../src/components/ModalActionButton';
import { PageContent } from '../../../src/components/PageContent';
import { SectionTitle } from '../../../src/components/SectionTitle';
import { SecureField } from '../../../src/components/SecureField';
import { ThemedText } from '../../../src/components/ThemedText';
import { ThemedView } from '../../../src/components/ThemedView';
import { useAssets } from '../../../src/context/AssetProvider';
import { useCategories } from '../../../src/context/CategoryProvider';
import { useTheme } from '../../../src/context/ThemeProvider';
import { useVault } from '../../../src/context/VaultProvider';
import { formatFileSize, shareAsset } from '../../../src/storage/assetStorage';
import { borderRadius, spacing } from '../../../src/styles/theme';
import { assetToImageAttachment, getAssetIcon } from '../../../src/utils/assetHelpers';
import { formatDate } from '../../../src/utils/formatters';
import { buildDisplayFields } from '../../../src/utils/itemHelpers';
import type { Asset } from '../../../src/utils/types';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { getItem, deleteItem, isLoading } = useVault();
  const { getCategoryById } = useCategories();
  const { getAssetsForItem, migrateItemAssets, ensureAssetsLoaded } = useAssets();

  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [itemAssets, setItemAssets] = useState<Asset[]>([]);
  const [imageToolsAsset, setImageToolsAsset] = useState<Asset | null>(null);

  const item = useMemo(() => getItem(id), [getItem, id]);

  // Load assets for item (with migration if needed)
  useEffect(() => {
    let isActive = true;

    const loadAssets = async () => {
      if (!item) {
        return;
      }

      console.log('[ItemDetail] Item loaded:', {
        id: item.id,
        label: item.label,
        hasAssetRefs: !!item.assetRefs,
        assetRefCount: item.assetRefs?.length || 0,
        hasLegacyImages: !!item.images,
        legacyImageCount: item.images?.length || 0,
      });

      const candidateIds: string[] = [];
      if (item.assetRefs?.length) {
        candidateIds.push(...item.assetRefs.map((ref) => ref.assetId));
      }
      if (item.images?.length) {
        candidateIds.push(...item.images.map((img) => img.id));
      }

      if (candidateIds.length > 0) {
        await ensureAssetsLoaded(candidateIds);
      }

      let assetsForItem = getAssetsForItem(item);

      if (assetsForItem.length === 0 && item.images && item.images.length > 0) {
        await migrateItemAssets(item);
        await ensureAssetsLoaded(item.images.map((img) => img.id));
        assetsForItem = getAssetsForItem(item);
      }

      if (isActive) {
        setItemAssets(assetsForItem);
      }
    };

    loadAssets();

    return () => {
      isActive = false;
    };
  }, [item, getAssetsForItem, migrateItemAssets, ensureAssetsLoaded]);

  const category = useMemo(
    () => (item ? getCategoryById(item.type) : null),
    [item, getCategoryById],
  );
  const categoryColor = category?.color || null;

  const handleEdit = useCallback(() => {
    if (item) {
      router.push(`/(vault)/edit/${item.id}` as any);
    }
  }, [item, router]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item?.label}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (item) {
              setIsDeleting(true);
              const success = await deleteItem(item.id);
              setIsDeleting(false);
              if (success) {
                router.back();
              } else {
                Alert.alert('Error', 'Failed to delete item. Please try again.');
              }
            }
          },
        },
      ],
    );
  }, [item, deleteItem, router]);

  const handleShareAsset = useCallback(async (asset: Asset) => {
    await shareAsset(asset.uri, asset.mimeType);
  }, []);

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

  if (!item || !category || !categoryColor) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Details', headerShown: true }} />
        <View style={styles.loadingContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
              <ThemedText variant="body" color="secondary" style={styles.errorText}>
                Item not found
              </ThemedText>
              <Button title="Go Back" onPress={() => router.back()} variant="outline" />
            </>
          )}
        </View>
      </ThemedView>
    );
  }

  // Build display fields from category template
  const displayFields = useMemo(
    () => buildDisplayFields(item, category),
    [item, category],
  );

  // Add custom fields to display
  const customFieldsDisplay = item.customFields || [];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Gradient Header - Specialized for item detail */}
        <LinearGradient
          colors={[categoryColor.gradientStart, categoryColor.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        >
          {/* Decorative circles */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />

          {/* Navigation */}
          <View style={styles.headerNav}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={handleEdit} activeOpacity={0.7}>
              <Ionicons name="create-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Icon and title */}
          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <Ionicons name={category.icon as any} size={36} color="rgba(255, 255, 255, 0.95)" />
            </View>
            {/* @ts-expect-error - sharedTransitionTag is valid but types may be outdated */}
            <Animated.View sharedTransitionTag="label">
              <ThemedText variant="title" style={styles.headerTitle}>
                {item.label}
              </ThemedText>
            </Animated.View>
            <View style={styles.typeBadge}>
              <ThemedText variant="caption" style={styles.typeBadgeText}>
                {category.label}
              </ThemedText>
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <PageContent scrollable={false} contentPadding={false}>
          <View style={styles.content}>
          {/* Fields */}
          <Card>
            <SectionTitle>Details</SectionTitle>
            {displayFields.map((field) => (
              <SecureField
                key={field.key}
                label={field.label}
                value={field.value}
                sensitive={field.sensitive}
                copyable
              />
            ))}
          </Card>

          {/* Custom Fields */}
          {customFieldsDisplay.length > 0 && (
            <Card>
              <SectionTitle>Custom Fields</SectionTitle>
              {customFieldsDisplay.map((field) => (
                <SecureField
                  key={field.id}
                  label={field.label}
                  value={field.value}
                  sensitive={false}
                  copyable
                />
              ))}
            </Card>
          )}

          {/* Assets (Images, PDFs, Documents) */}
          {itemAssets.length > 0 && (
            <Card>
              <SectionTitle>Attachments ({itemAssets.length})</SectionTitle>
              <ThemedText variant="caption" color="tertiary" style={styles.imageHint}>
                Tap an attachment to preview or share
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imagesContainer}
              >
                {itemAssets.map((asset) => (
                  <AssetThumbnail
                    key={asset.id}
                    asset={asset}
                    onPress={() => setSelectedAsset(asset)}
                    onLongPress={
                      asset.type === 'image' ? () => handleOpenImageTools(asset) : undefined
                    }
                  />
                ))}
              </ScrollView>
            </Card>
          )}

          {/* Metadata */}
          <View style={[styles.metaCard]}>
            <View style={styles.metaRow}>
              <ThemedText variant="caption" color="tertiary">
                Created
              </ThemedText>
              <ThemedText variant="caption" color="secondary">
                {formatDate(item.createdAt)}
              </ThemedText>
            </View>
            <View style={styles.metaRow}>
              <ThemedText variant="caption" color="tertiary">
                Last Updated
              </ThemedText>
              <ThemedText variant="caption" color="secondary">
                {formatDate(item.updatedAt)}
              </ThemedText>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {/* <Button
              title="Edit Item"
              onPress={handleEdit}
              variant="outline"
              icon="create-outline"
              fullWidth
              style={styles.actionButton}
            /> */}
            <Button
              title={isDeleting ? 'Deleting...' : 'Delete Item'}
              onPress={handleDelete}
              variant="danger"
              icon="trash-outline"
              fullWidth
              loading={isDeleting}
              disabled={isDeleting}
            />
          </View>
          </View>
        </PageContent>
      </ScrollView>

      {/* Asset Preview Modal */}
      <Modal
        visible={selectedAsset !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAsset(null)}
        statusBarTranslucent={false}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.9)' }]}>
          <View style={styles.modalContent}>
            {selectedAsset && (
              <>
                {selectedAsset.type === 'image' ? (
                  <Image
                    source={{ uri: selectedAsset.uri }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.documentPreview}>
                    <Ionicons name={getAssetIcon(selectedAsset.type)} size={64} color="#FFFFFF" />
                    <ThemedText variant="body" style={styles.previewDocName}>
                      {selectedAsset.originalFilename}
                    </ThemedText>
                    <ThemedText variant="caption" style={styles.previewDocInfo}>
                      {formatFileSize(selectedAsset.size)} • {selectedAsset.mimeType}
                    </ThemedText>
                  </View>
                )}

                {/* Info panel */}
                <View
                  style={[styles.previewInfoPanel, { backgroundColor: colors.backgroundSecondary }]}
                >
                  <ThemedText variant="body" numberOfLines={1}>
                    {selectedAsset.originalFilename}
                  </ThemedText>
                  <ThemedText variant="caption" color="secondary">
                    {selectedAsset.type === 'image'
                      ? `${selectedAsset.width}×${selectedAsset.height} • ${formatFileSize(
                          selectedAsset.size,
                        )}`
                      : formatFileSize(selectedAsset.size)}
                  </ThemedText>
                </View>

                {selectedAsset.type === 'image' && (
                  <ModalActionButton
                    icon="color-wand-outline"
                    onPress={() => handleOpenImageTools(selectedAsset)}
                    backgroundColor={colors.accent}
                    style={styles.toolsButton}
                  />
                )}

                {/* Action button */}
                <ModalActionButton
                  icon="share-outline"
                  onPress={() => handleShareAsset(selectedAsset)}
                  backgroundColor={colors.primary}
                  style={styles.shareButton}
                />

                {/* Close button */}
                <ModalActionButton
                  icon="close"
                  onPress={() => setSelectedAsset(null)}
                  backgroundColor={colors.backgroundSecondary}
                  iconColor={colors.text}
                  size={44}
                  style={styles.closeButton}
                />
              </>
            )}
          </View>
        </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  errorText: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  // Header styles
  header: {
    paddingBottom: spacing['2xl'],
    paddingHorizontal: spacing.base,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  typeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  // Content styles
  content: {
    padding: spacing.base,
    paddingTop: spacing.lg,
  },
  imageHint: {
    marginBottom: spacing.md,
  },
  imagesContainer: {
    paddingVertical: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: Dimensions.get('window').width - spacing.xl * 2,
    height: Dimensions.get('window').height * 0.5,
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
  previewDocInfo: {
    color: '#AAAAAA',
    marginTop: spacing.sm,
  },
  previewInfoPanel: {
    position: 'absolute',
    bottom: 120,
    left: spacing.lg,
    right: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  shareButton: {
    position: 'absolute',
    bottom: 60,
    right: spacing.lg,
  },
  toolsButton: {
    position: 'absolute',
    bottom: 60,
    left: spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: spacing.lg,
  },
  metaCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
});
