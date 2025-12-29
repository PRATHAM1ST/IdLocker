/**
 * Reusable card component for consistent card styling
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import { borderRadius, shadows, spacing } from '../styles/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export function Card({ children, style, contentStyle }: CardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card }, shadows.md, style]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  content: {
    padding: spacing.base,
  },
});

