/**
 * Lock overlay with automatic authentication
 * Shows overlay and triggers auth popup automatically
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
} from 'react-native-reanimated';
import { getBiometricTypeName, useAuthLock } from '../context/AuthLockProvider';
import { useTheme } from '../context/ThemeProvider';
import { borderRadius, spacing } from '../styles/theme';
import { ThemedText } from './ThemedText';

export function LockOverlay() {
  const { colors, isDark } = useTheme();
  const {
    isLocked,
    isAuthenticating,
    error,
    unlock,
    biometricType,
    hasBiometrics,
  } = useAuthLock();

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

  // Background color based on theme
  const bgColor = isDark ? '#121212' : '#f5f5f5';

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }]}
    >
      {/* iOS: Use native blur, Android: Use solid background */}
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={95}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }]} />
      )}

      {/* Content */}
      <TouchableOpacity 
        style={styles.content} 
        activeOpacity={0.9}
        onPress={handleRetry}
        disabled={isAuthenticating}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
          <Ionicons
            name={getBiometricIcon()}
            size={28}
            color="#FFFFFF"
          />
        </View>

        <ThemedText variant="body" style={styles.title}>
          {isAuthenticating ? 'Verifying...' : error ? 'Tap to retry' : 'Unlocking...'}
        </ThemedText>
        
        <ThemedText variant="caption" color="secondary">
          {hasBiometrics ? biometricName : 'Device passcode'}
        </ThemedText>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: colors.error + '20' }]}>
            <ThemedText variant="caption" color="error">
              {error}
            </ThemedText>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.xs,
  },
  errorBox: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
});
