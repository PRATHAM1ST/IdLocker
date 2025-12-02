/**
 * Settings screen - app configuration and security info
 * Redesigned with modern card-based layout
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '../../src/components/ThemedView';
import { ThemedText } from '../../src/components/ThemedText';
import { Button } from '../../src/components/Button';
import { useTheme } from '../../src/context/ThemeProvider';
import { useAuthLock, getBiometricTypeName } from '../../src/context/AuthLockProvider';
import { loadSettings, clearVault } from '../../src/storage/vaultStorage';
import { spacing, borderRadius, shadows } from '../../src/styles/theme';
import type { AppSettings } from '../../src/utils/types';

// Auto-lock timeout limits (in seconds)
const MIN_TIMEOUT = 30;
const MAX_TIMEOUT = 600; // 10 minutes

// Format timeout duration for display
function formatTimeout(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark, preference, setThemePreference } = useTheme();
  const { lock, biometricType, hasBiometrics, autoLockTimeout, setAutoLockTimeout } = useAuthLock();

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [sliderValue, setSliderValue] = useState(autoLockTimeout);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  // Sync slider with context when autoLockTimeout changes
  useEffect(() => {
    setSliderValue(autoLockTimeout);
  }, [autoLockTimeout]);

  const handleTimeoutSliderChange = useCallback((value: number) => {
    // Round to nearest 10 for smoother snapping
    const rounded = Math.round(value / 10) * 10;
    setSliderValue(rounded);
  }, []);

  const handleTimeoutSliderComplete = useCallback(async (value: number) => {
    // Round to nearest 10 seconds
    const rounded = Math.round(value / 10) * 10;
    await setAutoLockTimeout(rounded);
  }, [setAutoLockTimeout]);

  const handleThemeChange = useCallback(async (theme: AppSettings['theme']) => {
    await setThemePreference(theme);
  }, [setThemePreference]);

  const handleLockNow = useCallback(() => {
    lock();
    // Lock overlay will appear automatically
  }, [lock]);

  const handleClearData = useCallback(() => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your vault items. This action cannot be undone.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            const success = await clearVault();
            if (success) {
              Alert.alert('Success', 'All vault data has been cleared.');
            } else {
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  }, []);

  const biometricName = getBiometricTypeName(biometricType);

  const renderSettingRow = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle?: string,
    rightComponent?: React.ReactNode,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={[styles.settingRow, { backgroundColor: colors.card }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: colors.backgroundTertiary }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <ThemedText variant="body">{title}</ThemedText>
        {subtitle && (
          <ThemedText variant="caption" color="secondary">{subtitle}</ThemedText>
        )}
      </View>
      {rightComponent || (onPress && (
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      ))}
    </TouchableOpacity>
  );

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <ThemedText variant="label" color="secondary" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      <View style={[styles.sectionContent, shadows.sm]}>
        {children}
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        {/* Profile-like section */}
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <Ionicons name="shield-checkmark" size={32} color="#FFFFFF" />
          </View>
          <ThemedText variant="title" style={styles.profileName}>
            IdLocker
          </ThemedText>
          <ThemedText variant="caption" style={styles.profileSubtitle}>
            Your Secure Vault
          </ThemedText>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Security Section */}
        {renderSection('Security', (
          <>
            {renderSettingRow(
              'finger-print',
              'Authentication Method',
              hasBiometrics ? biometricName : 'Device Passcode',
            )}
            
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            
            {renderSettingRow(
              'timer-outline',
              'Auto-Lock Timeout',
              `Lock after ${formatTimeout(sliderValue)} of inactivity`,
            )}
            
            <View style={[styles.sliderContainer, { backgroundColor: colors.card }]}>
              <View style={styles.sliderLabels}>
                <ThemedText variant="caption" color="secondary">30s</ThemedText>
                <ThemedText variant="body" style={{ color: colors.accent, fontWeight: '600' }}>
                  {formatTimeout(sliderValue)}
                </ThemedText>
                <ThemedText variant="caption" color="secondary">10m</ThemedText>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={MIN_TIMEOUT}
                maximumValue={MAX_TIMEOUT}
                value={sliderValue}
                onValueChange={handleTimeoutSliderChange}
                onSlidingComplete={handleTimeoutSliderComplete}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.accent}
                step={10}
              />
            </View>
            
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            
            {renderSettingRow(
              'lock-closed-outline',
              'Lock Now',
              'Immediately lock the vault',
              undefined,
              handleLockNow,
            )}
          </>
        ))}

        {/* Appearance Section */}
        {renderSection('Appearance', (
          <>
            {renderSettingRow(
              'sunny-outline',
              'Theme',
              preference === 'system' 
                ? `System (${isDark ? 'Dark' : 'Light'})` 
                : preference === 'dark' ? 'Dark' : 'Light',
            )}
            
            <View style={[styles.themeOptions, { backgroundColor: colors.card }]}>
              {(['light', 'dark', 'system'] as const).map(theme => (
                <TouchableOpacity
                  key={theme}
                  style={[
                    styles.themeOption,
                    preference === theme && {
                      backgroundColor: colors.accent,
                    },
                  ]}
                  onPress={() => handleThemeChange(theme)}
                >
                  <Ionicons
                    name={
                      theme === 'light' ? 'sunny' :
                      theme === 'dark' ? 'moon' : 'phone-portrait-outline'
                    }
                    size={16}
                    color={preference === theme ? '#FFFFFF' : colors.text}
                  />
                  <ThemedText
                    variant="caption"
                    style={{
                      color: preference === theme ? '#FFFFFF' : colors.text,
                      marginLeft: spacing.xs,
                    }}
                  >
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ))}

        {/* About Section */}
        {renderSection('About', (
          <>
            {renderSettingRow(
              'information-circle-outline',
              'Version',
              '1.0.0',
            )}
            
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            
            {renderSettingRow(
              'shield-checkmark-outline',
              'Security Information',
              'How your data is protected',
            )}
          </>
        ))}

        {/* Security Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.primary + '15' }]}>
          <View style={styles.infoHeader}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            <ThemedText variant="subtitle" style={styles.infoTitle}>
              Security Information
            </ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <ThemedText variant="bodySmall" color="secondary" style={styles.infoText}>
              All data is encrypted and stored only on this device
            </ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <ThemedText variant="bodySmall" color="secondary" style={styles.infoText}>
              No network connections or cloud synchronization
            </ThemedText>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <ThemedText variant="bodySmall" color="secondary" style={styles.infoText}>
              Protected by {biometricName || 'device authentication'}
            </ThemedText>
          </View>
          
          <View style={[styles.warningBox, { backgroundColor: colors.warning + '20' }]}>
            <Ionicons name="warning" size={16} color={colors.warning} />
            <ThemedText variant="caption" color="secondary" style={styles.warningText}>
              Your data may be lost if you uninstall the app or change device security settings. We recommend keeping a separate backup of critical information.
            </ThemedText>
          </View>
        </View>

        {/* Danger Zone */}
        {renderSection('Danger Zone', (
          <View style={{ padding: spacing.md }}>
            <Button
              title="Clear All Data"
              onPress={handleClearData}
              variant="danger"
              icon="trash-outline"
              fullWidth
            />
            <ThemedText variant="caption" color="tertiary" style={styles.dangerHint}>
              This will permanently delete all your vault items
            </ThemedText>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText variant="caption" color="tertiary" style={styles.footerText}>
            IdLocker • Your Secure Vault
          </ThemedText>
          <ThemedText variant="caption" color="tertiary" style={styles.footerText}>
            Made with ❤️ for your privacy
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  profileSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionContent: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 60,
  },
  sliderContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  themeOptions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  infoCard: {
    padding: spacing.base,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoTitle: {
    marginLeft: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  infoText: {
    flex: 1,
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  warningText: {
    flex: 1,
    marginLeft: spacing.sm,
    lineHeight: 18,
  },
  dangerHint: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    marginBottom: spacing.xs,
  },
});
