/**
 * Root layout with providers and global configuration
 */

import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from '../src/context/ThemeProvider';
import { AuthLockProvider } from '../src/context/AuthLockProvider';
import { VaultProvider } from '../src/context/VaultProvider';
import { loadSettings } from '../src/storage/vaultStorage';
import type { AppSettings } from '../src/utils/types';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isDark, colors } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen 
          name="(vault)" 
          options={{ 
            gestureEnabled: false,
          }} 
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [initialSettings, setInitialSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        // Load initial settings
        const settings = await loadSettings();
        setInitialSettings(settings);
      } catch (e) {
        console.warn('Failed to load settings:', e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider initialPreference={initialSettings?.theme}>
          <AuthLockProvider>
            <VaultProvider>
              <RootLayoutNav />
            </VaultProvider>
          </AuthLockProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
