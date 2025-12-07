/**
 * Secure field component for displaying sensitive data
 * Supports masking with show/hide toggle and copy functionality
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useState } from 'react';
import { Clipboard, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import { borderRadius, spacing } from '../styles/theme';
import { maskValue } from '../utils/validation';
import { ThemedText } from './ThemedText';

interface SecureFieldProps {
  label: string;
  value: string;
  sensitive?: boolean;
  copyable?: boolean;
  maskLength?: number;
}

export function SecureField({
  label,
  value,
  sensitive = false,
  copyable = true,
  maskLength = 4,
}: SecureFieldProps) {
  const { colors } = useTheme();
  const [isRevealed, setIsRevealed] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  const displayValue = sensitive && !isRevealed ? maskValue(value, maskLength) : value;

  const handleToggleReveal = useCallback(() => {
    setIsRevealed((prev) => !prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      Clipboard.setString(value);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [value]);

  if (!value) return null;

  return (
    <View style={styles.container}>
      <ThemedText variant="label" color="secondary" style={styles.label}>
        {label}
      </ThemedText>

      <View style={[styles.valueRow, { backgroundColor: colors.backgroundTertiary }]}>
        <Text
          style={[
            styles.value,
            { color: colors.text },
            sensitive && !isRevealed && styles.maskedValue,
          ]}
          selectable={!sensitive || isRevealed}
        >
          {displayValue}
        </Text>

        <View style={{ flexDirection: 'column', alignItems: 'center' }}>
          <View style={styles.actions}>
            {sensitive && (
              <TouchableOpacity
                onPress={handleToggleReveal}
                style={styles.actionButton}
                hitSlop={{
                  top: 8,
                  bottom: 8,
                  left: 8,
                  right: 8,
                }}
              >
                <Ionicons
                  name={isRevealed ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}

            {copyable && (
              <TouchableOpacity
                onPress={handleCopy}
                style={styles.actionButton}
                hitSlop={{
                  top: 8,
                  bottom: 8,
                  left: 8,
                  right: 8,
                }}
              >
                <Ionicons
                  name={showCopied ? 'checkmark' : 'copy-outline'}
                  size={20}
                  color={showCopied ? colors.success : colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
          <View style={{ flexGrow: 1 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minHeight: 44,
  },
  value: {
    flex: 1,
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  maskedValue: {
    // letterSpacing: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  actionButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
});
