/**
 * ImagePicker component for capturing and selecting images for vault items
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Pressable,
  Dimensions,
  ScrollView,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeProvider';
import { ThemedText } from './ThemedText';
import { spacing, borderRadius } from '../styles/theme';
import { saveImage, deleteImage } from '../storage/imageStorage';
import type { ImageAttachment } from '../utils/types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ImagePickerProps {
  images: ImageAttachment[];
  onImagesChange: (images: ImageAttachment[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function ImagePicker({
  images,
  onImagesChange,
  maxImages,
  disabled = false,
}: ImagePickerProps) {
  const { colors, isDark } = useTheme();
  const [previewImage, setPreviewImage] = useState<ImageAttachment | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        const asset = result.assets[0];
        const savedImage = await saveImage(
          asset.uri,
          asset.width,
          asset.height
        );

        if (savedImage) {
          onImagesChange([...images, savedImage]);
        } else {
          Alert.alert('Error', 'Failed to save image. Please try again.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [disabled, images, onImagesChange]);

  const showImageSourcePicker = useCallback(() => {
    if (disabled) return;
    if (maxImages && images.length >= maxImages) {
      Alert.alert('Limit Reached', `You can only add up to ${maxImages} images.`);
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handlePickImage('camera');
          } else if (buttonIndex === 2) {
            handlePickImage('library');
          }
        }
      );
    } else {
      Alert.alert(
        'Add Image',
        'Choose an option',
        [
          { text: 'Take Photo', onPress: () => handlePickImage('camera') },
          { text: 'Choose from Library', onPress: () => handlePickImage('library') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  }, [disabled, maxImages, images.length, handlePickImage]);

  const handleRemoveImage = useCallback((image: ImageAttachment) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteImage(image.id, image.filename);
            onImagesChange(images.filter((img) => img.id !== image.id));
            setPreviewImage(null);
          },
        },
      ]
    );
  }, [images, onImagesChange]);

  const renderImageThumbnail = (image: ImageAttachment, index: number) => (
    <TouchableOpacity
      key={image.id}
      style={[styles.thumbnailContainer, { borderColor: colors.border }]}
      onPress={() => setPreviewImage(image)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: image.uri }} style={styles.thumbnail} />
      {!disabled && (
        <TouchableOpacity
          style={[styles.removeButton, { backgroundColor: colors.error }]}
          onPress={() => handleRemoveImage(image)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={14} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderAddButton = () => {
    if (maxImages && images.length >= maxImages) return null;

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
        onPress={showImageSourcePicker}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isLoading ? 'hourglass-outline' : 'camera-outline'}
          size={28}
          color={colors.textSecondary}
        />
        <ThemedText variant="caption" color="secondary" style={styles.addButtonText}>
          {isLoading ? 'Saving...' : 'Add Image'}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ThemedText variant="label" style={styles.label}>
        Images {maxImages ? `(${images.length}/${maxImages})` : `(${images.length})`}
      </ThemedText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.imagesContainer}
      >
        {images.map(renderImageThumbnail)}
        {renderAddButton()}
      </ScrollView>

      {/* Full-screen preview modal */}
      <Modal
        visible={previewImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
        statusBarTranslucent={false}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.9)' }]}
          onPress={() => setPreviewImage(null)}
        >
          <View style={styles.modalContent}>
            {previewImage && (
              <>
                <Image
                  source={{ uri: previewImage.uri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
                <View style={styles.previewInfo}>
                  <ThemedText variant="caption" style={styles.previewInfoText}>
                    {previewImage.width} × {previewImage.height}
                  </ThemedText>
                </View>
              </>
            )}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => setPreviewImage(null)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            {!disabled && previewImage && (
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: colors.error }]}
                onPress={() => handleRemoveImage(previewImage)}
              >
                <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
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
  imagesContainer: {
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
});

export default ImagePicker;

