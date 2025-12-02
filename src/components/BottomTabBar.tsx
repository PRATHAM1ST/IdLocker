/**
 * Custom Bottom Tab Bar component
 * Modern design with floating style and accent indicators
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeProvider';
import { spacing } from '../styles/theme';
import { ThemedText } from './ThemedText';

export type TabRoute = 'index' | 'assets' | 'categories' | 'search' | 'settings';

interface TabConfig {
  key: TabRoute;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFilled: keyof typeof Ionicons.glyphMap;
}

const TABS: TabConfig[] = [
  { key: 'index', label: 'Home', icon: 'shield-outline', iconFilled: 'shield' },
  { key: 'assets', label: 'Assets', icon: 'folder-outline', iconFilled: 'folder' },
  { key: 'categories', label: 'Categories', icon: 'grid-outline', iconFilled: 'grid' },
  { key: 'search', label: 'Search', icon: 'search-outline', iconFilled: 'search' },
  { key: 'settings', label: 'Settings', icon: 'person-outline', iconFilled: 'person' },
];

interface BottomTabBarProps {
  currentRoute: TabRoute;
  onTabPress: (route: TabRoute) => void;
}

export function BottomTabBar({ currentRoute, onTabPress }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundSecondary,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
          borderTopColor: colors.border,
        },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = currentRoute === tab.key;
        const iconName = isActive ? tab.iconFilled : tab.icon;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              {isActive && (
                <View
                  style={[
                    styles.activeIndicator,
                    { backgroundColor: colors.accent },
                  ]}
                />
              )}
              <Ionicons
                name={iconName}
                size={24}
                color={isActive ? colors.accent : colors.textTertiary}
              />
              <ThemedText
                variant="caption"
                style={[
                  styles.label,
                  {
                    color: isActive ? colors.accent : colors.textTertiary,
                    fontWeight: isActive ? '600' : '400',
                  },
                ]}
              >
                {tab.label}
              </ThemedText>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  activeIndicator: {
    position: 'absolute',
    top: -spacing.sm,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  label: {
    marginTop: spacing.xs,
    fontSize: 11,
  },
});

