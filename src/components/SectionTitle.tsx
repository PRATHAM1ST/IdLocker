/**
 * Reusable section title component
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { spacing } from '../styles/theme';

interface SectionTitleProps {
  children: React.ReactNode;
}

export function SectionTitle({ children }: SectionTitleProps) {
  return (
    <ThemedText variant="label" color="secondary" style={styles.title}>
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

