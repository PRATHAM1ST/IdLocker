/**
 * Vault header component with title and action buttons
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeProvider';
import { borderRadius, spacing } from '../styles/theme';
import { ThemedText } from './ThemedText';

interface VaultHeaderProps {
  onAssetsPress: () => void;
  onSettingsPress: () => void;
  isSelectionMode?: boolean;
  selectedCount?: number;
  onDelete?: () => void;
  onCancelSelection?: () => void;
}

export function VaultHeader({
  onAssetsPress,
  onSettingsPress,
  isSelectionMode = false,
  selectedCount = 0,
  onDelete,
  onCancelSelection,
}: VaultHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <LinearGradient
      colors={[colors.headerGradientStart, colors.headerGradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + spacing.md }]}
    >
      <View style={styles.headerContent}>
        {isSelectionMode ? (
          <>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onCancelSelection}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <ThemedText variant="title" style={styles.headerTitle}>
              {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
            </ThemedText>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onDelete}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ThemedText variant="title" style={styles.headerTitle}>
              IdLocker
            </ThemedText>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={onAssetsPress}
                activeOpacity={0.7}
              >
                <Ionicons name="folder-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={onSettingsPress}
                activeOpacity={0.7}
              >
                <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.base,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

