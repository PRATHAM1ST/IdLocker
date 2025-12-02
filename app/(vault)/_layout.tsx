/**
 * Vault group layout - protected screens with tab navigation and lock overlay
 */

import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeProvider';
import { LockOverlay } from '../../src/components/LockOverlay';
import { spacing, shadows, darkShadows, borderRadius } from '../../src/styles/theme';

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

  // Tab item styles for left and right positioning
  const leftTabStyle = { marginRight: spacing.sm };
  const rightTabStyle = { marginLeft: spacing.sm };

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
            paddingHorizontal: spacing.md,
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
            tabBarItemStyle: leftTabStyle,
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
            tabBarItemStyle: { marginRight: spacing.xl },
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? 'grid' : 'grid-outline'} 
                size={24} 
                color={color} 
              />
            ),
          }}
        />
        {/* Hidden spacer for the floating add button */}
        <Tabs.Screen
          name="add"
          options={{
            href: null,
            headerShown: false,
            title: 'Add Item',
            tabBarItemStyle: { width: 70 },
            tabBarIcon: () => <View style={{ width: 70 }} />,
            tabBarLabel: () => null,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            headerShown: false,
            tabBarItemStyle: { marginLeft: spacing.xl },
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
            tabBarItemStyle: rightTabStyle,
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
          name="edit/[id]"
          options={{
            href: null,
            headerShown: false,
            title: 'Edit Item',
          }}
        />
      </Tabs>

      {/* Floating Add Button - Squircle style */}
      {!hideAddButton && (
        <TouchableOpacity
          style={[
            styles.floatingAddButton,
            {
              backgroundColor: colors.accent,
              bottom: 50 + Math.max(insets.bottom, spacing.sm),
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
    borderRadius: borderRadius.xl, // Squircle: 20px radius for rounded square
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});
