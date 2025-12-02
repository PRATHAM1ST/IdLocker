/**
 * Vault group layout - protected screens
 */

import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { useTheme } from '../../src/context/ThemeProvider';
import { useAuthLock } from '../../src/context/AuthLockProvider';

export default function VaultLayout() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isLocked } = useAuthLock();

  // Prevent screen capture on all vault screens
  usePreventScreenCapture();

  // Redirect to lock screen if locked
  useEffect(() => {
    if (isLocked) {
      router.replace('/lock' as any);
    }
  }, [isLocked, router]);

  return (
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
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Vault',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="item/[id]"
        options={{
          title: 'Details',
          headerBackTitle: 'Back',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          title: 'Add Item',
          headerBackTitle: 'Cancel',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          title: 'Edit Item',
          headerBackTitle: 'Cancel',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}

