/**
 * Circular action button for modals
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import { borderRadius, spacing } from '../styles/theme';

interface ModalActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  backgroundColor?: string;
  iconColor?: string;
  size?: number;
  style?: ViewStyle;
}

export function ModalActionButton({
  icon,
  onPress,
  backgroundColor,
  iconColor = '#FFFFFF',
  size = 50,
  style,
}: ModalActionButtonProps) {
  const { colors } = useTheme();

  const buttonStyle = [
    styles.button,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: backgroundColor || colors.primary,
    },
    style,
  ];

  return (
    <TouchableOpacity style={buttonStyle} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon} size={size * 0.48} color={iconColor} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

