/**
 * Lock overlay with automatic authentication
 * Shows overlay and triggers auth popup automatically
 * Redesigned with modern styling
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { getBiometricTypeName, useAuthLock } from '../context/AuthLockProvider';
import { useTheme } from '../context/ThemeProvider';
import { borderRadius, spacing } from '../styles/theme';
import { ThemedText } from './ThemedText';

export function LockOverlay() {
  const { colors, isDark } = useTheme();
  const { isLocked, isAuthenticating, error, unlock, biometricType, hasBiometrics } = useAuthLock();

  // Auto-trigger authentication when locked
  useEffect(() => {
    if (isLocked && !isAuthenticating) {
      const timer = setTimeout(async () => {
        const success = await unlock();
        if (success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLocked, isAuthenticating, unlock]);

  const handleRetry = async () => {
    if (isAuthenticating) return;
    const success = await unlock();
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const getBiometricIcon = (): keyof typeof Ionicons.glyphMap => {
    if (!hasBiometrics) return 'key-outline';
    if (biometricType === 1) return 'finger-print';
    if (biometricType === 2) return Platform.OS === 'ios' ? 'scan-outline' : 'happy-outline';
    return 'finger-print';
  };

  const biometricName = getBiometricTypeName(biometricType);

  if (!isLocked) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={StyleSheet.absoluteFill}
    >
      {/* Background */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* iOS: Use native blur for extra effect */}
      {Platform.OS === 'ios' && (
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      )}

      {/* Decorative circles */}
      <View style={styles.decorativeCircles}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
      </View>

      {/* Content */}
      <TouchableOpacity
        style={styles.content}
        activeOpacity={0.9}
        onPress={handleRetry}
        disabled={isAuthenticating}
      >
        {/* Logo/Icon container */}
        <View style={styles.logoContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={48} color="#FFFFFF" />
          </View>
          <ThemedText variant="title" style={styles.appName}>
            IdLocker
          </ThemedText>
        </View>

        {/* Auth button */}
        <View style={styles.authContainer}>
          <View style={[styles.authButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <View style={styles.authIconContainer}>
              <Ionicons name={getBiometricIcon()} size={32} color="#FFFFFF" />
            </View>

            <ThemedText variant="subtitle" style={styles.authTitle}>
              {isAuthenticating ? 'Verifying...' : error ? 'Tap to Retry' : 'Unlock Vault'}
            </ThemedText>

            <ThemedText variant="caption" style={styles.authSubtitle}>
              {hasBiometrics ? `Use ${biometricName}` : 'Use device passcode'}
            </ThemedText>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <ThemedText variant="caption" style={styles.errorText}>
                {error}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText variant="caption" style={styles.footerText}>
            Your data is encrypted and secure
          </ThemedText>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  decorativeCircles: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  circle2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  circle3: {
    position: 'absolute',
    top: '40%',
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['3xl'],
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: spacing['4xl'],
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  authContainer: {
    width: '100%',
    alignItems: 'center',
  },
  authButton: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderRadius: borderRadius.xl,
  },
  authIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  authTitle: {
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  authSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    color: '#FCA5A5',
    marginLeft: spacing.xs,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
