/**
 * Reusable page header component with gradient background
 * Used across settings, categories, assets, and other inner screens
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeProvider';
import type { SaveStatus } from '../hooks/useAutoSave';
import { borderRadius, spacing } from '../styles/theme';
import { ThemedText } from './ThemedText';
import { Tooltip } from './Tooltip';

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
  const [showTooltip, setShowTooltip] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handleBack = onBack || (() => router.back());
  const gradientStart = gradientColors?.[0] || colors.headerGradientStart;
  const gradientEnd = gradientColors?.[1] || colors.headerGradientEnd;

  // Animate sync icon rotation when saving
  useEffect(() => {
    if (saveStatus === 'saving') {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [saveStatus, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Determine save status icon and tooltip text
  const getSaveStatusInfo = () => {
    if (!saveStatus || saveStatus === 'idle') return null;

    switch (saveStatus) {
      case 'saving':
        return {
          icon: 'sync-outline' as const,
          text: 'Saving...',
          color: 'rgba(255, 255, 255, 0.9)',
          showSpinner: true,
        };
      case 'saved':
        return {
          icon: 'checkmark-circle' as const,
          text: 'Saved',
          color: '#fff',
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

  const saveStatusInfo = getSaveStatusInfo();

  const handleSaveStatusPress = () => {
    if (saveStatusInfo) {
      setShowTooltip(true);
    }
  };

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
        </View>

        <View style={styles.rightActions}>
          {rightActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionButton}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <Ionicons name={action.icon} size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ))}
          {saveStatusInfo && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSaveStatusPress}
              activeOpacity={0.7}
            >
              {saveStatusInfo.showSpinner ? (
                <Animated.View style={{ transform: [{ rotate }] }}>
                  <Ionicons
                    name={saveStatusInfo.icon}
                    size={24}
                    color={saveStatusInfo.color}
                  />
                </Animated.View>
              ) : (
                <Ionicons
                  name={saveStatusInfo.icon}
                  size={24}
                  color={saveStatusInfo.color}
                />
              )}
            </TouchableOpacity>
          )}
          {!saveStatusInfo && rightActions.length === 0 && (
            <View style={{ width: 40 }} />
          )}
        </View>
      </View>

      <Tooltip
        visible={showTooltip}
        text={saveStatusInfo?.text || ''}
        onDismiss={() => setShowTooltip(false)}
        position="top"
      />
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

