/**
 * Theme configuration for IdLocker
 * Forest green with coral accent theme
 */

import type { ThemeColors } from '../utils/types';

// Light theme colors
export const lightColors: ThemeColors = {
  // Backgrounds
  background: '#F8FAFC',
  backgroundSecondary: '#FFFFFF',
  backgroundTertiary: '#F1F5F9',

  // Text
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',

  // Primary - Forest green
  primary: '#2D6A4F',
  primaryDark: '#1B4332',
  primaryLight: '#40916C',

  // Accent - Coral/Orange
  accent: '#F97316',
  accentLight: '#FB923C',

  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // UI elements
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',

  // Input
  inputBackground: '#F8FAFC',
  inputBorder: '#CBD5E1',
  inputText: '#0F172A',
  placeholder: '#94A3B8',

  // Header gradient
  headerGradientStart: '#1B4332',
  headerGradientEnd: '#2D6A4F',
};

// Dark theme colors
export const darkColors: ThemeColors = {
  // Backgrounds - Deep forest
  background: '#0A1612',
  backgroundSecondary: '#132A1F',
  backgroundTertiary: '#1B4332',

  // Text
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',

  // Primary - Forest green
  primary: '#40916C',
  primaryDark: '#2D6A4F',
  primaryLight: '#52B788',

  // Accent - Warm coral
  accent: '#FB923C',
  accentLight: '#FDBA74',

  // Status colors
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',

  // UI elements
  border: '#1B4332',
  borderLight: '#132A1F',
  card: '#132A1F',
  cardElevated: '#1B4332',

  // Input
  inputBackground: '#1B4332',
  inputBorder: '#2D6A4F',
  inputText: '#F1F5F9',
  placeholder: '#64748B',

  // Header gradient
  headerGradientStart: '#0D2818',
  headerGradientEnd: '#1B4332',
};

// Typography scale
export const typography = {
  // Font sizes
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  // Line heights
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font weights
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
};

// Border radius scale - consistent squircle design
export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
};

// Layout constants
export const layout = {
  tabBarHeight: 85,
  headerHeight: 56,
  cardPadding: 16,
  screenPadding: 16,
};

// Shadow styles
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Dark mode shadows (more subtle)
export const darkShadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Animation durations
export const animations = {
  fast: 150,
  normal: 250,
  slow: 400,
};

// Get theme colors based on color scheme
export function getThemeColors(isDark: boolean): ThemeColors {
  return isDark ? darkColors : lightColors;
}

// Get shadows based on color scheme
export function getThemeShadows(isDark: boolean) {
  return isDark ? darkShadows : shadows;
}
