/**
 * Theme context provider for managing light/dark mode
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import type { ThemeColors, AppSettings } from '../utils/types';
import { getThemeColors, getThemeShadows, lightColors, darkColors } from '../styles/theme';
import { loadSettings, updateSettings } from '../storage/vaultStorage';

type ThemePreference = AppSettings['theme'];

interface ThemeContextValue {
  // Current theme colors
  colors: ThemeColors;
  // Whether dark mode is active
  isDark: boolean;
  // User's theme preference
  preference: ThemePreference;
  // Change theme preference
  setThemePreference: (preference: ThemePreference) => Promise<void>;
  // Shadow styles for current theme
  shadows: typeof import('../styles/theme').shadows;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialPreference?: ThemePreference;
}

export function ThemeProvider({ children, initialPreference = 'system' }: ThemeProviderProps) {
  const systemColorScheme = useSystemColorScheme();
  const [preference, setPreference] = useState<ThemePreference>(initialPreference);

  // Load saved preference on mount
  useEffect(() => {
    loadSettings().then((settings) => {
      setPreference(settings.theme);
    });
  }, []);

  // Determine if dark mode should be active
  const isDark = useMemo(() => {
    if (preference === 'system') {
      return systemColorScheme === 'dark';
    }
    return preference === 'dark';
  }, [preference, systemColorScheme]);

  // Get theme colors
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const shadows = useMemo(() => getThemeShadows(isDark), [isDark]);

  // Update theme preference
  const setThemePreference = useCallback(async (newPreference: ThemePreference) => {
    setPreference(newPreference);
    await updateSettings({ theme: newPreference });
  }, []);

  const value = useMemo(
    () => ({
      colors,
      isDark,
      preference,
      setThemePreference,
      shadows,
    }),
    [colors, isDark, preference, setThemePreference, shadows],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to access theme context
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook for themed styles
 */
export function useThemedStyles<T>(styleFactory: (colors: ThemeColors, isDark: boolean) => T): T {
  const { colors, isDark } = useTheme();
  return useMemo(() => styleFactory(colors, isDark), [colors, isDark, styleFactory]);
}
