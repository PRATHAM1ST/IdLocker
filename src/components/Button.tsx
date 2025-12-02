/**
 * Themed button component
 */

import React from 'react';
import {
  TouchableOpacity,
  View,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeProvider';
import { ThemedText } from './ThemedText';
import { spacing, borderRadius } from '../styles/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme();

  const isDisabled = disabled || loading;

  // Get variant styles
  const variantStyles = {
    primary: {
      bg: colors.primary,
      text: '#FFFFFF',
      border: 'transparent',
    },
    secondary: {
      bg: colors.backgroundTertiary,
      text: colors.text,
      border: 'transparent',
    },
    outline: {
      bg: 'transparent',
      text: colors.primary,
      border: colors.primary,
    },
    ghost: {
      bg: 'transparent',
      text: colors.primary,
      border: 'transparent',
    },
    danger: {
      bg: colors.error,
      text: '#FFFFFF',
      border: 'transparent',
    },
  }[variant];

  // Get size styles
  const sizeStyles = {
    sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, fontSize: 14, iconSize: 16 },
    md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, fontSize: 16, iconSize: 18 },
    lg: { paddingVertical: spacing.base, paddingHorizontal: spacing.xl, fontSize: 18, iconSize: 20 },
  }[size];

  const iconComponent = icon && !loading && (
    <Ionicons
      name={icon}
      size={sizeStyles.iconSize}
      color={variantStyles.text}
      style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
    />
  );

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: variantStyles.bg,
          borderColor: variantStyles.border,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          opacity: isDisabled ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
        variant === 'outline' && styles.outlined,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.text} size="small" />
      ) : (
        <View style={styles.content}>
          {iconPosition === 'left' && iconComponent}
          <ThemedText
            variant="button"
            style={{ color: variantStyles.text, fontSize: sizeStyles.fontSize }}
          >
            {title}
          </ThemedText>
          {iconPosition === 'right' && iconComponent}
        </View>
      )}
    </TouchableOpacity>
  );
}

/**
 * Icon-only button
 */
interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  color?: string;
  backgroundColor?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function IconButton({
  icon,
  onPress,
  size = 24,
  color,
  backgroundColor,
  disabled = false,
  style,
}: IconButtonProps) {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.iconButton,
        {
          backgroundColor: backgroundColor || 'transparent',
          width: size + spacing.md * 2,
          height: size + spacing.md * 2,
          borderRadius: (size + spacing.md * 2) / 2,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={size} color={color || colors.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  outlined: {
    borderWidth: 2,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

