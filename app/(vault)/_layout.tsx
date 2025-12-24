/**
 * Vault group layout - protected screens with floating add button and lock overlay
 */

import { Ionicons } from '@expo/vector-icons';
import { Stack, usePathname, useRouter } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { useCallback, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LockOverlay } from '../../src/components/LockOverlay';
import { useCategories } from '../../src/context/CategoryProvider';
import { useHomeFilter } from '../../src/context/HomeFilterProvider';
import { useTheme } from '../../src/context/ThemeProvider';
import { borderRadius, darkShadows, shadows, spacing } from '../../src/styles/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { setDynamicFeatureFlag } from 'react-native-reanimated';

setDynamicFeatureFlag("EXAMPLE_DYNAMIC_FLAG", true);

export default function VaultLayout() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { homeFilter } = useHomeFilter();
  const { getCategoryById } = useCategories();

  // Prevent screen capture on all vault screens
  usePreventScreenCapture();

  // Get the selected category for color (when on home screen with a filter)
  const selectedCategory = useMemo(() => {
    if (homeFilter === 'all') return null;
    return getCategoryById(homeFilter) || null;
  }, [homeFilter, getCategoryById]);

  console.log('selectedCategory', selectedCategory);

  // Check if we're on screens that shouldn't show the add button
  const hideAddButton =
    pathname.includes('/add') ||
    pathname.includes('/edit') ||
    pathname.includes('/item/') ||
    pathname.includes('/category/');

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

    // On home screen with a category filter selected - pre-select that category
    if (homeFilter !== 'all') {
      return {
        pathname: '/(vault)/add' as const,
        params: { type: homeFilter },
        icon: 'add' as const,
      };
    }

    // Default - show category selector
    return {
      pathname: '/(vault)/add' as const,
      params: {},
      icon: 'add' as const,
    };
  }, [pathname, homeFilter]);

  const handleAddPress = useCallback(() => {
    const params = addButtonConfig.params || {};
    const query = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');

    const href = query ? `${addButtonConfig.pathname}?${query}` : addButtonConfig.pathname;
    router.push(href as any);
  }, [addButtonConfig, router]);

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
            headerShown: false,
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
            headerShown: false,
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
              backgroundColor: selectedCategory?.color.bg
                ? `linear-gradient(to bottom, ${selectedCategory?.color.gradientStart}, ${selectedCategory?.color.gradientEnd})`
                : colors.accent,
              bottom: 24 + Math.max(insets.bottom, spacing.sm),
              ...currentShadows.xl,
            },
          ]}
          onPress={handleAddPress}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[
              selectedCategory?.color.gradientStart ?? colors.accent,
              selectedCategory?.color.gradientEnd ?? colors.accent,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.floatingAddButton}
          >
            <Ionicons name={addButtonConfig.icon} size={32} color="#FFFFFF" />
          </LinearGradient>
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
