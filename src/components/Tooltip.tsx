/**
 * Tooltip component for displaying contextual information
 * Shows a tooltip that dismisses when tapping outside
 */

import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeProvider';
import { borderRadius, shadows, spacing } from '../styles/theme';
import { ThemedText } from './ThemedText';

interface TooltipProps {
  visible: boolean;
  text: string;
  onDismiss: () => void;
  targetRef?: React.RefObject<View>;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({
  visible,
  text,
  onDismiss,
  targetRef,
  position = 'bottom',
}: TooltipProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent={false}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <View
          style={[
            styles.container,
            position === 'top' && { justifyContent: 'flex-start', paddingTop: insets.top + 80 },
            position === 'bottom' && { justifyContent: 'flex-end', paddingBottom: spacing.xl },
            position === 'left' && { justifyContent: 'center', alignItems: 'flex-start', paddingLeft: spacing.base },
            position === 'right' && { justifyContent: 'center', alignItems: 'flex-end', paddingRight: spacing.base },
          ]}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.tooltip,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                ...shadows.lg,
              },
            ]}
          >
            <ThemedText variant="caption" style={styles.tooltipText}>
              {text}
            </ThemedText>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
  },
  tooltip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    maxWidth: 200,
  },
  tooltipText: {
    textAlign: 'center',
  },
});

