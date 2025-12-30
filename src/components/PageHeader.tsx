/**
 * Reusable page header component with gradient background
 * Used across settings, categories, assets, and other inner screens
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeProvider';
import type { SaveStatus } from '../hooks/useAutoSave';
import { borderRadius, spacing } from '../styles/theme';
import { ThemedText } from './ThemedText';

interface PageHeaderAction {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightActions?: PageHeaderAction[];
  variant?: 'subtitle' | 'title';
  gradientColors?: [string, string]; // Custom gradient colors [start, end]
  saveStatus?: SaveStatus;
}

export function PageHeader({
  title,
  subtitle,
  onBack,
  rightActions = [],
  variant = 'subtitle',
  gradientColors,
  saveStatus,
}: PageHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const handleBack = onBack || (() => router.back());
  const gradientStart = gradientColors?.[0] || colors.headerGradientStart;
  const gradientEnd = gradientColors?.[1] || colors.headerGradientEnd;

  // Determine save status display
  const getSaveStatusDisplay = () => {
    if (!saveStatus || saveStatus === 'idle') return null;

    switch (saveStatus) {
      case 'saving':
        return {
          icon: null,
          text: 'Saving...',
          color: 'rgba(255, 255, 255, 0.9)',
          showSpinner: true,
        };
      case 'saved':
        return {
          icon: 'checkmark-circle' as const,
          text: 'Saved',
          color: '#4CAF50',
          showSpinner: false,
        };
      case 'error':
        return {
          icon: 'alert-circle' as const,
          text: 'Error saving',
          color: '#F44336',
          showSpinner: false,
        };
      default:
        return null;
    }
  };

  const saveStatusDisplay = getSaveStatusDisplay();

  return (
    <LinearGradient
      colors={[gradientStart, gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + spacing.md }]}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <ThemedText
            variant={variant}
            style={styles.headerTitle}
          >
            {title}
          </ThemedText>
          {subtitle && (
            <ThemedText variant="caption" style={styles.headerSubtitle}>
              {subtitle}
            </ThemedText>
          )}
          {saveStatusDisplay && (
            <View style={styles.saveStatusContainer}>
              {saveStatusDisplay.showSpinner ? (
                <ActivityIndicator size="small" color={saveStatusDisplay.color} />
              ) : saveStatusDisplay.icon ? (
                <Ionicons
                  name={saveStatusDisplay.icon}
                  size={14}
                  color={saveStatusDisplay.color}
                />
              ) : null}
              <ThemedText
                variant="caption"
                style={[styles.saveStatusText, { color: saveStatusDisplay.color }]}
              >
                {saveStatusDisplay.text}
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.rightActions}>
          {rightActions.length > 0 ? (
            rightActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionButton}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <Ionicons name={action.icon} size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  saveStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  saveStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  rightActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

