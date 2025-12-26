/**
 * Reusable page header component with gradient background
 * Used across settings, categories, assets, and other inner screens
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeProvider';
import { ThemedText } from './ThemedText';
import { spacing, borderRadius } from '../styles/theme';

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
}

export function PageHeader({
  title,
  subtitle,
  onBack,
  rightActions = [],
  variant = 'subtitle',
  gradientColors,
}: PageHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const handleBack = onBack || (() => router.back());
  const gradientStart = gradientColors?.[0] || colors.headerGradientStart;
  const gradientEnd = gradientColors?.[1] || colors.headerGradientEnd;

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

