/**
 * Swipeable action components for category navigation
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { useTheme } from '../context/ThemeProvider';
import { borderRadius, spacing } from '../styles/theme';

interface CategoryInfo {
  id: string;
  label: string;
  icon: string;
  color: { gradientStart: string; gradientEnd: string };
}

interface SwipeableActionsProps {
  prevCategory: CategoryInfo | null;
  nextCategory: CategoryInfo | null;
}

export function useSwipeableActions({ prevCategory, nextCategory }: SwipeableActionsProps) {
  const { colors } = useTheme();

  const renderRightActions = useCallback(() => {
    if (!nextCategory) return null;
    return (
      <View style={[styles.swipeAction, styles.swipeActionRight]}>
        <View
          style={[
            styles.swipeActionContent,
            { backgroundColor: nextCategory.color.gradientStart, borderRadius: borderRadius.md },
          ]}
        >
          <Ionicons name={(nextCategory.icon || 'folder') as any} size={24} color={colors.text} />
          <ThemedText variant="caption" style={styles.swipeActionText} color="primary">
            {nextCategory.label}
          </ThemedText>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </View>
      </View>
    );
  }, [nextCategory, colors]);

  const renderLeftActions = useCallback(() => {
    if (!prevCategory) return null;
    return (
      <View style={[styles.swipeAction, styles.swipeActionLeft]}>
        <View
          style={[
            styles.swipeActionContent,
            { backgroundColor: prevCategory.color.gradientStart, borderRadius: borderRadius.md },
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
          <ThemedText variant="caption" style={styles.swipeActionText} color="primary">
            {prevCategory.label}
          </ThemedText>
          <Ionicons name={(prevCategory.icon || 'folder') as any} size={24} color={colors.text} />
        </View>
      </View>
    );
  }, [prevCategory, colors]);

  return {
    renderLeftActions,
    renderRightActions,
  };
}

const styles = StyleSheet.create({
  swipeAction: {
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.md,
  },
  swipeActionLeft: {
    alignItems: 'flex-start',
  },
  swipeActionRight: {
    alignItems: 'flex-end',
  },
  swipeActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  swipeActionText: {
    fontWeight: '600',
  },
});

