/**
 * Themed view component with common background variants
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeProvider';

type ViewVariant = 'primary' | 'secondary' | 'tertiary' | 'card' | 'elevated';

interface ThemedViewProps {
  children: React.ReactNode;
  variant?: ViewVariant;
  style?: ViewStyle;
}

export function ThemedView({
  children,
  variant = 'primary',
  style,
}: ThemedViewProps) {
  const { colors, shadows, isDark } = useTheme();
  
  const backgroundColor = {
    primary: colors.background,
    secondary: colors.backgroundSecondary,
    tertiary: colors.backgroundTertiary,
    card: colors.card,
    elevated: colors.cardElevated,
  }[variant];
  
  const shadowStyle = variant === 'elevated' ? shadows.md : undefined;
  
  return (
    <View style={[{ backgroundColor }, shadowStyle, style]}>
      {children}
    </View>
  );
}

/**
 * Safe area themed view
 */
import { SafeAreaView } from 'react-native-safe-area-context';

interface SafeThemedViewProps extends ThemedViewProps {
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function SafeThemedView({
  children,
  variant = 'primary',
  style,
  edges = ['top', 'bottom'],
}: SafeThemedViewProps) {
  const { colors } = useTheme();
  
  const backgroundColor = {
    primary: colors.background,
    secondary: colors.backgroundSecondary,
    tertiary: colors.backgroundTertiary,
    card: colors.card,
    elevated: colors.cardElevated,
  }[variant];
  
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor }, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

