/**
 * AssetPicker component for selecting and uploading assets (images, PDFs, documents)
 * Supports linking existing assets or uploading new ones
 * Uses centralized asset storage with deduplication
 */

import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ExpoImagePicker from 'expo-image-picker';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActionSheetIOS,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAssets } from '../context/AssetProvider';
import { useTheme } from '../context/ThemeProvider';
import { formatFileSize } from '../storage/assetStorage';
import { borderRadius, spacing } from '../styles/theme';
import type { Asset, AssetReference, AssetType } from '../utils/types';
import { ThemedText } from './ThemedText';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AssetPickerProps {
  assetRefs: AssetReference[];
  onAssetRefsChange: (refs: AssetReference[]) => void;
  maxAssets?: number;
  disabled?: boolean;
  allowedTypes?: AssetType[];
}

export function AssetPicker({
  assetRefs,
  onAssetRefsChange,
  maxAssets,
  disabled = false,
  allowedTypes = ['image', 'pdf', 'document'],
}: AssetPickerProps) {
  const { colors } = useTheme();
  const { 
    assets, 
    getAssetsByIds, 
    saveImageAsset, 
    saveDocumentAsset,
  } = useAssets();
  
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAssetBrowser, setShowAssetBrowser] = useState(false);

  // Get currently linked assets - memoized to prevent re-renders
  const linkedAssetIds = useMemo(() => new Set(assetRefs.map(ref => ref.assetId)), [assetRefs]);
  const linkedAssets = getAssetsByIds(Array.from(linkedAssetIds));

  const requestPermissions = async (type: 'camera' | 'library'): Promise<boolean> => {
    if (type === 'camera') {
      const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera access in your device settings to capture photos.'
        );
        return false;
      }
    } else {
      const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Photo Library Permission Required',
          'Please grant photo library access in your device settings to select images.'
        );
        return false;
      }
    }
    return true;
  };

  const handlePickImage = useCallback(async (source: 'camera' | 'library') => {
    if (disabled) return;
    
    const hasPermission = await requestPermissions(source);
    if (!hasPermission) return;

    setIsLoading(true);

    try {
      const options: ExpoImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      };

      const result = source === 'camera'
        ? await ExpoImagePicker.launchCameraAsync(options)
        : await ExpoImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets[0]) {
        const imageAsset = result.assets[0];
        const originalFilename = imageAsset.fileName || `image_${Date.now()}.jpg`;
        
        const savedAsset = await saveImageAsset(
          imageAsset.uri,
          originalFilename,
          imageAsset.width,
          imageAsset.height
        );

        if (savedAsset) {
          // Add reference (deduplication handled by storage)
          const newRef: AssetReference = {
            assetId: savedAsset.id,
            addedAt: new Date().toISOString(),
          };
          
          // Check if already linked
          if (!linkedAssetIds.has(savedAsset.id)) {
            onAssetRefsChange([...assetRefs, newRef]);
          } else {
            Alert.alert('Already Added', 'This image is already attached to this item.');
          }
        } else {
          Alert.alert('Error', 'Failed to save image. Please try again.');
        }
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [disabled, assetRefs, onAssetRefsChange, saveImageAsset, linkedAssetIds]);

  const handlePickDocument = useCallback(async () => {
    if (disabled) return;

    setIsLoading(true);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const docAsset = result.assets[0];
        
        const savedAsset = await saveDocumentAsset(
          docAsset.uri,
          docAsset.name,
          docAsset.mimeType || 'application/octet-stream'
        );

        if (savedAsset) {
          const newRef: AssetReference = {
            assetId: savedAsset.id,
            addedAt: new Date().toISOString(),
          };
          
          if (!linkedAssetIds.has(savedAsset.id)) {
            onAssetRefsChange([...assetRefs, newRef]);
          } else {
            Alert.alert('Already Added', 'This document is already attached to this item.');
          }
        } else {
          Alert.alert('Error', 'Failed to save document. Please try again.');
        }
      }
    } catch {
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [disabled, assetRefs, onAssetRefsChange, saveDocumentAsset, linkedAssetIds]);

  const showAddOptions = useCallback(() => {
    if (disabled) return;
    if (maxAssets && assetRefs.length >= maxAssets) {
      Alert.alert('Limit Reached', `You can only add up to ${maxAssets} attachments.`);
      return;
    }

    const options = ['Cancel'];
    const actions: (() => void)[] = [];

    if (allowedTypes.includes('image')) {
      options.push('Take Photo', 'Choose from Library');
      actions.push(
        () => handlePickImage('camera'),
        () => handlePickImage('library')
      );
    }

    if (allowedTypes.includes('pdf') || allowedTypes.includes('document')) {
      options.push('Choose Document');
      actions.push(() => handlePickDocument());
    }

    options.push('Browse Existing');
    actions.push(() => setShowAssetBrowser(true));

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex > 0 && buttonIndex <= actions.length) {
            actions[buttonIndex - 1]();
          }
        }
      );
    } else {
      Alert.alert(
        'Add Attachment',
        'Choose an option',
        [
          ...actions.map((action, index) => ({
            text: options[index + 1],
            onPress: action,
          })),
          { text: 'Cancel', style: 'cancel' as const },
        ]
      );
    }
  }, [disabled, maxAssets, assetRefs.length, allowedTypes, handlePickImage, handlePickDocument]);

  const handleRemoveAsset = useCallback((asset: Asset) => {
    Alert.alert(
      'Remove Attachment',
      'Remove this attachment from the item? The file will remain in your assets.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            onAssetRefsChange(assetRefs.filter(ref => ref.assetId !== asset.id));
            setPreviewAsset(null);
          },
        },
      ]
    );
  }, [assetRefs, onAssetRefsChange]);

  const handleLinkExistingAsset = useCallback((asset: Asset) => {
    if (linkedAssetIds.has(asset.id)) {
      Alert.alert('Already Added', 'This file is already attached to this item.');
      return;
    }

    if (maxAssets && assetRefs.length >= maxAssets) {
      Alert.alert('Limit Reached', `You can only add up to ${maxAssets} attachments.`);
      return;
    }

    const newRef: AssetReference = {
      assetId: asset.id,
      addedAt: new Date().toISOString(),
    };
    
    onAssetRefsChange([...assetRefs, newRef]);
    setShowAssetBrowser(false);
  }, [linkedAssetIds, maxAssets, assetRefs, onAssetRefsChange]);

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

  const renderAssetThumbnail = (asset: Asset, index: number) => (
    <TouchableOpacity
      key={asset.id}
      style={[styles.thumbnailContainer, { borderColor: colors.border }]}
      onPress={() => setPreviewAsset(asset)}
      activeOpacity={0.8}
    >
      {asset.type === 'image' ? (
        <Image source={{ uri: asset.uri }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.documentThumbnail, { backgroundColor: colors.backgroundTertiary }]}>
          <Ionicons name={getAssetIcon(asset.type)} size={32} color={colors.primary} />
          <ThemedText variant="caption" numberOfLines={1} style={styles.docName}>
            {asset.originalFilename}
          </ThemedText>
        </View>
      )}
      {!disabled && (
        <TouchableOpacity
          style={[styles.removeButton, { backgroundColor: colors.error }]}
          onPress={() => handleRemoveAsset(asset)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={14} color="#FFFFFF" />
        </TouchableOpacity>
      )}
      <View style={[styles.typeBadge, { backgroundColor: colors.primary }]}>
        <Ionicons name={getAssetIcon(asset.type)} size={10} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );

  const renderAddButton = () => {
    if (maxAssets && assetRefs.length >= maxAssets) return null;

    return (
      <TouchableOpacity
        style={[
          styles.addButton,
          {
            borderColor: colors.border,
            backgroundColor: colors.inputBackground,
          },
          isLoading && styles.addButtonLoading,
        ]}
        onPress={showAddOptions}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isLoading ? 'hourglass-outline' : 'add-outline'}
          size={28}
          color={colors.textSecondary}
        />
        <ThemedText variant="caption" color="secondary" style={styles.addButtonText}>
          {isLoading ? 'Adding...' : 'Add'}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  // Filter available assets for browser
  const availableAssets = assets.filter(
    a => allowedTypes.includes(a.type) && !linkedAssetIds.has(a.id)
  );

  const renderBrowserItem = ({ item }: { item: Asset }) => (
    <TouchableOpacity
      style={[styles.browserItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleLinkExistingAsset(item)}
      activeOpacity={0.7}
    >
      {item.type === 'image' ? (
        <Image source={{ uri: item.uri }} style={styles.browserItemImage} />
      ) : (
        <View style={[styles.browserItemIcon, { backgroundColor: colors.backgroundTertiary }]}>
          <Ionicons name={getAssetIcon(item.type)} size={24} color={colors.primary} />
        </View>
      )}
      <View style={styles.browserItemInfo}>
        <ThemedText variant="body" numberOfLines={1}>
          {item.originalFilename}
        </ThemedText>
        <ThemedText variant="caption" color="secondary">
          {formatFileSize(item.size)} • {item.type.toUpperCase()}
        </ThemedText>
      </View>
      <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ThemedText variant="label" style={styles.label}>
        Attachments {maxAssets ? `(${assetRefs.length}/${maxAssets})` : `(${assetRefs.length})`}
      </ThemedText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.assetsContainer}
      >
        {linkedAssets.map(renderAssetThumbnail)}
        {renderAddButton()}
      </ScrollView>

      {/* Full-screen preview modal */}
      <Modal
        visible={previewAsset !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewAsset(null)}
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
                    <ThemedText variant="caption" style={styles.previewDocInfo}>
                      {formatFileSize(previewAsset.size)} • {previewAsset.mimeType}
                    </ThemedText>
                  </View>
                )}
                <View style={styles.previewInfo}>
                  <ThemedText variant="caption" style={styles.previewInfoText}>
                    {previewAsset.type === 'image' 
                      ? `${previewAsset.width} × ${previewAsset.height}`
                      : formatFileSize(previewAsset.size)
                    }
                  </ThemedText>
                </View>
              </>
            )}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => setPreviewAsset(null)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            {!disabled && previewAsset && (
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: colors.error }]}
                onPress={() => handleRemoveAsset(previewAsset)}
              >
                <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Asset browser modal */}
      <Modal
        visible={showAssetBrowser}
        animationType="slide"
        onRequestClose={() => setShowAssetBrowser(false)}
      >
        <View style={[styles.browserContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.browserHeader, { backgroundColor: colors.backgroundSecondary, borderBottomColor: colors.border }]}>
            <ThemedText variant="subtitle">Browse Assets</ThemedText>
            <TouchableOpacity onPress={() => setShowAssetBrowser(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {availableAssets.length === 0 ? (
            <View style={styles.emptyBrowser}>
              <Ionicons name="folder-open-outline" size={48} color={colors.textTertiary} />
              <ThemedText variant="body" color="secondary" style={styles.emptyText}>
                No available assets to link
              </ThemedText>
              <ThemedText variant="caption" color="tertiary" style={styles.emptyHint}>
                Upload new files using the add button
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={availableAssets}
              renderItem={renderBrowserItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.browserList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  label: {
    marginBottom: spacing.sm,
  },
  assetsContainer: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
  },
  thumbnailContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginRight: spacing.sm,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  documentThumbnail: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  docName: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonLoading: {
    opacity: 0.5,
  },
  addButtonText: {
    marginTop: spacing.xs,
    textAlign: 'center',
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
    height: screenHeight * 0.7,
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
  previewInfo: {
    position: 'absolute',
    bottom: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: borderRadius.md,
  },
  previewInfoText: {
    color: '#FFFFFF',
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
  deleteButton: {
    position: 'absolute',
    bottom: 60,
    right: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browserContainer: {
    flex: 1,
  },
  browserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  browserList: {
    padding: spacing.base,
  },
  browserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  browserItemImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
  },
  browserItemIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browserItemInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  emptyBrowser: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.md,
  },
  emptyHint: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

export default AssetPicker;
