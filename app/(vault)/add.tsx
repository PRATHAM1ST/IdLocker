/**
 * Add item screen - dynamic form based on item type
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeThemedView } from '../../src/components/ThemedView';
import { ThemedText } from '../../src/components/ThemedText';
import { Input, Select } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { ImagePicker } from '../../src/components/ImagePicker';
import { useTheme } from '../../src/context/ThemeProvider';
import { useVault } from '../../src/context/VaultProvider';
import { spacing, borderRadius, getCategoryColor } from '../../src/styles/theme';
import { ITEM_TYPE_CONFIGS, VAULT_ITEM_TYPES } from '../../src/utils/constants';
import { validateVaultItem, sanitizeInput } from '../../src/utils/validation';
import type { VaultItemType, FieldDefinition, ImageAttachment } from '../../src/utils/types';

export default function AddItemScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: VaultItemType }>();
  const { colors, isDark } = useTheme();
  const { addItem } = useVault();

  const [selectedType, setSelectedType] = useState<VaultItemType | null>(
    params.type || null
  );
  const [label, setLabel] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const config = selectedType ? ITEM_TYPE_CONFIGS[selectedType] : null;
  const categoryColor = selectedType ? getCategoryColor(selectedType, isDark) : null;

  const handleTypeSelect = useCallback((type: VaultItemType) => {
    setSelectedType(type);
    setLabel('');
    setFields({});
    setImages([]);
    setErrors({});
  }, []);

  const handleFieldChange = useCallback((key: string, value: string) => {
    const sanitized = sanitizeInput(value);
    setFields(prev => ({ ...prev, [key]: sanitized }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  }, [errors]);

  const handleSave = useCallback(async () => {
    if (!selectedType) return;

    // Validate
    const validation = validateVaultItem(selectedType, label, fields);
    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      for (const error of validation.errors) {
        errorMap[error.field] = error.message;
      }
      setErrors(errorMap);
      return;
    }

    setIsSaving(true);
    
    // Debug: Log what we're saving
    console.log('[AddItem] Saving item with images:', {
      type: selectedType,
      label: label.trim(),
      imageCount: images.length,
      images: images,
    });
    
    const newItem = await addItem({
      type: selectedType,
      label: label.trim(),
      fields,
      images: images.length > 0 ? images : undefined,
    });
    
    // Debug: Log the saved item
    console.log('[AddItem] Saved item:', newItem);
    
    setIsSaving(false);

    if (newItem) {
      router.back();
    } else {
      Alert.alert('Error', 'Failed to save item. Please try again.');
    }
  }, [selectedType, label, fields, addItem, router]);

  const renderTypeSelector = () => (
    <View style={styles.typeSelectorContainer}>
      <ThemedText variant="subtitle" style={styles.sectionTitle}>
        What would you like to add?
      </ThemedText>
      
      <View style={styles.typeGrid}>
        {VAULT_ITEM_TYPES.map(({ type, label: typeLabel, icon }) => {
          const color = getCategoryColor(type, isDark);
          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeCard,
                { backgroundColor: colors.card },
              ]}
              onPress={() => handleTypeSelect(type)}
              activeOpacity={0.7}
            >
              <View style={[styles.typeIconContainer, { backgroundColor: color.bg }]}>
                <Ionicons name={icon as any} size={28} color={color.icon} />
              </View>
              <ThemedText variant="label" style={styles.typeLabel}>
                {typeLabel}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

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

  const renderForm = () => {
    if (!config || !categoryColor) return null;

    return (
      <View style={styles.formContainer}>
        {/* Type indicator */}
        <View style={[styles.typeIndicator, { backgroundColor: colors.card }]}>
          <View style={[styles.typeIconSmall, { backgroundColor: categoryColor.bg }]}>
            <Ionicons name={config.icon as any} size={20} color={categoryColor.icon} />
          </View>
          <ThemedText variant="label">{config.label}</ThemedText>
          <TouchableOpacity 
            onPress={() => setSelectedType(null)}
            style={styles.changeTypeButton}
          >
            <ThemedText variant="caption" color="accent">Change</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Label field */}
        <Input
          label="Label *"
          value={label}
          onChangeText={(val) => {
            setLabel(sanitizeInput(val));
            if (errors.label) {
              setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.label;
                return newErrors;
              });
            }
          }}
          placeholder="Give this item a name"
          error={errors.label}
        />

        {/* Dynamic fields */}
        {config.fields.map(renderField)}

        {/* Image attachments */}
        <ImagePicker
          images={images}
          onImagesChange={setImages}
        />

        {/* Save button */}
        <View style={styles.saveContainer}>
          <Button
            title={isSaving ? 'Saving...' : 'Save Item'}
            onPress={handleSave}
            icon="checkmark"
            fullWidth
            size="lg"
            loading={isSaving}
            disabled={isSaving}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeThemedView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: selectedType ? `Add ${config?.label}` : 'Add Item',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
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
          {!selectedType ? renderTypeSelector() : renderForm()}
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
  typeSelectorContainer: {
    paddingTop: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeCard: {
    width: '48%',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  typeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  typeLabel: {
    textAlign: 'center',
  },
  formContainer: {
    paddingTop: spacing.sm,
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
  changeTypeButton: {
    marginLeft: 'auto',
    paddingHorizontal: spacing.sm,
  },
  saveContainer: {
    marginTop: spacing.lg,
  },
});

