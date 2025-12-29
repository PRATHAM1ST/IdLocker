/**
 * Edit item screen - modify existing vault item
 * Redesigned with modern styling
 * Supports custom categories and item-level custom fields
 */

import { DynamicCategoryCard } from '@/src/components';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AssetPicker } from '../../../src/components/AssetPicker';
import { Button } from '../../../src/components/Button';
import { CustomFieldEditor } from '../../../src/components/CustomFieldEditor';
import { Input, Select } from '../../../src/components/Input';
import { PageContent } from '../../../src/components/PageContent';
import { PageHeader } from '../../../src/components/PageHeader';
import { ThemedText } from '../../../src/components/ThemedText';
import { ThemedView } from '../../../src/components/ThemedView';
import { useAssets } from '../../../src/context/AssetProvider';
import { useCategories } from '../../../src/context/CategoryProvider';
import { useTheme } from '../../../src/context/ThemeProvider';
import { useVault } from '../../../src/context/VaultProvider';
import { borderRadius, shadows, spacing } from '../../../src/styles/theme';
import type {
  AssetReference,
  CustomCategory,
  CustomField,
  FieldDefinition,
  VaultItemType,
} from '../../../src/utils/types';
import { sanitizeInput, validateField } from '../../../src/utils/validation';

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { getItem, updateItem, isLoading, items } = useVault();
  const { categories, getCategoryById } = useCategories();
  const { migrateItemAssets, ensureAssetsLoaded } = useAssets();

  const item = useMemo(() => getItem(id), [getItem, id]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<VaultItemType | null>(null);
  
  const category = useMemo(
    () => (selectedCategoryId ? getCategoryById(selectedCategoryId) : null),
    [selectedCategoryId, getCategoryById],
  );
  const categoryColor = category?.color || null;

  const [label, setLabel] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [assetRefs, setAssetRefs] = useState<AssetReference[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  // Initialize form with item data and migrate legacy images if needed
  useEffect(() => {
    const initForm = async () => {
      if (item) {
        // Initialize selectedCategoryId from item.type
        if (!selectedCategoryId) {
          setSelectedCategoryId(item.type);
        }
        
        setLabel(item.label);
        setFields({ ...item.fields });
        setCustomFields(item.customFields || []);
        setAssetRefs(item.assetRefs || []);

        // Use existing assetRefs or migrate from legacy images
        if (item.assetRefs && item.assetRefs.length > 0) {
          // await ensureAssetsLoaded(item.assetRefs.map((ref) => ref.assetId));
        } else if (item.images && item.images.length > 0) {
          // Migrate legacy images to assets
          const migratedRefs = await migrateItemAssets(item);
          setAssetRefs(migratedRefs);
          if (migratedRefs.length > 0) {
            // await ensureAssetsLoaded(migratedRefs.map((ref) => ref.assetId));
          }
        }
      }
    };
    initForm();
  }, [item, migrateItemAssets, selectedCategoryId]);

  const handleFieldChange = useCallback(
    (key: string, value: string) => {
      const sanitized = sanitizeInput(value);
      setFields((prev) => ({ ...prev, [key]: sanitized }));
      setHasChanges(true);
      // Clear error when user starts typing
      if (errors[key]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[key];
          return newErrors;
        });
      }
    },
    [errors],
  );

  const handleLabelChange = useCallback(
    (value: string) => {
      setLabel(sanitizeInput(value));
      setHasChanges(true);
      if (errors.label) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.label;
          return newErrors;
        });
      }
    },
    [errors],
  );

  const handleAssetRefsChange = useCallback((newRefs: AssetReference[]) => {
    setAssetRefs(newRefs);
    setHasChanges(true);
  }, []);

  const handleCustomFieldsChange = useCallback((newCustomFields: CustomField[]) => {
    setCustomFields(newCustomFields);
    setHasChanges(true);
  }, []);

  const handleCategoryChange = useCallback(
    (newCategory: CustomCategory) => {
      if (!item) return;

      const newCategoryId = newCategory.id;
      
      // Map fields intelligently: preserve compatible fields, clear incompatible ones
      const newFields: Record<string, string> = {};
      const newCategoryFieldKeys = new Set(newCategory.fields.map((f) => f.key));
      
      // If we have a current category, preserve compatible fields
      if (category) {
        // Preserve fields that exist in both categories
        for (const key of Object.keys(fields)) {
          if (newCategoryFieldKeys.has(key)) {
            newFields[key] = fields[key];
          }
        }
      } else {
        // If no current category (initial selection), preserve all existing fields that match
        for (const key of Object.keys(fields)) {
          if (newCategoryFieldKeys.has(key)) {
            newFields[key] = fields[key];
          }
        }
      }

      // Initialize new fields from the new category as empty
      for (const fieldDef of newCategory.fields) {
        if (!(fieldDef.key in newFields)) {
          newFields[fieldDef.key] = '';
        }
      }

      setSelectedCategoryId(newCategoryId);
      setFields(newFields);
      setShowCategorySelector(false);
      setHasChanges(true);
      // Clear errors when changing category
      setErrors({});
    },
    [item, category, fields],
  );

  const handleSave = useCallback(async () => {
    if (!item || !category) return;

    // Basic validation
    const errorMap: Record<string, string> = {};

    if (!label.trim()) {
      errorMap.label = 'Label is required';
    }

    // Validate fields against category definition
    for (const fieldDef of category.fields) {
      const fieldError = validateField(fields[fieldDef.key], fieldDef);
      if (fieldError) {
        errorMap[fieldDef.key] = fieldError;
      }
    }

    if (Object.keys(errorMap).length > 0) {
      setErrors(errorMap);
      return;
    }

    setIsSaving(true);
    
    // Include type in updates if category changed
    const updates: Parameters<typeof updateItem>[1] = {
      label: label.trim(),
      fields,
      customFields: customFields.length > 0 ? customFields : undefined,
      assetRefs: assetRefs.length > 0 ? assetRefs : undefined,
    };
    
    // Only include type if it changed
    if (selectedCategoryId && selectedCategoryId !== item.type) {
      updates.type = selectedCategoryId;
    }
    
    const updatedItem = await updateItem(item.id, updates);
    setIsSaving(false);

    if (updatedItem) {
      // Small delay to ensure navigation is ready
      setTimeout(() => {
        router.back();
      }, 100);
    } else {
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    }
  }, [item, category, label, fields, customFields, assetRefs, selectedCategoryId, updateItem, router]);

  const handleCancel = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ],
      );
    } else {
      router.back();
    }
  }, [hasChanges, router]);

  // Calculate category counts for selector
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: items.length,
    };

    // Calculate counts for each category
    for (const cat of categories) {
      counts[cat.id] = items.filter((i) => i.type === cat.id).length;
    }

    return counts;
  }, [items, categories]);

  const renderTypeSelector = () => (
    <View style={styles.typeSelectorContainer}>
      <View style={styles.typeGrid}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.typeCard}
            onPress={() => handleCategoryChange(cat)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[cat.color.gradientStart, cat.color.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.typeCardGradient}
            >
              <View style={styles.typeCardDecor} />
              <View style={styles.typeIconContainer}>
                <Ionicons name={cat.icon as any} size={28} color="rgba(255,255,255,0.95)" />
              </View>
              <ThemedText variant="label" style={styles.typeLabel}>
                {cat.label}
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderField = (fieldDef: FieldDefinition) => {
    const value = fields[fieldDef.key] || '';
    const error = errors[fieldDef.key];
    const hintParts: string[] = [];
    if (fieldDef.prefix) {
      hintParts.push(`Starts with ${fieldDef.prefix}`);
    }
    if (typeof fieldDef.minLength === 'number' && typeof fieldDef.maxLength === 'number') {
      hintParts.push(`Length ${fieldDef.minLength}-${fieldDef.maxLength} chars`);
    } else if (typeof fieldDef.minLength === 'number') {
      hintParts.push(`Min length ${fieldDef.minLength}`);
    } else if (typeof fieldDef.maxLength === 'number') {
      hintParts.push(`Max length ${fieldDef.maxLength}`);
    }
    if (fieldDef.keyboardType === 'numeric') {
      if (typeof fieldDef.minValue === 'number' && typeof fieldDef.maxValue === 'number') {
        hintParts.push(`Value ${fieldDef.minValue}-${fieldDef.maxValue}`);
      } else if (typeof fieldDef.minValue === 'number') {
        hintParts.push(`Min value ${fieldDef.minValue}`);
      } else if (typeof fieldDef.maxValue === 'number') {
        hintParts.push(`Max value ${fieldDef.maxValue}`);
      }
    }
    const hint = hintParts.length ? hintParts.join(' • ') : undefined;

    // Render select for fields with options
    if (fieldDef.options || fieldDef.keyboardType === 'select') {
      return (
        <Select
          key={fieldDef.key}
          label={fieldDef.label + (fieldDef.required ? ' *' : '')}
          value={value}
          options={fieldDef.options || []}
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
        keyboardType={(fieldDef.keyboardType as any) !== 'select' ? fieldDef.keyboardType : 'default'}
        maxLength={fieldDef.maxLength}
        multiline={fieldDef.multiline}
        numberOfLines={fieldDef.multiline ? 4 : 1}
        sensitive={fieldDef.sensitive}
        error={error}
        hint={hint}
        autoCapitalize={fieldDef.sensitive ? 'none' : 'sentences'}
      />
    );
  };

  if (!item) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Edit Item', headerShown: true }} />
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
      </ThemedView>
    );
  }

  // Show category selector if no category selected or user wants to change
  if (showCategorySelector || !selectedCategoryId || !category || !categoryColor) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />

        <PageHeader
          title="Change Category"
          onBack={() => {
            if (selectedCategoryId) {
              setShowCategorySelector(false);
            } else {
              router.back();
            }
          }}
        />

        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <PageContent>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {renderTypeSelector()}
            </ScrollView>
          </PageContent>
        </KeyboardAvoidingView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <PageHeader
        title={`Edit ${category.label}`}
        onBack={handleCancel}
        gradientColors={[categoryColor.gradientStart, categoryColor.gradientEnd]}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <PageContent>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          {/* Type indicator - clickable to change category */}
          <TouchableOpacity
            style={[styles.typeIndicator, shadows.sm]}
            onPress={() => setShowCategorySelector(true)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[categoryColor.gradientStart, categoryColor.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.typeIndicatorGradient}
            >
              <View style={styles.typeIndicatorIcon}>
                <Ionicons
                  name={category.icon as any}
                  size={20}
                  color="rgba(255,255,255,0.95)"
                />
              </View>
              <ThemedText variant="label" style={styles.typeIndicatorLabel}>
                {category.label}
              </ThemedText>
              <View style={styles.changeTypeButton}>
                <ThemedText variant="caption" style={styles.changeTypeText}>
                  Change
                </ThemedText>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Label field */}
          <Input
            label="Label *"
            value={label}
            onChangeText={handleLabelChange}
            placeholder="Give this item a name"
            error={errors.label}
          />

          {/* Dynamic fields from category */}
          {category.fields.map(renderField)}

          {/* Custom fields section */}
          <CustomFieldEditor
            customFields={customFields}
            onCustomFieldsChange={handleCustomFieldsChange}
          />

          {/* Asset attachments (images, PDFs, documents) */}
          <AssetPicker assetRefs={assetRefs} onAssetRefsChange={handleAssetRefsChange} />

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
        </PageContent>
      </KeyboardAvoidingView>
    </ThemedView>
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
  typeSelectorContainer: {
    paddingTop: spacing.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeCard: {
    width: '48%',
    aspectRatio: 1.2,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  typeCardGradient: {
    flex: 1,
    padding: spacing.lg,
    position: 'relative',
  },
  typeCardDecor: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  typeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  typeLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
  },
  typeIndicator: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  typeIndicatorGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  typeIndicatorIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  typeIndicatorLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },
  changeTypeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  changeTypeText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  saveContainer: {
    marginTop: spacing.lg,
  },
});
