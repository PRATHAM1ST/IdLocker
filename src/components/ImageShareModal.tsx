/**
 * ImageShareModal component for resizing and sharing/saving images
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeProvider';
import { ThemedText } from './ThemedText';
import { Button } from './Button';
import { ImageResizer } from './ImageResizer';
import { spacing, borderRadius } from '../styles/theme';
import { resizeImage, shareImage } from '../storage/imageStorage';
import type { ImageAttachment } from '../utils/types';

interface ImageShareModalProps {
  visible: boolean;
  image: ImageAttachment | null;
  onClose: () => void;
}

export function ImageShareModal({
  visible,
  image,
  onClose,
}: ImageShareModalProps) {
  const { colors } = useTheme();
  
  const [targetWidth, setTargetWidth] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);
  const [quality, setQuality] = useState(0.8);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState<'share' | 'save' | null>(null);

  const handleDimensionsChange = useCallback((width: number, height: number, q: number) => {
    setTargetWidth(width);
    setTargetHeight(height);
    setQuality(q);
  }, []);

  const handleShare = useCallback(async () => {
    if (!image || targetWidth <= 0 || targetHeight <= 0) {
      Alert.alert('Invalid Dimensions', 'Please enter valid width and height.');
      return;
    }

    setIsProcessing(true);
    setProcessingAction('share');

    try {
      // Resize the image
      const resized = await resizeImage(
        image.uri,
        targetWidth,
        targetHeight,
        quality
      );

      if (!resized) {
        Alert.alert('Error', 'Failed to resize image. Please try again.');
        return;
      }

      // Share the resized image
      const shared = await shareImage(resized.uri);
      
      if (!shared) {
        Alert.alert('Error', 'Failed to share image. Sharing may not be available on this device.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while processing the image.');
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  }, [image, targetWidth, targetHeight, quality]);

  const handleSaveOriginal = useCallback(async () => {
    if (!image) return;

    setIsProcessing(true);
    setProcessingAction('save');

    try {
      // Share the original image (this allows saving to gallery on most devices)
      const shared = await shareImage(image.uri);
      
      if (!shared) {
        Alert.alert('Error', 'Failed to save image. Sharing may not be available on this device.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while saving the image.');
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  }, [image]);

  const handleShareOriginal = useCallback(async () => {
    if (!image) return;

    setIsProcessing(true);
    setProcessingAction('share');

    try {
      const shared = await shareImage(image.uri);
      
      if (!shared) {
        Alert.alert('Error', 'Failed to share image. Sharing may not be available on this device.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while sharing the image.');
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  }, [image]);

  if (!image) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <ThemedText variant="subtitle">Resize & Share</ThemedText>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image Resizer */}
          <ImageResizer
            originalWidth={image.width}
            originalHeight={image.height}
            imageUri={image.uri}
            onDimensionsChange={handleDimensionsChange}
          />

          {/* Processing indicator */}
          {isProcessing && (
            <View style={[styles.processingOverlay, { backgroundColor: colors.backgroundSecondary }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText variant="body" style={styles.processingText}>
                {processingAction === 'share' ? 'Preparing to share...' : 'Saving...'}
              </ThemedText>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionsContainer}>
            <ThemedText variant="label" style={styles.sectionTitle}>
              Resized Image
            </ThemedText>
            <Button
              title="Share Resized Image"
              onPress={handleShare}
              icon="share-outline"
              fullWidth
              disabled={isProcessing || targetWidth <= 0 || targetHeight <= 0}
              loading={isProcessing && processingAction === 'share'}
            />
            <ThemedText variant="caption" color="secondary" style={styles.hint}>
              Resizes to {targetWidth} × {targetHeight} at {Math.round(quality * 100)}% quality
            </ThemedText>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <ThemedText variant="label" style={styles.sectionTitle}>
              Original Image
            </ThemedText>
            <View style={styles.buttonRow}>
              <Button
                title="Share Original"
                onPress={handleShareOriginal}
                icon="share-outline"
                variant="secondary"
                disabled={isProcessing}
                style={styles.halfButton}
              />
              <Button
                title="Save Original"
                onPress={handleSaveOriginal}
                icon="download-outline"
                variant="outline"
                disabled={isProcessing}
                style={styles.halfButton}
              />
            </View>
            <ThemedText variant="caption" color="secondary" style={styles.hint}>
              Original size: {image.width} × {image.height}
            </ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    width: 40,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  processingOverlay: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  processingText: {
    marginTop: spacing.md,
  },
  actionsContainer: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  hint: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    marginVertical: spacing.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfButton: {
    flex: 1,
  },
});

export default ImageShareModal;

