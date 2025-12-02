/**
 * ImageResizer component for resizing images with custom dimensions
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Switch,
  Image,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '../context/ThemeProvider';
import { ThemedText } from './ThemedText';
import { spacing, borderRadius } from '../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

interface ImageResizerProps {
  originalWidth: number;
  originalHeight: number;
  imageUri: string;
  onDimensionsChange: (width: number, height: number, quality: number) => void;
}

export function ImageResizer({
  originalWidth,
  originalHeight,
  imageUri,
  onDimensionsChange,
}: ImageResizerProps) {
  const { colors } = useTheme();
  
  const [width, setWidth] = useState(originalWidth.toString());
  const [height, setHeight] = useState(originalHeight.toString());
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [quality, setQuality] = useState(80);
  
  const aspectRatio = originalWidth / originalHeight;

  // Update dimensions when originals change
  useEffect(() => {
    setWidth(originalWidth.toString());
    setHeight(originalHeight.toString());
  }, [originalWidth, originalHeight]);

  // Notify parent of dimension changes
  useEffect(() => {
    const w = parseInt(width) || 0;
    const h = parseInt(height) || 0;
    onDimensionsChange(w, h, quality / 100);
  }, [width, height, quality, onDimensionsChange]);

  const handleWidthChange = useCallback((value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    setWidth(numericValue);

    if (maintainAspectRatio && numericValue) {
      const newWidth = parseInt(numericValue);
      const newHeight = Math.round(newWidth / aspectRatio);
      setHeight(newHeight.toString());
    }
  }, [maintainAspectRatio, aspectRatio]);

  const handleHeightChange = useCallback((value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    setHeight(numericValue);

    if (maintainAspectRatio && numericValue) {
      const newHeight = parseInt(numericValue);
      const newWidth = Math.round(newHeight * aspectRatio);
      setWidth(newWidth.toString());
    }
  }, [maintainAspectRatio, aspectRatio]);

  const handleAspectRatioToggle = useCallback((value: boolean) => {
    setMaintainAspectRatio(value);
    if (value && width) {
      // Recalculate height based on current width
      const currentWidth = parseInt(width);
      const newHeight = Math.round(currentWidth / aspectRatio);
      setHeight(newHeight.toString());
    }
  }, [width, aspectRatio]);

  const calculateOutputSize = (): string => {
    const w = parseInt(width) || 0;
    const h = parseInt(height) || 0;
    // Rough estimate: ~3 bytes per pixel for JPEG at given quality
    const bytesPerPixel = 0.5 + (quality / 100) * 2;
    const estimatedBytes = w * h * bytesPerPixel;
    
    if (estimatedBytes < 1024) {
      return `~${Math.round(estimatedBytes)} B`;
    } else if (estimatedBytes < 1024 * 1024) {
      return `~${(estimatedBytes / 1024).toFixed(1)} KB`;
    } else {
      return `~${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  // Calculate preview dimensions to fit screen
  const previewMaxWidth = screenWidth - spacing.xl * 4;
  const previewMaxHeight = 200;
  let previewWidth = parseInt(width) || originalWidth;
  let previewHeight = parseInt(height) || originalHeight;
  
  if (previewWidth > previewMaxWidth) {
    const scale = previewMaxWidth / previewWidth;
    previewWidth = previewMaxWidth;
    previewHeight = previewHeight * scale;
  }
  if (previewHeight > previewMaxHeight) {
    const scale = previewMaxHeight / previewHeight;
    previewHeight = previewMaxHeight;
    previewWidth = previewWidth * scale;
  }

  return (
    <View style={styles.container}>
      {/* Image preview */}
      <View style={[styles.previewContainer, { backgroundColor: colors.backgroundTertiary }]}>
        <Image
          source={{ uri: imageUri }}
          style={[styles.preview, { width: previewWidth, height: previewHeight }]}
          resizeMode="contain"
        />
      </View>

      {/* Original dimensions info */}
      <View style={[styles.infoRow, { backgroundColor: colors.backgroundTertiary }]}>
        <ThemedText variant="caption" color="secondary">
          Original: {originalWidth} × {originalHeight}
        </ThemedText>
        <ThemedText variant="caption" color="secondary">
          Output: {width || 0} × {height || 0}
        </ThemedText>
      </View>

      {/* Dimension inputs */}
      <View style={styles.dimensionRow}>
        <View style={styles.dimensionInput}>
          <ThemedText variant="caption" color="secondary" style={styles.inputLabel}>
            Width (px)
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.inputText,
              },
            ]}
            value={width}
            onChangeText={handleWidthChange}
            keyboardType="numeric"
            placeholder="Width"
            placeholderTextColor={colors.placeholder}
            selectTextOnFocus
          />
        </View>

        <View style={styles.dimensionSeparator}>
          <ThemedText variant="body" color="secondary">×</ThemedText>
        </View>

        <View style={styles.dimensionInput}>
          <ThemedText variant="caption" color="secondary" style={styles.inputLabel}>
            Height (px)
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.inputText,
              },
            ]}
            value={height}
            onChangeText={handleHeightChange}
            keyboardType="numeric"
            placeholder="Height"
            placeholderTextColor={colors.placeholder}
            selectTextOnFocus
          />
        </View>
      </View>

      {/* Aspect ratio toggle */}
      <View style={[styles.toggleRow, { borderColor: colors.border }]}>
        <ThemedText variant="body">Maintain aspect ratio</ThemedText>
        <Switch
          value={maintainAspectRatio}
          onValueChange={handleAspectRatioToggle}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={maintainAspectRatio ? colors.primary : colors.textTertiary}
        />
      </View>

      {/* Quality slider */}
      <View style={styles.qualityContainer}>
        <View style={styles.qualityHeader}>
          <ThemedText variant="body">Quality</ThemedText>
          <ThemedText variant="body" color="accent">{quality}%</ThemedText>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={10}
          maximumValue={100}
          step={5}
          value={quality}
          onValueChange={setQuality}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
        />
        <View style={styles.qualityLabels}>
          <ThemedText variant="caption" color="secondary">Smaller file</ThemedText>
          <ThemedText variant="caption" color="secondary">Better quality</ThemedText>
        </View>
      </View>

      {/* Estimated output size */}
      <View style={[styles.estimateRow, { backgroundColor: colors.backgroundTertiary }]}>
        <ThemedText variant="caption" color="secondary">
          Estimated file size: {calculateOutputSize()}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    minHeight: 150,
  },
  preview: {
    borderRadius: borderRadius.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  dimensionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  dimensionInput: {
    flex: 1,
  },
  inputLabel: {
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    textAlign: 'center',
  },
  dimensionSeparator: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  qualityContainer: {
    marginBottom: spacing.md,
  },
  qualityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  qualityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  estimateRow: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
});

export default ImageResizer;

