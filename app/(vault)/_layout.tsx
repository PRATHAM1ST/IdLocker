/**
 * Vault group layout - protected screens with tab navigation and lock overlay
 */

import { View, StyleSheet } from 'react-native';
import { Tabs, Stack } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeProvider';
import { LockOverlay } from '../../src/components/LockOverlay';
import { spacing } from '../../src/styles/theme';

export default function VaultLayout() {
  const { colors } = useTheme();

  // Prevent screen capture on all vault screens
  usePreventScreenCapture();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerShadowVisible: false,
          tabBarStyle: {
            backgroundColor: colors.backgroundSecondary,
            borderTopColor: colors.border,
            paddingTop: spacing.xs,
            height: 85,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? 'shield' : 'shield-outline'} 
                size={24} 
                color={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: 'Categories',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? 'grid' : 'grid-outline'} 
                size={24} 
                color={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? 'search' : 'search-outline'} 
                size={24} 
                color={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerShown: true,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? 'person' : 'person-outline'} 
                size={24} 
                color={color} 
              />
            ),
          }}
        />
        {/* Hide these from tab bar - they're accessed via navigation */}
        <Tabs.Screen
          name="item/[id]"
          options={{
            href: null,
            headerShown: true,
            title: 'Details',
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            href: null,
            headerShown: false,
            title: 'Add Item',
          }}
        />
        <Tabs.Screen
          name="edit/[id]"
          options={{
            href: null,
            headerShown: false,
            title: 'Edit Item',
          }}
        />
      </Tabs>
      
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
