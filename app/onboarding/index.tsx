/**
 * Onboarding screen - introduces app features and security model
 */

import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeThemedView } from '../../src/components/ThemedView';
import { ThemedText } from '../../src/components/ThemedText';
import { Button } from '../../src/components/Button';
import { useTheme } from '../../src/context/ThemeProvider';
import { completeOnboarding } from '../../src/storage/vaultStorage';
import { spacing, borderRadius } from '../../src/styles/theme';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  highlight?: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'shield-checkmark',
    title: 'Your Secure Vault',
    description: 'Store your sensitive information securely on your device. Bank accounts, cards, IDs, and login credentials - all in one place.',
    highlight: 'Military-grade encryption',
  },
  {
    id: '2',
    icon: 'cloud-offline',
    title: 'Completely Offline',
    description: 'Your data never leaves your device. No cloud sync, no servers, no network connections. Your privacy is absolute.',
    highlight: 'Zero network access',
  },
  {
    id: '3',
    icon: 'finger-print',
    title: 'Biometric Protection',
    description: 'Access your vault using Face ID, Touch ID, or your device passcode. Only you can unlock your secrets.',
    highlight: 'Device-level security',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const handleComplete = async () => {
    await completeOnboarding();
    router.replace('/lock' as any);
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
        <Ionicons name={item.icon} size={64} color={colors.primary} />
      </View>
      
      <ThemedText variant="title" style={styles.title}>
        {item.title}
      </ThemedText>
      
      {item.highlight && (
        <View style={[styles.highlightBadge, { backgroundColor: colors.primary }]}>
          <ThemedText variant="caption" style={styles.highlightText}>
            {item.highlight}
          </ThemedText>
        </View>
      )}
      
      <ThemedText variant="body" color="secondary" style={styles.description}>
        {item.description}
      </ThemedText>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => {
        const inputRange = [
          (index - 1) * width,
          index * width,
          (index + 1) * width,
        ];
        
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });
        
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });
        
        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity,
                backgroundColor: colors.primary,
              },
            ]}
          />
        );
      })}
    </View>
  );

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <SafeThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Ionicons name="lock-closed" size={24} color="#FFFFFF" />
        </View>
        <ThemedText variant="subtitle">IdLocker</ThemedText>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={event => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />

      {renderDots()}

      <View style={styles.footer}>
        {isLastSlide ? (
          <Button
            title="Get Started"
            onPress={handleComplete}
            icon="arrow-forward"
            iconPosition="right"
            fullWidth
            size="lg"
          />
        ) : (
          <>
            <Button
              title="Skip"
              onPress={handleComplete}
              variant="ghost"
              style={styles.skipButton}
            />
            <Button
              title="Next"
              onPress={handleNext}
              icon="arrow-forward"
              iconPosition="right"
              style={styles.nextButton}
            />
          </>
        )}
      </View>

      <View style={[styles.disclaimer, { borderTopColor: colors.border }]}>
        <Ionicons name="warning-outline" size={14} color={colors.warning} />
        <ThemedText variant="caption" color="secondary" style={styles.disclaimerText}>
          Data is stored only on this device. Uninstalling the app or changing device security settings may result in data loss.
        </ThemedText>
      </View>
    </SafeThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  highlightBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  highlightText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  skipButton: {
    flex: 1,
    marginRight: spacing.md,
  },
  nextButton: {
    flex: 2,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  disclaimerText: {
    flex: 1,
    marginLeft: spacing.sm,
    lineHeight: 18,
  },
});

