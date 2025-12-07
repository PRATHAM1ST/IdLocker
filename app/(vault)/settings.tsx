/**
 * Settings screen - fully scrollable with profile header
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '../../src/components/ThemedView';
import { ThemedText } from '../../src/components/ThemedText';
import { Button } from '../../src/components/Button';
import { useTheme } from '../../src/context/ThemeProvider';
import { useAuthLock, getBiometricTypeName } from '../../src/context/AuthLockProvider';
import { useVault } from '../../src/context/VaultProvider';
import { useCategories } from '../../src/context/CategoryProvider';
import { useAssets } from '../../src/context/AssetProvider';
import { loadSettings, clearVault } from '../../src/storage/vaultStorage';
import { createBackupFile, importBackupFromJson } from '../../src/storage/backupStorage';
import { spacing, borderRadius, shadows, layout } from '../../src/styles/theme';
import type { AppSettings } from '../../src/utils/types';
import { router } from 'expo-router';

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
  const { refreshVault } = useVault();
  const { refreshCategories } = useCategories();
  const { refreshAssets } = useAssets();

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [sliderValue, setSliderValue] = useState(autoLockTimeout);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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

  const handleTimeoutSliderComplete = useCallback(
    async (value: number) => {
      // Round to nearest 10 seconds
      const rounded = Math.round(value / 10) * 10;
      await setAutoLockTimeout(rounded);
    },
    [setAutoLockTimeout],
  );

  const handleThemeChange = useCallback(
    async (theme: AppSettings['theme']) => {
      await setThemePreference(theme);
    },
    [setThemePreference],
  );

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
      ],
    );
  }, []);

  const handleExportData = useCallback(async () => {
    try {
      setIsExporting(true);
      const { uri, filename, summary } = await createBackupFile();
      const summaryLine = `${summary.items} items • ${summary.assets} attachments`;
      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/json',
          dialogTitle: 'Share IdLocker Backup',
        });
        try {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        } catch {
          // Cache cleanup best-effort; ignore failures.
        }
        Alert.alert('Backup Ready', `${filename}\n${summaryLine}`);
      } else {
        Alert.alert(
          'Backup Saved Locally',
          `${filename}\n${summaryLine}\n\nSaved at:\n${uri}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to export backup.';
      Alert.alert('Export Failed', message);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleImportData = useCallback(async () => {
    try {
      setIsImporting(true);
      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (pickerResult.canceled) {
        return;
      }

      const file = pickerResult.assets?.[0];
      if (!file?.uri) {
        throw new Error('Unable to read the selected file.');
      }

      const content = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const { summary, settings: importedSettings } = await importBackupFromJson(content);

      await Promise.all([refreshVault(), refreshCategories(), refreshAssets()]);
      await setAutoLockTimeout(importedSettings.autoLockTimeout);
      await setThemePreference(importedSettings.theme);
      setSettings(importedSettings);
      setSliderValue(importedSettings.autoLockTimeout);

      Alert.alert(
        'Import Complete',
        `Restored ${summary.items} items with ${summary.assets} attachments.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to import backup.';
      Alert.alert('Import Failed', message);
    } finally {
      setIsImporting(false);
    }
  }, [
    refreshVault,
    refreshCategories,
    refreshAssets,
    setAutoLockTimeout,
    setThemePreference,
    setSliderValue,
    setSettings,
  ]);

  const biometricName = getBiometricTypeName(biometricType);

  const renderSettingRow = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle?: string,
    rightComponent?: React.ReactNode,
    onPress?: () => void,
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
          <ThemedText variant="caption" color="secondary">
            {subtitle}
          </ThemedText>
        )}
      </View>
      {rightComponent ||
        (onPress && <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />)}
    </TouchableOpacity>
  );

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <ThemedText variant="label" color="secondary" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      <View style={[styles.sectionContent, shadows.sm]}>{children}</View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: layout.tabBarHeight + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - scrolls with content */}
        <LinearGradient
          colors={[colors.headerGradientStart, colors.headerGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <ThemedText variant="title" style={styles.headerTitle}>
              Settings
            </ThemedText>
            <View style={{ width: 40 }} />
          </View>
          {/* Profile-like section */}
          {/* <View style={styles.profileSection}>
						<View style={styles.profileAvatar}>
							<Ionicons
								name="shield-checkmark"
								size={32}
								color="#FFFFFF"
							/>
						</View>
						<ThemedText variant="title" style={styles.profileName}>
							IdLocker
						</ThemedText>
						<ThemedText
							variant="caption"
							style={styles.profileSubtitle}
						>
							Your Secure Vault
						</ThemedText>
					</View> */}
        </LinearGradient>

        {/* Main Content */}
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Security Section */}
          {renderSection(
            'Security',
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
                  <ThemedText variant="caption" color="secondary">
                    30s
                  </ThemedText>
                  <ThemedText
                    variant="body"
                    style={{
                      color: colors.accent,
                      fontWeight: '600',
                    }}
                  >
                    {formatTimeout(sliderValue)}
                  </ThemedText>
                  <ThemedText variant="caption" color="secondary">
                    10m
                  </ThemedText>
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
            </>,
          )}

          {renderSection(
            'Backup & Restore',
            <View style={[styles.backupCard, { backgroundColor: colors.backgroundSecondary }]}>
              <ThemedText variant="bodySmall" color="secondary" style={styles.backupDescription}>
                Create an offline JSON backup that bundles every vault item and attachment, or
                restore from a previous export.
              </ThemedText>
              <Button
                title="Export Backup"
                onPress={handleExportData}
                icon="download-outline"
                loading={isExporting}
                fullWidth
              />
              <Button
                title="Import Backup"
                onPress={handleImportData}
                variant="secondary"
                icon="cloud-upload-outline"
                loading={isImporting}
                fullWidth
              />
              <ThemedText variant="caption" color="tertiary" style={styles.backupHint}>
                Keep this file safe—anyone with it can read your vault contents. Assets are
                embedded directly in the JSON.
              </ThemedText>
            </View>,
          )}

          {/* Appearance Section */}
          {renderSection(
            'Appearance',
            <>
              {renderSettingRow(
                'sunny-outline',
                'Theme',
                preference === 'system'
                  ? `System (${isDark ? 'Dark' : 'Light'})`
                  : preference === 'dark'
                    ? 'Dark'
                    : 'Light',
              )}

              <View style={[styles.themeOptions, { backgroundColor: colors.card }]}>
                {(['light', 'dark', 'system'] as const).map((theme) => (
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
                        theme === 'light'
                          ? 'sunny'
                          : theme === 'dark'
                            ? 'moon'
                            : 'phone-portrait-outline'
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
            </>,
          )}

          {/* About Section */}
          {renderSection(
            'About',
            <>
              {renderSettingRow('information-circle-outline', 'Version', '0.0.2')}

              <View style={[styles.separator, { backgroundColor: colors.border }]} />

              {renderSettingRow(
                'shield-checkmark-outline',
                'Security Information',
                'How your data is protected',
              )}
            </>,
          )}

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
                Your data may be lost if you uninstall the app or change device security settings.
                We recommend keeping a separate backup of critical information.
              </ThemedText>
            </View>
          </View>

          {/* Danger Zone */}
          {renderSection(
            'Danger Zone',
            <View style={{ padding: spacing.base }}>
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
            </View>,
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <ThemedText variant="caption" color="tertiary" style={styles.footerText}>
              IdLocker • Your Secure Vault
            </ThemedText>
            <ThemedText variant="caption" color="tertiary" style={styles.footerText}>
              Made with love for your privacy
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingBottom: spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
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
  content: {
    flex: 1,
    marginTop: -spacing.md,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.base,
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
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
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
    paddingHorizontal: spacing.base,
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
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  infoCard: {
    padding: spacing.base,
    borderRadius: borderRadius.lg,
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
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  warningText: {
    flex: 1,
    marginLeft: spacing.sm,
    lineHeight: 18,
  },
  backupCard: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  backupDescription: {
    marginBottom: spacing.sm,
  },
  backupHint: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  dangerHint: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  footerText: {
    marginBottom: spacing.xs,
  },
});
