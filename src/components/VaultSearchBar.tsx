/**
 * Vault search bar component
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import Animated, { LinearTransition, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { ThemedText } from './ThemedText';
import { useTheme } from '../context/ThemeProvider';
import { borderRadius, spacing } from '../styles/theme';

interface VaultSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function VaultSearchBar({ searchQuery, onSearchChange }: VaultSearchBarProps) {
  const { colors, isDark } = useTheme();
  const inputRef = useRef<TextInput>(null);

  const handleClearSearch = () => {
    onSearchChange('');
    inputRef.current?.focus();
  };

  return (
    <Animated.View
      style={[
        styles.searchContainer,
        {
          borderRadius: borderRadius.sm - 1,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0,0,0,0.1)',
        },
      ]}
      layout={LinearTransition.springify().damping(18)}
    >
      <Ionicons
        name="search"
        size={20}
        color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}
      />
      <TextInput
        ref={inputRef}
        style={[styles.searchInput, { color: colors.text }]}
        placeholder="Search vault items..."
        placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
        value={searchQuery}
        onChangeText={onSearchChange}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {searchQuery.length > 0 && (
        <Animated.View entering={ZoomIn.duration(150)} exiting={ZoomOut.duration(150)}>
          <TouchableOpacity onPress={handleClearSearch}>
            <Ionicons
              name="close-circle"
              size={20}
              color={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}
            />
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.base,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: spacing.sm,
  },
});

