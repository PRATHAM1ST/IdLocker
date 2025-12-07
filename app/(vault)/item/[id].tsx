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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../src/components/Button';
import { SecureField } from '../../../src/components/SecureField';
import { ThemedText } from '../../../src/components/ThemedText';
import { ThemedView } from '../../../src/components/ThemedView';
import { useAssets } from '../../../src/context/AssetProvider';
import { useCategories } from '../../../src/context/CategoryProvider';
import { useTheme } from '../../../src/context/ThemeProvider';
import { useVault } from '../../../src/context/VaultProvider';
import { formatFileSize, shareAsset } from '../../../src/storage/assetStorage';
import { borderRadius, shadows, spacing } from '../../../src/styles/theme';
import { SENSITIVE_FIELDS } from '../../../src/utils/constants';
import type { Asset, AssetType } from '../../../src/utils/types';
import { formatCardExpiry } from '../../../src/utils/validation';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { getItem, deleteItem, isLoading } = useVault();
  const { getCategoryById } = useCategories();
  const { getAssetsForItem, migrateItemAssets } = useAssets();

  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [itemAssets, setItemAssets] = useState<Asset[]>([]);

  const item = useMemo(() => getItem(id), [getItem, id]);
  
  // Load assets for item (with migration if needed)
  useEffect(() => {
    const loadAssets = async () => {
      if (item) {
        console.log('[ItemDetail] Item loaded:', {
          id: item.id,
          label: item.label,
          hasAssetRefs: !!item.assetRefs,
          assetRefCount: item.assetRefs?.length || 0,
          hasLegacyImages: !!item.images,
          legacyImageCount: item.images?.length || 0,
        });
        
        // Get assets for this item (handles both assetRefs and legacy images)
        let assets = getAssetsForItem(item);
        
        // If item has legacy images but no assets found, try migration
        if (assets.length === 0 && item.images && item.images.length > 0) {
          await migrateItemAssets(item);
          assets = getAssetsForItem(item);
        }
        
        setItemAssets(assets);
      }
    };
    loadAssets();
  }, [item, getAssetsForItem, migrateItemAssets]);
  
  const category = useMemo(() => item ? getCategoryById(item.type) : null, [item, getCategoryById]);
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
      ]
    );
  }, [item, deleteItem, router]);

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

  const handleShareAsset = useCallback(async (asset: Asset) => {
    await shareAsset(asset.uri, asset.mimeType);
  }, []);

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
  const displayFields: { key: string; label: string; value: string; sensitive: boolean }[] = [];
  
  for (const fieldDef of category.fields) {
    const value = item.fields[fieldDef.key];
    if (value) {
      // Special formatting for expiry
      if (fieldDef.key === 'expiryMonth' && item.fields.expiryYear) {
        continue; // Skip month, we'll combine with year
      }
      if (fieldDef.key === 'expiryYear' && item.fields.expiryMonth) {
        displayFields.push({
          key: 'expiry',
          label: 'Expiry Date',
          value: formatCardExpiry(item.fields.expiryMonth, item.fields.expiryYear),
          sensitive: false,
        });
        continue;
      }
      
      displayFields.push({
        key: fieldDef.key,
        label: fieldDef.label,
        value,
        sensitive: fieldDef.sensitive || SENSITIVE_FIELDS.has(fieldDef.key),
      });
    }
  }

  // Add custom fields to display
  const customFieldsDisplay = item.customFields || [];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
        {/* Gradient Header */}
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
            <TouchableOpacity
              style={styles.navButton}
              onPress={handleEdit}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Icon and title */}
          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={category.icon as any}
                size={36}
                color="rgba(255, 255, 255, 0.95)"
              />
            </View>
            <ThemedText variant="title" style={styles.headerTitle}>
              {item.label}
            </ThemedText>
            <View style={styles.typeBadge}>
              <ThemedText variant="caption" style={styles.typeBadgeText}>
                {category.label}
              </ThemedText>
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.content}>
          {/* Fields */}
          <View style={[styles.fieldsCard, { backgroundColor: colors.card }, shadows.md]}>
            <ThemedText variant="label" color="secondary" style={styles.sectionTitle}>
              Details
            </ThemedText>
            
            {displayFields.map(field => (
              <SecureField
                key={field.key}
                label={field.label}
                value={field.value}
                sensitive={field.sensitive}
                copyable
              />
            ))}
          </View>

          {/* Custom Fields */}
          {customFieldsDisplay.length > 0 && (
            <View style={[styles.fieldsCard, { backgroundColor: colors.card }, shadows.md]}>
              <ThemedText variant="label" color="secondary" style={styles.sectionTitle}>
                Custom Fields
              </ThemedText>
              
              {customFieldsDisplay.map(field => (
                <SecureField
                  key={field.id}
                  label={field.label}
                  value={field.value}
                  sensitive={false}
                  copyable
                />
              ))}
            </View>
          )}

          {/* Assets (Images, PDFs, Documents) */}
          {itemAssets.length > 0 && (
            <View style={[styles.imagesCard, { backgroundColor: colors.card }, shadows.md]}>
              <ThemedText variant="label" color="secondary" style={styles.sectionTitle}>
                Attachments ({itemAssets.length})
              </ThemedText>
              <ThemedText variant="caption" color="tertiary" style={styles.imageHint}>
                Tap an attachment to preview or share
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imagesContainer}
              >
                {itemAssets.map((asset) => (
                  <TouchableOpacity
                    key={asset.id}
                    style={[styles.imageThumb, { borderColor: colors.border }]}
                    onPress={() => setSelectedAsset(asset)}
                    activeOpacity={0.8}
                  >
                    {asset.type === 'image' ? (
                      <Image source={{ uri: asset.uri }} style={styles.imageThumbInner} />
                    ) : (
                      <View style={[styles.docThumbInner, { backgroundColor: colors.backgroundTertiary }]}>
                        <Ionicons name={getAssetIcon(asset.type)} size={28} color={colors.primary} />
                        <ThemedText variant="caption" numberOfLines={1} style={styles.docThumbName}>
                          {asset.originalFilename}
                        </ThemedText>
                      </View>
                    )}
                    <View style={styles.imageDimensions}>
                      <ThemedText variant="caption" style={styles.imageDimensionsText}>
                        {asset.type === 'image' 
                          ? `${asset.width}×${asset.height}`
                          : formatFileSize(asset.size)
                        }
                      </ThemedText>
                    </View>
                    {/* Type badge */}
                    <View style={[styles.typeBadge, { backgroundColor: colors.accent }]}>
                      <Ionicons name={getAssetIcon(asset.type)} size={10} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Metadata */}
          <View style={[styles.metaCard]}>
            <View style={styles.metaRow}>
              <ThemedText variant="caption" color="tertiary">Created</ThemedText>
              <ThemedText variant="caption" color="secondary">
                {formatDate(item.createdAt)}
              </ThemedText>
            </View>
            <View style={styles.metaRow}>
              <ThemedText variant="caption" color="tertiary">Last Updated</ThemedText>
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
                <View style={[styles.previewInfoPanel, { backgroundColor: colors.backgroundSecondary }]}>
                  <ThemedText variant="body" numberOfLines={1}>
                    {selectedAsset.originalFilename}
                  </ThemedText>
                  <ThemedText variant="caption" color="secondary">
                    {selectedAsset.type === 'image' 
                      ? `${selectedAsset.width}×${selectedAsset.height} • ${formatFileSize(selectedAsset.size)}`
                      : formatFileSize(selectedAsset.size)
                    }
                  </ThemedText>
                </View>

                {/* Action button */}
                <TouchableOpacity
                  style={[styles.shareButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleShareAsset(selectedAsset)}
                >
                  <Ionicons name="share-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Close button */}
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.backgroundSecondary }]}
                  onPress={() => setSelectedAsset(null)}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    marginTop: -spacing.lg,
    flex: 1,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.sm,
  },
  fieldsCard: {
    padding: spacing.base,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  imagesCard: {
    padding: spacing.base,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  imageHint: {
    marginBottom: spacing.md,
  },
  imagesContainer: {
    paddingVertical: spacing.xs,
  },
  imageThumb: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
    marginRight: spacing.sm,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  imageThumbInner: {
    width: '100%',
    height: '100%',
  },
  imageDimensions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  imageDimensionsText: {
    color: '#FFFFFF',
    fontSize: 10,
    textAlign: 'center',
  },
  docThumbInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  docThumbName: {
    marginTop: spacing.xs,
    textAlign: 'center',
    fontSize: 9,
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
