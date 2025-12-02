/**
 * Vault group layout - protected screens with floating add button and lock overlay
 */

import { Ionicons } from '@expo/vector-icons';
import { Stack, usePathname, useRouter } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
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
          name="categories"
          options={{
            href: null,
          }}
        />
        <Stack.Screen
          name="assets"
          options={{
            headerShown: false,
          }}
        />
      </Stack>

      {/* Floating Add Button - Squircle style */}
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
          onPress={() => router.push('/add')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={32} color="#FFFFFF" />
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
