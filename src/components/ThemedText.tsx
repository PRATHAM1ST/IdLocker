/**
 * Themed text component with typography presets
 */

import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import { typography } from '../styles/theme';

type TextVariant = 
  | 'title' 
  | 'subtitle' 
  | 'body' 
  | 'bodySmall' 
  | 'caption' 
  | 'label'
  | 'button';

interface ThemedTextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  color?: 'primary' | 'secondary' | 'tertiary' | 'accent' | 'error' | 'success';
  style?: TextStyle;
  numberOfLines?: number;
  selectable?: boolean;
}

export function ThemedText({
  children,
  variant = 'body',
  color = 'primary',
  style,
  numberOfLines,
  selectable = false,
}: ThemedTextProps) {
  const { colors } = useTheme();
  
  const textColor = {
    primary: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    accent: colors.primary,
    error: colors.error,
    success: colors.success,
  }[color];
  
  const variantStyle = styles[variant];
  
  return (
    <Text
      style={[variantStyle, { color: textColor }, style]}
      numberOfLines={numberOfLines}
      selectable={selectable}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    lineHeight: typography.sizes['2xl'] * typography.lineHeights.tight,
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.sizes.lg * typography.lineHeights.tight,
  },
  body: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.normal,
    lineHeight: typography.sizes.base * typography.lineHeights.normal,
  },
  bodySmall: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.normal,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },
  caption: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.normal,
    lineHeight: typography.sizes.xs * typography.lineHeights.normal,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    lineHeight: typography.sizes.sm * typography.lineHeights.tight,
  },
  button: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.sizes.base * typography.lineHeights.tight,
  },
});

