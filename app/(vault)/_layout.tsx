/**
 * Vault group layout - protected screens with floating add button and lock overlay
 */

import { Ionicons } from '@expo/vector-icons';
import { Stack, usePathname, useRouter } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LockOverlay } from '../../src/components/LockOverlay';
import { useTheme } from '../../src/context/ThemeProvider';
import { borderRadius, darkShadows, shadows, spacing } from '../../src/styles/theme';

export default function VaultLayout() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Prevent screen capture on all vault screens
  usePreventScreenCapture();

  // Check if we're on screens that shouldn't show the add button
  const hideAddButton = pathname.includes('/add') || pathname.includes('/edit') || pathname.includes('/item/');

  // Determine context-aware add button params based on current route
  const addButtonConfig = useMemo(() => {
    // On assets screen - open asset upload mode
    if (pathname.includes('/assets')) {
      return {
        pathname: '/(vault)/add' as const,
        params: { mode: 'asset' },
        icon: 'cloud-upload-outline' as const,
      };
    }
    
    // On category detail screen - pre-select that category
    const categoryMatch = pathname.match(/\/category\/([^\/]+)/);
    if (categoryMatch && categoryMatch[1] && categoryMatch[1] !== 'new') {
      const categoryId = categoryMatch[1];
      return {
        pathname: '/(vault)/add' as const,
        params: { categoryId },
        icon: 'add' as const,
      };
    }
    
    // Default - show category selector
    return {
      pathname: '/(vault)/add' as const,
      params: {},
      icon: 'add' as const,
    };
  }, [pathname]);

  const currentShadows = isDark ? darkShadows : shadows;

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerShadowVisible: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="add"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="item/[id]"
          options={{
            headerShown: true,
            title: 'Details',
          }}
        />
        <Stack.Screen
          name="edit/[id]"
          options={{
            headerShown: false,
            title: 'Edit Item',
          }}
        />
        <Stack.Screen
          name="assets"
          options={{
            headerShown: false,
          }}
        />
      </Stack>

      {/* Floating Add Button - Squircle style with context-aware behavior */}
      {!hideAddButton && (
        <TouchableOpacity
          style={[
            styles.floatingAddButton,
            {
              backgroundColor: colors.accent,
              bottom: 24 + Math.max(insets.bottom, spacing.sm),
              ...currentShadows.xl,
            },
          ]}
          onPress={() => router.push({
            pathname: addButtonConfig.pathname,
            params: addButtonConfig.params,
          } as any)}
          activeOpacity={0.85}
        >
          <Ionicons name={addButtonConfig.icon} size={32} color="#FFFFFF" />
        </TouchableOpacity>
      )}
      
      {/* Lock overlay appears on top of all vault screens when locked */}
      <LockOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingAddButton: {
    position: 'absolute',
    alignSelf: 'center',
    width: 58,
    height: 58,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});
