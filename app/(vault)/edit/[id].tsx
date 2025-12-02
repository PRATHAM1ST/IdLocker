/**
 * Edit item screen - modify existing vault item
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeThemedView } from '../../../src/components/ThemedView';
import { ThemedText } from '../../../src/components/ThemedText';
import { Input, Select } from '../../../src/components/Input';
import { Button } from '../../../src/components/Button';
import { ImagePicker } from '../../../src/components/ImagePicker';
import { useTheme } from '../../../src/context/ThemeProvider';
import { useVault } from '../../../src/context/VaultProvider';
import { spacing, borderRadius, getCategoryColor } from '../../../src/styles/theme';
import { ITEM_TYPE_CONFIGS } from '../../../src/utils/constants';
import { validateVaultItem, sanitizeInput } from '../../../src/utils/validation';
import type { FieldDefinition, ImageAttachment } from '../../../src/utils/types';

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { getItem, updateItem, isLoading } = useVault();

  const item = useMemo(() => getItem(id), [getItem, id]);
  const config = item ? ITEM_TYPE_CONFIGS[item.type] : null;
  const categoryColor = item ? getCategoryColor(item.type, isDark) : null;

  const [label, setLabel] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form with item data
  useEffect(() => {
    if (item) {
      setLabel(item.label);
      setFields({ ...item.fields });
      setImages(item.images || []);
    }
  }, [item]);

  const handleFieldChange = useCallback((key: string, value: string) => {
    const sanitized = sanitizeInput(value);
    setFields(prev => ({ ...prev, [key]: sanitized }));
    setHasChanges(true);
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  }, [errors]);

  const handleLabelChange = useCallback((value: string) => {
    setLabel(sanitizeInput(value));
    setHasChanges(true);
    if (errors.label) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.label;
        return newErrors;
      });
    }
  }, [errors]);

  const handleImagesChange = useCallback((newImages: ImageAttachment[]) => {
    setImages(newImages);
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!item) return;

    // Validate
    const validation = validateVaultItem(item.type, label, fields);
    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      for (const error of validation.errors) {
        errorMap[error.field] = error.message;
      }
      setErrors(errorMap);
      return;
    }

    setIsSaving(true);
    const updatedItem = await updateItem(item.id, {
      label: label.trim(),
      fields,
      images: images.length > 0 ? images : undefined,
    });
    setIsSaving(false);

    if (updatedItem) {
      router.back();
    } else {
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    }
  }, [item, label, fields, updateItem, router]);

  const handleCancel = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  }, [hasChanges, router]);

  const renderField = (fieldDef: FieldDefinition) => {
    const value = fields[fieldDef.key] || '';
    const error = errors[fieldDef.key];

    // Render select for fields with options
    if (fieldDef.options) {
      return (
        <Select
          key={fieldDef.key}
          label={fieldDef.label + (fieldDef.required ? ' *' : '')}
          value={value}
          options={fieldDef.options}
          onValueChange={(val) => handleFieldChange(fieldDef.key, val)}
          placeholder={fieldDef.placeholder || `Select ${fieldDef.label.toLowerCase()}`}
          error={error}
        />
      );
    }

    return (
      <Input
        key={fieldDef.key}
        label={fieldDef.label + (fieldDef.required ? ' *' : '')}
        value={value}
        onChangeText={(val) => handleFieldChange(fieldDef.key, val)}
        placeholder={fieldDef.placeholder}
        keyboardType={fieldDef.keyboardType}
        maxLength={fieldDef.maxLength}
        multiline={fieldDef.multiline}
        numberOfLines={fieldDef.multiline ? 4 : 1}
        sensitive={fieldDef.sensitive}
        error={error}
        autoCapitalize={fieldDef.sensitive ? 'none' : 'sentences'}
      />
    );
  };

  if (!item || !config || !categoryColor) {
    return (
      <SafeThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Edit Item' }} />
        <View style={styles.loadingContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
              <ThemedText variant="body" color="secondary" style={styles.errorText}>
                Item not found
              </ThemedText>
              <Button title="Go Back" onPress={() => router.back()} variant="outline" />
            </>
          )}
        </View>
      </SafeThemedView>
    );
  }

  return (
    <SafeThemedView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: `Edit ${config.label}`,
          headerLeft: () => (
            <TouchableOpacity onPress={handleCancel}>
              <ThemedText variant="body" color="accent">Cancel</ThemedText>
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type indicator */}
          <View style={[styles.typeIndicator, { backgroundColor: colors.card }]}>
            <View style={[styles.typeIconSmall, { backgroundColor: categoryColor.bg }]}>
              <Ionicons name={config.icon as any} size={20} color={categoryColor.icon} />
            </View>
            <ThemedText variant="label">{config.label}</ThemedText>
          </View>

          {/* Label field */}
          <Input
            label="Label *"
            value={label}
            onChangeText={handleLabelChange}
            placeholder="Give this item a name"
            error={errors.label}
          />

          {/* Dynamic fields */}
          {config.fields.map(renderField)}

          {/* Image attachments */}
          <ImagePicker
            images={images}
            onImagesChange={handleImagesChange}
          />

          {/* Save button */}
          <View style={styles.saveContainer}>
            <Button
              title={isSaving ? 'Saving...' : 'Save Changes'}
              onPress={handleSave}
              icon="checkmark"
              fullWidth
              size="lg"
              loading={isSaving}
              disabled={isSaving || !hasChanges}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  errorText: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  typeIconSmall: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  saveContainer: {
    marginTop: spacing.lg,
  },
});

