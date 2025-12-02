/**
 * Illustrated Header component with gradient background and decorative elements
 * Used for home and category screens
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Defs, RadialGradient, Stop, G } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeProvider';
import { spacing } from '../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 280;

interface IllustratedHeaderProps {
  onSearchPress?: () => void;
  children?: React.ReactNode;
}

/**
 * Vault Shield Illustration - Security themed SVG
 */
function VaultIllustration() {
  return (
    <Svg width={200} height={180} viewBox="0 0 200 180">
      <Defs>
        <RadialGradient id="shieldGrad" cx="50%" cy="30%" r="70%">
          <Stop offset="0%" stopColor="#52B788" stopOpacity="1" />
          <Stop offset="100%" stopColor="#2D6A4F" stopOpacity="1" />
        </RadialGradient>
        <RadialGradient id="innerGrad" cx="50%" cy="40%" r="50%">
          <Stop offset="0%" stopColor="#40916C" stopOpacity="1" />
          <Stop offset="100%" stopColor="#1B4332" stopOpacity="1" />
        </RadialGradient>
      </Defs>
      
      {/* Background leaves/decorative elements */}
      <G opacity="0.3">
        <Path
          d="M30 140 Q50 100, 40 60 Q60 80, 70 50"
          stroke="#74C69D"
          strokeWidth="3"
          fill="none"
        />
        <Circle cx="40" cy="55" r="8" fill="#74C69D" />
        <Path
          d="M160 130 Q150 100, 165 70 Q145 85, 140 55"
          stroke="#74C69D"
          strokeWidth="3"
          fill="none"
        />
        <Circle cx="165" cy="65" r="6" fill="#74C69D" />
      </G>
      
      {/* Main shield */}
      <Path
        d="M100 25 L155 45 L155 95 Q155 140, 100 165 Q45 140, 45 95 L45 45 Z"
        fill="url(#shieldGrad)"
      />
      
      {/* Inner shield */}
      <Path
        d="M100 40 L140 55 L140 90 Q140 125, 100 145 Q60 125, 60 90 L60 55 Z"
        fill="url(#innerGrad)"
      />
      
      {/* Lock icon in center */}
      <G transform="translate(80, 70)">
        <Path
          d="M10 18 L10 12 Q10 2, 20 2 Q30 2, 30 12 L30 18"
          stroke="#F1F5F9"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M5 18 L35 18 L35 38 Q35 42, 31 42 L9 42 Q5 42, 5 38 Z"
          fill="#F1F5F9"
        />
        <Circle cx="20" cy="28" r="4" fill="#1B4332" />
        <Path
          d="M20 30 L20 36"
          stroke="#1B4332"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </G>
      
      {/* Decorative circles */}
      <Circle cx="25" cy="100" r="5" fill="#74C69D" opacity="0.4" />
      <Circle cx="175" cy="90" r="4" fill="#74C69D" opacity="0.4" />
      <Circle cx="170" cy="150" r="6" fill="#52B788" opacity="0.3" />
      <Circle cx="35" cy="160" r="4" fill="#52B788" opacity="0.3" />
    </Svg>
  );
}

export function IllustratedHeader({ onSearchPress, children }: IllustratedHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { paddingTop: insets.top }]}
      >
        {/* Decorative background circles */}
        <View style={styles.decorativeCircles}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </View>

        {/* Search button */}
        {onSearchPress && (
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
            onPress={onSearchPress}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <VaultIllustration />
        </View>

        {children}
      </LinearGradient>
    </View>
  );
}

/**
 * Compact header variant for inner screens
 */
interface CompactHeaderProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function CompactHeader({ title, subtitle, icon }: CompactHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[colors.headerGradientStart, colors.headerGradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.compactGradient, { paddingTop: insets.top + spacing.md }]}
    >
      {icon && (
        <View style={styles.compactIconContainer}>
          <Ionicons name={icon} size={28} color="#FFFFFF" />
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  gradient: {
    height: HEADER_HEIGHT,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCircles: {
    ...StyleSheet.absoluteFillObject,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  circle1: {
    width: 200,
    height: 200,
    top: -50,
    right: -30,
  },
  circle2: {
    width: 150,
    height: 150,
    top: 100,
    left: -60,
  },
  circle3: {
    width: 80,
    height: 80,
    bottom: 20,
    right: 40,
  },
  searchButton: {
    position: 'absolute',
    top: 0,
    left: spacing.base,
    marginTop: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  compactGradient: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  compactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

