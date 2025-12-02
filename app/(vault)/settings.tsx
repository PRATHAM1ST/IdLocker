/**
 * Settings screen - app configuration and security info
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-constants';
import { SafeThemedView } from '../../src/components/ThemedView';
import { ThemedText } from '../../src/components/ThemedText';
import { Button } from '../../src/components/Button';
import { useTheme } from '../../src/context/ThemeProvider';
import { useAuthLock, getBiometricTypeName } from '../../src/context/AuthLockProvider';
import { loadSettings, updateSettings, clearVault } from '../../src/storage/vaultStorage';
import { spacing, borderRadius } from '../../src/styles/theme';
import { AUTO_LOCK_OPTIONS } from '../../src/utils/constants';
import type { AppSettings } from '../../src/utils/types';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, preference, setThemePreference } = useTheme();
  const { lock, biometricType, hasBiometrics, autoLockTimeout } = useAuthLock();

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [selectedTimeout, setSelectedTimeout] = useState(autoLockTimeout);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  const handleTimeoutChange = useCallback(async (timeout: number) => {
    setSelectedTimeout(timeout);
    await updateSettings({ autoLockTimeout: timeout });
  }, []);

  const handleThemeChange = useCallback(async (theme: AppSettings['theme']) => {
    await setThemePreference(theme);
  }, [setThemePreference]);

  const handleLockNow = useCallback(() => {
    lock();
    router.replace('/lock' as any);
  }, [lock, router]);

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
      <View style={[styles.sectionContent, { borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );

  return (
    <SafeThemedView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Settings' }} />

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
            
            <View style={styles.separator} />
            
            {renderSettingRow(
              'timer-outline',
              'Auto-Lock Timeout',
              `Lock after ${AUTO_LOCK_OPTIONS.find(o => o.value === selectedTimeout)?.label || '1 minute'}`,
            )}
            
            <View style={[styles.timeoutOptions, { backgroundColor: colors.card }]}>
              {AUTO_LOCK_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.timeoutOption,
                    selectedTimeout === option.value && {
                      backgroundColor: colors.primary,
                    },
                  ]}
                  onPress={() => handleTimeoutChange(option.value)}
                >
                  <ThemedText
                    variant="caption"
                    style={{
                      color: selectedTimeout === option.value ? '#FFFFFF' : colors.text,
                    }}
                  >
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.separator} />
            
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
                      backgroundColor: colors.primary,
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
            
            <View style={styles.separator} />
            
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
    </SafeThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  timeoutOptions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  timeoutOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
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

