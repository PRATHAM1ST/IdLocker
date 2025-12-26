/**
 * Category edit/create screen
 * Edit category name, icon, color, and manage fields
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../../src/components/Button';
import { Input } from '../../../src/components/Input';
import { PageContent } from '../../../src/components/PageContent';
import { PageHeader } from '../../../src/components/PageHeader';
import { ThemedText } from '../../../src/components/ThemedText';
import { ThemedView } from '../../../src/components/ThemedView';
import { useCategories } from '../../../src/context/CategoryProvider';
import { useTheme } from '../../../src/context/ThemeProvider';
import { borderRadius, shadows, spacing } from '../../../src/styles/theme';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../../src/utils/constants';
import type { CategoryColor, FieldDefinition } from '../../../src/utils/types';

type KeyboardType = 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'select';

interface FieldFormState {
  label: string;
  placeholder: string;
  required: boolean;
  sensitive: boolean;
  multiline: boolean;
  keyboardType: KeyboardType;
  minLength: string;
  maxLength: string;
  minValue: string;
  maxValue: string;
  prefix: string;
  options: { value: string; label: string }[];
}

const KEYBOARD_TYPE_OPTIONS: { value: KeyboardType; label: string }[] = [
  { value: 'default', label: 'Text' },
  { value: 'numeric', label: 'Number' },
  { value: 'email-address', label: 'Email' },
  { value: 'phone-pad', label: 'Phone' },
  { value: 'select' as KeyboardType, label: 'Select' },
];

const createEmptyFieldForm = (): FieldFormState => ({
  label: '',
  placeholder: '',
  required: false,
  sensitive: false,
  multiline: false,
  keyboardType: 'default',
  minLength: '',
  maxLength: '',
  minValue: '',
  maxValue: '',
  prefix: '',
  options: [],
});

export default function CategoryEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { addCategory, updateCategory, getCategoryById, getDefaultColor } = useCategories();

  const isNew = id === 'new';
  const existingCategory = isNew ? null : getCategoryById(id);

  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('folder-outline');
  const [color, setColor] = useState<CategoryColor>(getDefaultColor());
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [previewField, setPreviewField] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Modal states
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [fieldForm, setFieldForm] = useState<FieldFormState>(() => createEmptyFieldForm());
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);

  const resetFieldForm = useCallback(() => {
    setFieldForm(createEmptyFieldForm());
    setEditingFieldKey(null);
  }, []);

  // Initialize form with existing category data
  useEffect(() => {
    if (existingCategory) {
      setLabel(existingCategory.label);
      setIcon(existingCategory.icon);
      setColor(existingCategory.color);
      setFields([...existingCategory.fields]);
      setPreviewField(existingCategory.previewField);
    }
  }, [existingCategory]);

  const handleSave = useCallback(async () => {
    if (!label.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    setIsSaving(true);

    if (isNew) {
      const newCategory = await addCategory({
        label: label.trim(),
        icon,
        color,
        fields,
        previewField,
        isPreset: false,
      });

      if (newCategory) {
        router.back();
      } else {
        Alert.alert('Error', 'Failed to create category');
      }
    } else {
      const updated = await updateCategory(id, {
        label: label.trim(),
        icon,
        color,
        fields,
        previewField,
      });

      if (updated) {
        router.back();
      } else {
        Alert.alert('Error', 'Failed to update category');
      }
    }

    setIsSaving(false);
  }, [isNew, id, label, icon, color, fields, previewField, addCategory, updateCategory, router]);

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

  const handleEditField = useCallback((field: FieldDefinition) => {
    setFieldForm({
      label: field.label,
      placeholder: field.placeholder || '',
      required: field.required || false,
      sensitive: field.sensitive || false,
      multiline: field.multiline || false,
      keyboardType: field.keyboardType || 'default',
      minLength: typeof field.minLength === 'number' ? String(field.minLength) : '',
      maxLength: typeof field.maxLength === 'number' ? String(field.maxLength) : '',
      minValue: typeof field.minValue === 'number' ? String(field.minValue) : '',
      maxValue: typeof field.maxValue === 'number' ? String(field.maxValue) : '',
      prefix: field.prefix || '',
      options: field.options || [],
    });
    setEditingFieldKey(field.key);
  }, []);

  const handleSaveField = useCallback(() => {
    const trimmedLabel = fieldForm.label.trim();
    if (!trimmedLabel) {
      Alert.alert('Error', 'Please enter a field label');
      return;
    }

    const placeholderValue = fieldForm.placeholder.trim();

    const minLengthInput = fieldForm.minLength.trim();
    const maxLengthInput = fieldForm.maxLength.trim();
    const minValueInput = fieldForm.minValue.trim();
    const maxValueInput = fieldForm.maxValue.trim();

    const minLengthValue = minLengthInput ? parseInt(minLengthInput, 10) : undefined;
    if (minLengthValue !== undefined && (Number.isNaN(minLengthValue) || minLengthValue < 0)) {
      Alert.alert('Error', 'Min length must be a non-negative number');
      return;
    }

    const maxLengthValue = maxLengthInput ? parseInt(maxLengthInput, 10) : undefined;
    if (maxLengthValue !== undefined && (Number.isNaN(maxLengthValue) || maxLengthValue <= 0)) {
      Alert.alert('Error', 'Max length must be a positive number');
      return;
    }
    if (
      minLengthValue !== undefined &&
      maxLengthValue !== undefined &&
      minLengthValue > maxLengthValue
    ) {
      Alert.alert('Error', 'Min length cannot be greater than max length');
      return;
    }

    const minValueNumber = minValueInput ? Number(minValueInput) : undefined;
    if (minValueNumber !== undefined && Number.isNaN(minValueNumber)) {
      Alert.alert('Error', 'Min value must be a valid number');
      return;
    }

    const maxValueNumber = maxValueInput ? Number(maxValueInput) : undefined;

    if (maxValueNumber !== undefined && Number.isNaN(maxValueNumber)) {
      Alert.alert('Error', 'Max value must be a valid number');
      return;
    }

    if (
      fieldForm.keyboardType === 'numeric' &&
      minValueNumber !== undefined &&
      maxValueNumber !== undefined &&
      minValueNumber > maxValueNumber
    ) {
      Alert.alert('Error', 'Min value cannot be greater than max value');
      return;
    }

    const prefixValue = fieldForm.prefix.trim();
    
    // Validate dropdown options
    if (fieldForm.keyboardType === 'select') {
      if (fieldForm.options.length === 0) {
        Alert.alert('Error', 'Please add at least one option for the dropdown field');
        return;
      }
      
      // Check if all options have both value and label
      const hasInvalidOption = fieldForm.options.some(opt => !opt.value.trim() || !opt.label.trim());
      if (hasInvalidOption) {
        Alert.alert('Error', 'All dropdown options must have both value and label');
        return;
      }
    }
    
    const key =
      editingFieldKey ||
      trimmedLabel
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

    const payload: FieldDefinition = {
      key,
      label: trimmedLabel,
      placeholder: placeholderValue ? placeholderValue : undefined,
      required: fieldForm.required,
      sensitive: fieldForm.sensitive,
      multiline: fieldForm.multiline,
      keyboardType: fieldForm.keyboardType !== 'default' ? fieldForm.keyboardType : undefined,
      minLength: minLengthValue,
      maxLength: maxLengthValue,
      minValue: fieldForm.keyboardType === 'numeric' ? minValueNumber : undefined,
      maxValue: fieldForm.keyboardType === 'numeric' ? maxValueNumber : undefined,
      prefix: fieldForm.keyboardType === 'phone-pad' && prefixValue ? prefixValue : undefined,
      options: fieldForm.options.length > 0 ? fieldForm.options : undefined,
    };

    setFields((prev) =>
      editingFieldKey
        ? prev.map((f) => (f.key === editingFieldKey ? payload : f))
        : [...prev, payload],
    );
    resetFieldForm();
    setHasChanges(true);
  }, [editingFieldKey, fieldForm, resetFieldForm]);

  const handleDeleteField = useCallback(
    (field: FieldDefinition) => {
      Alert.alert('Delete Field', `Are you sure you want to delete "${field.label}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setFields((prev) => prev.filter((f) => f.key !== field.key));
            if (editingFieldKey === field.key) {
              resetFieldForm();
            }
            setHasChanges(true);
          },
        },
      ]);
    },
    [editingFieldKey, resetFieldForm],
  );

  const handleMoveField = useCallback((index: number, direction: 'up' | 'down') => {
    setFields((prev) => {
      const newFields = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newFields.length) return prev;
      [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
      return newFields;
    });
    setHasChanges(true);
  }, []);

  const isEditingField = Boolean(editingFieldKey);
  const canSubmitField = fieldForm.label.trim().length > 0;
  const supportsValueLimits = fieldForm.keyboardType === 'numeric';
  const supportsPrefix = fieldForm.keyboardType === 'phone-pad';

  const renderFieldItem = (field: FieldDefinition, index: number) => {
    const isEditing = editingFieldKey === field.key;
    return (
      <View
        key={field.key}
        style={[
          styles.fieldCard,
          { backgroundColor: colors.card },
          isEditing && { borderColor: colors.primary },
          shadows.sm,
        ]}
      >
        <View style={styles.fieldInfo}>
          <View style={styles.fieldHeader}>
            <ThemedText variant="body" style={styles.fieldLabel}>
              {field.label}
            </ThemedText>
            {field.required && (
              <View style={[styles.fieldBadge, { backgroundColor: colors.primary + '20' }]}>
                <ThemedText variant="caption" style={{ color: colors.primary }}>
                  Required
                </ThemedText>
              </View>
            )}
            {field.sensitive && (
              <View style={[styles.fieldBadge, { backgroundColor: colors.warning + '20' }]}>
                <ThemedText variant="caption" style={{ color: colors.warning }}>
                  Sensitive
                </ThemedText>
              </View>
            )}
          </View>
          {field.placeholder && (
            <ThemedText variant="caption" color="tertiary">
              {field.placeholder}
            </ThemedText>
          )}
        </View>

        <View style={styles.fieldActions}>
          <TouchableOpacity
            style={[styles.fieldActionBtn, { opacity: index === 0 ? 0.3 : 1 }]}
            onPress={() => handleMoveField(index, 'up')}
            disabled={index === 0}
          >
            <Ionicons name="chevron-up" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fieldActionBtn, { opacity: index === fields.length - 1 ? 0.3 : 1 }]}
            onPress={() => handleMoveField(index, 'down')}
            disabled={index === fields.length - 1}
          >
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.fieldActionBtn} onPress={() => handleEditField(field)}>
            <Ionicons name="pencil" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.fieldActionBtn} onPress={() => handleDeleteField(field)}>
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <PageHeader
        title={isNew ? 'New Category' : 'Edit Category'}
        onBack={handleCancel}
        gradientColors={[color.gradientStart, color.gradientEnd]}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <PageContent>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Preview card */}
            <View style={[styles.previewCard, shadows.md]}>
              <LinearGradient
                colors={[color.gradientStart, color.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.previewGradient}
              >
                <View style={styles.previewIcon}>
                  <Ionicons name={icon as any} size={32} color="rgba(255,255,255,0.95)" />
                </View>
                <ThemedText variant="subtitle" style={styles.previewLabel}>
                  {label || 'Category Name'}
                </ThemedText>
              </LinearGradient>
            </View>

            {/* Basic info */}
            <Input
              label="Category Name *"
              value={label}
              onChangeText={(val) => {
                setLabel(val);
                setHasChanges(true);
              }}
              placeholder="e.g., Medical Records"
            />

            {/* Icon picker */}
            <View style={styles.pickerSection}>
              <ThemedText variant="label" color="secondary" style={styles.pickerLabel}>
                Icon
              </ThemedText>
              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: colors.card }]}
                onPress={() => setShowIconPicker(true)}
              >
                <View style={[styles.pickerPreview, { backgroundColor: color.bg }]}>
                  <Ionicons name={icon as any} size={24} color={color.icon} />
                </View>
                <ThemedText variant="body" style={styles.pickerText}>
                  Change Icon
                </ThemedText>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            {/* Color picker */}
            <View style={styles.pickerSection}>
              <ThemedText variant="label" color="secondary" style={styles.pickerLabel}>
                Color
              </ThemedText>
              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: colors.card }]}
                onPress={() => setShowColorPicker(true)}
              >
                <LinearGradient
                  colors={[color.gradientStart, color.gradientEnd]}
                  style={styles.colorPreview}
                />
                <ThemedText variant="body" style={styles.pickerText}>
                  Change Color
                </ThemedText>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            {/* Fields section */}
            <View style={styles.fieldsSection}>
              <View style={styles.fieldsSectionHeader}>
                <ThemedText variant="subtitle">Fields</ThemedText>
              </View>

              {fields.length === 0 ? (
                <View style={[styles.emptyFields, { backgroundColor: colors.backgroundTertiary }]}>
                  <Ionicons name="list-outline" size={32} color={colors.textTertiary} />
                  <ThemedText variant="bodySmall" color="tertiary" style={styles.emptyText}>
                    No fields yet. Add fields to define what data this category stores.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.fieldsList}>{fields.map(renderFieldItem)}</View>
              )}

              <View style={[styles.fieldEditorCard, { backgroundColor: colors.card }, shadows.sm]}>
                <ThemedText variant="label" style={styles.fieldEditorTitle}>
                  {isEditingField ? 'Edit Field' : 'Add Field'}
                </ThemedText>

                <Input
                  label="Field Label *"
                  value={fieldForm.label}
                  onChangeText={(text) => setFieldForm((prev) => ({ ...prev, label: text }))}
                  placeholder="e.g., Account Number"
                />

                <Input
                  label="Placeholder"
                  value={fieldForm.placeholder}
                  onChangeText={(text) => setFieldForm((prev) => ({ ...prev, placeholder: text }))}
                  placeholder="Hint text shown when empty"
                />

                <ThemedText variant="label" color="secondary" style={styles.optionsLabel}>
                  Field Type
                </ThemedText>
                <View style={styles.keyboardTypeRow}>
                  {KEYBOARD_TYPE_OPTIONS.map(({ value, label: typeLabel }) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.keyboardTypeOption,
                        { backgroundColor: colors.card },
                        fieldForm.keyboardType === value && { backgroundColor: colors.primary },
                      ]}
                      onPress={() =>
                        setFieldForm((prev) => {
                          const updates: Partial<FieldFormState> = { keyboardType: value };
                          if (value !== 'numeric') {
                            updates.minValue = '';
                            updates.maxValue = '';
                          }
                          if (value !== 'phone-pad') {
                            updates.prefix = '';
                          }
                          if (value !== 'select') {
                            updates.options = [];
                          }
                          return { ...prev, ...updates } as FieldFormState;
                        })
                      }
                    >
                      <ThemedText
                        variant="caption"
                        style={{
                          color: fieldForm.keyboardType === value ? '#FFFFFF' : colors.text,
                        }}
                      >
                        {typeLabel}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>

                {supportsPrefix && (
                  <Input
                    label="Phone Prefix"
                    value={fieldForm.prefix}
                    onChangeText={(text) => setFieldForm((prev) => ({ ...prev, prefix: text }))}
                    placeholder="e.g., +91"
                  />
                )}

                {fieldForm.keyboardType === 'select' && (
                  <>
                    <ThemedText variant="label" color="secondary" style={styles.optionsLabel}>
                      Dropdown Options *
                    </ThemedText>
                    <View style={[styles.dropdownOptionsContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                      {fieldForm.options.map((option, index) => (
                        <View key={index} style={[styles.dropdownOptionRow, { backgroundColor: colors.card }]}>
                          <View style={styles.dropdownOptionInputs}>
                            <Input
                              label="Value"
                              value={option.value}
                              onChangeText={(text) => {
                                const newOptions = [...fieldForm.options];
                                newOptions[index] = { ...newOptions[index], value: text };
                                setFieldForm((prev) => ({ ...prev, options: newOptions }));
                              }}
                              placeholder="value"
                              containerStyle={styles.dropdownOptionInput}
                            />
                            <Input
                              label="Label"
                              value={option.label}
                              onChangeText={(text) => {
                                const newOptions = [...fieldForm.options];
                                newOptions[index] = { ...newOptions[index], label: text };
                                setFieldForm((prev) => ({ ...prev, options: newOptions }));
                              }}
                              placeholder="Display text"
                              containerStyle={styles.dropdownOptionInput}
                            />
                          </View>
                          <TouchableOpacity
                            style={[styles.deleteOptionButton, { backgroundColor: colors.error + '20' }]}
                            onPress={() => {
                              const newOptions = fieldForm.options.filter((_, i) => i !== index);
                              setFieldForm((prev) => ({ ...prev, options: newOptions }));
                            }}
                          >
                            <Ionicons name="trash-outline" size={18} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity
                        style={[styles.addOptionButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                        onPress={() => {
                          setFieldForm((prev) => ({
                            ...prev,
                            options: [...prev.options, { value: '', label: '' }],
                          }));
                        }}
                      >
                        <Ionicons name="add" size={20} color={colors.primary} />
                        <ThemedText variant="bodySmall" style={{ color: colors.primary, marginLeft: spacing.xs }}>
                          Add Option
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                <ThemedText variant="label" color="secondary" style={styles.optionsLabel}>
                  Length Limits
                </ThemedText>
                <View style={styles.constraintRow}>
                  <Input
                    label="Min Length"
                    value={fieldForm.minLength}
                    onChangeText={(text) => setFieldForm((prev) => ({ ...prev, minLength: text }))}
                    keyboardType="numeric"
                    placeholder="e.g., 6"
                    containerStyle={styles.constraintInput}
                  />
                  <Input
                    label="Max Length"
                    value={fieldForm.maxLength}
                    onChangeText={(text) => setFieldForm((prev) => ({ ...prev, maxLength: text }))}
                    keyboardType="numeric"
                    placeholder="e.g., 12"
                    containerStyle={styles.constraintInput}
                  />
                </View>

                {supportsValueLimits && (
                  <>
                    <ThemedText variant="label" color="secondary" style={styles.optionsLabel}>
                      Value Range
                    </ThemedText>
                    <View style={styles.constraintRow}>
                      <Input
                        label="Min Value"
                        value={fieldForm.minValue}
                        onChangeText={(text) =>
                          setFieldForm((prev) => ({ ...prev, minValue: text }))
                        }
                        keyboardType="numeric"
                        placeholder="e.g., 0"
                        containerStyle={styles.constraintInput}
                      />
                      <Input
                        label="Max Value"
                        value={fieldForm.maxValue}
                        onChangeText={(text) =>
                          setFieldForm((prev) => ({ ...prev, maxValue: text }))
                        }
                        keyboardType="numeric"
                        placeholder="e.g., 9999"
                        containerStyle={styles.constraintInput}
                      />
                    </View>
                  </>
                )}

                <ThemedText variant="label" color="secondary" style={styles.optionsLabel}>
                  Options
                </ThemedText>
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.optionToggle,
                      { backgroundColor: colors.card },
                      fieldForm.required && {
                        backgroundColor: colors.primary + '20',
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setFieldForm((prev) => ({ ...prev, required: !prev.required }))}
                  >
                    <Ionicons
                      name={fieldForm.required ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={fieldForm.required ? colors.primary : colors.textSecondary}
                    />
                    <ThemedText variant="bodySmall">Required</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.optionToggle,
                      { backgroundColor: colors.card },
                      fieldForm.sensitive && {
                        backgroundColor: colors.warning + '20',
                        borderColor: colors.warning,
                      },
                    ]}
                    onPress={() =>
                      setFieldForm((prev) => ({ ...prev, sensitive: !prev.sensitive }))
                    }
                  >
                    <Ionicons
                      name={fieldForm.sensitive ? 'eye-off' : 'eye-outline'}
                      size={20}
                      color={fieldForm.sensitive ? colors.warning : colors.textSecondary}
                    />
                    <ThemedText variant="bodySmall">Sensitive</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.optionToggle,
                      { backgroundColor: colors.card },
                      fieldForm.multiline && {
                        backgroundColor: colors.accent + '20',
                        borderColor: colors.accent,
                      },
                    ]}
                    onPress={() =>
                      setFieldForm((prev) => ({ ...prev, multiline: !prev.multiline }))
                    }
                  >
                    <Ionicons
                      name={fieldForm.multiline ? 'document-text' : 'document-text-outline'}
                      size={20}
                      color={fieldForm.multiline ? colors.accent : colors.textSecondary}
                    />
                    <ThemedText variant="bodySmall">Multiline</ThemedText>
                  </TouchableOpacity>
                </View>

                <View style={styles.fieldEditorActions}>
                  {isEditingField && (
                    <TouchableOpacity
                      style={[
                        styles.fieldEditorActionButton,
                        {
                          borderColor: colors.border,
                          borderWidth: 1,
                          backgroundColor: colors.background,
                        },
                      ]}
                      onPress={resetFieldForm}
                    >
                      <ThemedText variant="bodySmall" style={{ color: colors.textSecondary }}>
                        Cancel
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.fieldEditorActionButton,
                      { backgroundColor: colors.primary, opacity: canSubmitField ? 1 : 0.5 },
                    ]}
                    onPress={handleSaveField}
                    disabled={!canSubmitField}
                  >
                    <ThemedText variant="bodySmall" style={{ color: '#FFFFFF' }}>
                      {isEditingField ? 'Update Field' : 'Add Field'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Save button */}
            <View style={styles.saveContainer}>
              <Button
                title={isSaving ? 'Saving...' : isNew ? 'Create Category' : 'Save Changes'}
                onPress={handleSave}
                icon="checkmark"
                fullWidth
                size="lg"
                loading={isSaving}
                disabled={isSaving}
              />
            </View>
          </ScrollView>
        </PageContent>
      </KeyboardAvoidingView>

      {/* Icon Picker Modal */}
      <Modal
        visible={showIconPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        statusBarTranslucent={false}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowIconPicker(false)}>
              <ThemedText variant="body" style={{ color: colors.primary }}>
                Done
              </ThemedText>
            </TouchableOpacity>
            <ThemedText variant="subtitle">Choose Icon</ThemedText>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={styles.iconGrid}>
            {CATEGORY_ICONS.map((iconName) => (
              <TouchableOpacity
                key={iconName}
                style={[
                  styles.iconOption,
                  { backgroundColor: colors.card },
                  icon === iconName && {
                    backgroundColor: color.bg,
                    borderColor: color.icon,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => {
                  setIcon(iconName);
                  setHasChanges(true);
                  setShowIconPicker(false);
                }}
              >
                <Ionicons
                  name={iconName as any}
                  size={28}
                  color={icon === iconName ? color.icon : colors.text}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Color Picker Modal */}
      <Modal
        visible={showColorPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        statusBarTranslucent={false}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowColorPicker(false)}>
              <ThemedText variant="body" style={{ color: colors.primary }}>
                Done
              </ThemedText>
            </TouchableOpacity>
            <ThemedText variant="subtitle">Choose Color</ThemedText>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView contentContainerStyle={styles.colorGrid}>
            {CATEGORY_COLORS.map((colorOption, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.colorOption,
                  color.gradientStart === colorOption.gradientStart && styles.colorOptionSelected,
                ]}
                onPress={() => {
                  setColor({
                    gradientStart: colorOption.gradientStart,
                    gradientEnd: colorOption.gradientEnd,
                    bg: colorOption.bg,
                    icon: colorOption.icon,
                    text: colorOption.text,
                  });
                  setHasChanges(true);
                  setShowColorPicker(false);
                }}
              >
                <LinearGradient
                  colors={[colorOption.gradientStart, colorOption.gradientEnd]}
                  style={styles.colorOptionGradient}
                />
                <ThemedText variant="caption">{colorOption.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
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
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  previewCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  previewGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  previewIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  previewLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pickerSection: {
    marginBottom: spacing.md,
  },
  pickerLabel: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  pickerPreview: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  pickerText: {
    flex: 1,
  },
  fieldsSection: {
    marginTop: spacing.lg,
  },
  fieldsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: spacing.md,
  },
  emptyFields: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  fieldsList: {
    gap: spacing.sm,
  },
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fieldEditorCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  fieldEditorTitle: {
    fontWeight: '600',
  },
  fieldEditorActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fieldEditorActionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  constraintRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  constraintInput: {
    flex: 1,
    marginBottom: 0,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  fieldLabel: {
    fontWeight: '500',
  },
  fieldBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  fieldActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  fieldActionBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl * 3
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  iconGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    padding: spacing.base,
    gap: spacing.md,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.base,
    gap: spacing.md,
  },
  colorOption: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    width: 80,
  },
  colorOptionSelected: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  colorOptionGradient: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  optionsLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  keyboardTypeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  keyboardTypeOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dropdownOptionsContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  dropdownOptionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  dropdownOptionInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dropdownOptionInput: {
    flex: 1,
    marginBottom: 0,
  },
  deleteOptionButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
