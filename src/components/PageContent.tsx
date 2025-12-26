/**
 * Reusable page content wrapper with rounded top corners
 * Used to wrap content below PageHeader
 */

import React from 'react';
import { View, StyleSheet, ScrollView, ScrollViewProps } from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import { borderRadius, spacing, layout } from '../styles/theme';

interface PageContentProps extends ScrollViewProps {
  children: React.ReactNode;
  scrollable?: boolean;
  contentPadding?: boolean;
}

export function PageContent({
  children,
  scrollable = true,
  contentPadding = true,
  style,
  contentContainerStyle,
  ...scrollViewProps
}: PageContentProps) {
  const { colors } = useTheme();

  const containerStyle = [
    styles.container,
    { backgroundColor: colors.background },
    style,
  ];

  const contentStyle = [
    contentPadding && styles.contentPadding,
    contentContainerStyle,
  ];

  if (scrollable) {
    return (
      <ScrollView
        style={containerStyle}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: layout.tabBarHeight + spacing.xl },
          ...contentStyle,
        ]}
        showsVerticalScrollIndicator={false}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: -spacing.md,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentPadding: {
    padding: spacing.base,
    paddingTop: spacing.lg,
  },
});

