/**
 * Lock screen with biometric authentication
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SafeThemedView } from '../src/components/ThemedView';
import { ThemedText } from '../src/components/ThemedText';
import { Button } from '../src/components/Button';
import { useTheme } from '../src/context/ThemeProvider';
import { useAuthLock, getBiometricTypeName } from '../src/context/AuthLockProvider';
import { spacing, borderRadius } from '../src/styles/theme';

export default function LockScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { 
    isLocked, 
    isAuthenticating, 
    error, 
    unlock, 
    clearError,
    biometricType,
    hasBiometrics,
  } = useAuthLock();

  // Animation values
  const scale = useSharedValue(1);
  const shake = useSharedValue(0);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: shake.value },
    ],
  }));

  // Navigate to vault when unlocked
  useEffect(() => {
    if (!isLocked) {
      router.replace('/(vault)' as any);
    }
  }, [isLocked, router]);

  // Shake animation on error
  useEffect(() => {
    if (error) {
      shake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [error]);

  const handleUnlock = useCallback(async () => {
    clearError();
    scale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );
    
    const success = await unlock();
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [unlock, clearError, scale]);

  const getBiometricIcon = (): keyof typeof Ionicons.glyphMap => {
    if (!hasBiometrics) return 'key-outline';
    
    if (biometricType === 1) { // FINGERPRINT
      return 'finger-print';
    }
    if (biometricType === 2) { // FACIAL_RECOGNITION
      return Platform.OS === 'ios' ? 'scan-outline' : 'happy-outline';
    }
    return 'finger-print';
  };

  const biometricName = getBiometricTypeName(biometricType);

  return (
    <SafeThemedView style={styles.container}>
      <View style={styles.content}>
        {/* Logo and title */}
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="lock-closed" size={32} color="#FFFFFF" />
          </View>
          <ThemedText variant="title" style={styles.appName}>
            IdLocker
          </ThemedText>
          <ThemedText variant="body" color="secondary">
            Your secure vault is locked
          </ThemedText>
        </View>

        {/* Unlock button */}
        <Pressable
          onPress={handleUnlock}
          disabled={isAuthenticating}
          style={({ pressed }) => [
            styles.unlockButton,
            {
              backgroundColor: pressed 
                ? colors.primaryDark 
                : colors.primary,
              opacity: isAuthenticating ? 0.7 : 1,
            },
          ]}
        >
          <Animated.View style={[styles.iconWrapper, animatedIconStyle]}>
            <Ionicons
              name={getBiometricIcon()}
              size={48}
              color="#FFFFFF"
            />
          </Animated.View>
          <ThemedText variant="button" style={styles.unlockText}>
            {isAuthenticating ? 'Authenticating...' : 'Unlock Vault'}
          </ThemedText>
          <ThemedText variant="caption" style={styles.biometricHint}>
            {hasBiometrics ? `Use ${biometricName}` : 'Use device passcode'}
          </ThemedText>
        </Pressable>

        {/* Error message */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
            <Ionicons name="warning-outline" size={18} color={colors.error} />
            <ThemedText variant="bodySmall" color="error" style={styles.errorText}>
              {error}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <ThemedText variant="caption" color="tertiary" style={styles.footerText}>
          Tap the button above to authenticate with{'\n'}
          {hasBiometrics ? biometricName : 'your device passcode'}
        </ThemedText>
      </View>
    </SafeThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  appName: {
    marginBottom: spacing.xs,
  },
  unlockButton: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing['3xl'],
    borderRadius: borderRadius['2xl'],
    minWidth: 200,
  },
  iconWrapper: {
    marginBottom: spacing.md,
  },
  unlockText: {
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  biometricHint: {
    color: 'rgba(255,255,255,0.7)',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  errorText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['2xl'],
  },
  footerText: {
    textAlign: 'center',
    lineHeight: 20,
  },
});

