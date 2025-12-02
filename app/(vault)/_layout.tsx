/**
 * Vault group layout - protected screens with lock overlay
 */

import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { useTheme } from '../../src/context/ThemeProvider';
import { LockOverlay } from '../../src/components/LockOverlay';

export default function VaultLayout() {
  const { colors } = useTheme();

  // Prevent screen capture on all vault screens
  usePreventScreenCapture();

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
      
      {/* Lock overlay appears on top of all vault screens when locked */}
      <LockOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

