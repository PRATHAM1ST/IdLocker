/**
 * Illustrated Header component with gradient background and decorative elements
 * Scrollable design - scrolls with content
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Defs, RadialGradient, Stop, G } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeProvider';
import { ThemedText } from './ThemedText';
import { spacing, borderRadius } from '../styles/theme';

interface IllustratedHeaderProps {
  title?: string;
  subtitle?: string;
  onSearchPress?: () => void;
  rightAction?: React.ReactNode;
}

/**
 * Vault Shield Illustration - Security themed SVG
 */
function VaultIllustration() {
  return (
    <Svg width={160} height={140} viewBox="0 0 200 180">
      <Defs>
        <RadialGradient id="shieldGrad" cx="50%" cy="30%" r="70%">
          <Stop offset="0%" stopColor="#52B788" stopOpacity="1" />
          <Stop offset="100%" stopColor="#2D6A4F" stopOpacity="1" />
        </RadialGradient>
        <RadialGradient id="innerGrad" cx="50%" cy="40%" r="50%">
          <Stop offset="0%" stopColor="#40916C" stopOpacity="1" />
          <Stop offset="100%" stopColor="#1B4332" stopOpacity="1" />
        </RadialGradient>
      </Defs>

      {/* Background leaves/decorative elements */}
      <G opacity="0.3">
        <Path
          d="M30 140 Q50 100, 40 60 Q60 80, 70 50"
          stroke="#74C69D"
          strokeWidth="3"
          fill="none"
        />
        <Circle cx="40" cy="55" r="8" fill="#74C69D" />
        <Path
          d="M160 130 Q150 100, 165 70 Q145 85, 140 55"
          stroke="#74C69D"
          strokeWidth="3"
          fill="none"
        />
        <Circle cx="165" cy="65" r="6" fill="#74C69D" />
      </G>

      {/* Main shield */}
      <Path
        d="M100 25 L155 45 L155 95 Q155 140, 100 165 Q45 140, 45 95 L45 45 Z"
        fill="url(#shieldGrad)"
      />

      {/* Inner shield */}
      <Path
        d="M100 40 L140 55 L140 90 Q140 125, 100 145 Q60 125, 60 90 L60 55 Z"
        fill="url(#innerGrad)"
      />

      {/* Lock icon in center */}
      <G transform="translate(80, 70)">
        <Path
          d="M10 18 L10 12 Q10 2, 20 2 Q30 2, 30 12 L30 18"
          stroke="#F1F5F9"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <Path d="M5 18 L35 18 L35 38 Q35 42, 31 42 L9 42 Q5 42, 5 38 Z" fill="#F1F5F9" />
        <Circle cx="20" cy="28" r="4" fill="#1B4332" />
        <Path d="M20 30 L20 36" stroke="#1B4332" strokeWidth="3" strokeLinecap="round" />
      </G>

      {/* Decorative circles */}
      <Circle cx="25" cy="100" r="5" fill="#74C69D" opacity="0.4" />
      <Circle cx="175" cy="90" r="4" fill="#74C69D" opacity="0.4" />
      <Circle cx="170" cy="150" r="6" fill="#52B788" opacity="0.3" />
      <Circle cx="35" cy="160" r="4" fill="#52B788" opacity="0.3" />
    </Svg>
  );
}

export function IllustratedHeader({
  title,
  subtitle,
  onSearchPress,
  rightAction,
}: IllustratedHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[colors.headerGradientStart, colors.headerGradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, { paddingTop: insets.top + spacing.md }]}
    >
      {/* Decorative background circles */}
      <View style={styles.decorativeCircles}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
      </View>

      {/* Top bar with search and action */}
      <View style={styles.topBar}>
        {onSearchPress ? (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
            onPress={onSearchPress}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconButton} />
        )}

        {rightAction || <View style={styles.iconButton} />}
      </View>

      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        <VaultIllustration />
      </View>

      {/* Title and subtitle */}
      {(title || subtitle) && (
        <View style={styles.textContainer}>
          {title && (
            <ThemedText variant="title" style={styles.title}>
              {title}
            </ThemedText>
          )}
          {subtitle && (
            <ThemedText variant="body" style={styles.subtitle}>
              {subtitle}
            </ThemedText>
          )}
        </View>
      )}
    </LinearGradient>
  );
}

/**
 * Simple gradient header for inner screens
 */
interface SimpleHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

export function SimpleHeader({ title, subtitle, icon, iconColor }: SimpleHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[colors.headerGradientStart, colors.headerGradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.simpleGradient, { paddingTop: insets.top + spacing.md }]}
    >
      <View style={styles.simpleContent}>
        {icon && (
          <View
            style={[
              styles.simpleIconContainer,
              { backgroundColor: iconColor || 'rgba(255,255,255,0.2)' },
            ]}
          >
            <Ionicons name={icon} size={24} color="#FFFFFF" />
          </View>
        )}
        {title && (
          <ThemedText variant="title" style={styles.simpleTitle}>
            {title}
          </ThemedText>
        )}
        {subtitle && (
          <ThemedText variant="body" style={styles.simpleSubtitle}>
            {subtitle}
          </ThemedText>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  decorativeCircles: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  circle1: {
    width: 180,
    height: 180,
    top: -40,
    right: -20,
  },
  circle2: {
    width: 120,
    height: 120,
    bottom: -30,
    left: -40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  textContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  // Simple header styles
  simpleGradient: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.base,
  },
  simpleContent: {
    alignItems: 'center',
  },
  simpleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  simpleTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  simpleSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
