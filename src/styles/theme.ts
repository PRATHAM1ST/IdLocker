/**
 * Theme configuration for IdLocker
 * Deep navy with electric cyan accent theme
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
  
  // Primary accent - Electric cyan
  primary: '#0891B2',
  primaryDark: '#0E7490',
  primaryLight: '#22D3EE',
  
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
};

// Dark theme colors
export const darkColors: ThemeColors = {
  // Backgrounds - Deep navy
  background: '#0A1628',
  backgroundSecondary: '#0F1D32',
  backgroundTertiary: '#162236',
  
  // Text
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  
  // Primary accent - Electric cyan
  primary: '#00D9FF',
  primaryDark: '#0891B2',
  primaryLight: '#67E8F9',
  
  // Status colors
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  
  // UI elements
  border: '#1E3A5F',
  borderLight: '#162236',
  card: '#0F1D32',
  cardElevated: '#162236',
  
  // Input
  inputBackground: '#162236',
  inputBorder: '#1E3A5F',
  inputText: '#F1F5F9',
  placeholder: '#64748B',
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

// Border radius scale
export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
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
};

// Category colors for item types
export const categoryColors = {
  bankAccount: {
    light: { bg: '#DBEAFE', text: '#1E40AF', icon: '#3B82F6' },
    dark: { bg: '#1E3A5F', text: '#93C5FD', icon: '#60A5FA' },
  },
  card: {
    light: { bg: '#FEE2E2', text: '#991B1B', icon: '#EF4444' },
    dark: { bg: '#450A0A', text: '#FCA5A5', icon: '#F87171' },
  },
  govId: {
    light: { bg: '#D1FAE5', text: '#065F46', icon: '#10B981' },
    dark: { bg: '#064E3B', text: '#6EE7B7', icon: '#34D399' },
  },
  login: {
    light: { bg: '#E0E7FF', text: '#3730A3', icon: '#6366F1' },
    dark: { bg: '#312E81', text: '#A5B4FC', icon: '#818CF8' },
  },
  note: {
    light: { bg: '#FEF3C7', text: '#92400E', icon: '#F59E0B' },
    dark: { bg: '#451A03', text: '#FCD34D', icon: '#FBBF24' },
  },
  other: {
    light: { bg: '#F3E8FF', text: '#6B21A8', icon: '#A855F7' },
    dark: { bg: '#581C87', text: '#D8B4FE', icon: '#C084FC' },
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

// Get category color based on theme
export function getCategoryColor(
  type: keyof typeof categoryColors,
  isDark: boolean
) {
  return isDark ? categoryColors[type].dark : categoryColors[type].light;
}

