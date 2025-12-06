/**
 * Category edit/create screen
 * Edit category name, icon, color, and manage fields
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '../../../src/components/ThemedView';
import { ThemedText } from '../../../src/components/ThemedText';
import { Input } from '../../../src/components/Input';
import { Button } from '../../../src/components/Button';
import { useTheme } from '../../../src/context/ThemeProvider';
import { useCategories } from '../../../src/context/CategoryProvider';
import { spacing, borderRadius, shadows } from '../../../src/styles/theme';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../../../src/utils/constants';
import type { CustomCategory, FieldDefinition, CategoryColor } from '../../../src/utils/types';

type KeyboardType = 'default' | 'numeric' | 'email-address' | 'phone-pad';

interface FieldEditorModalProps {
  visible: boolean;
  field: FieldDefinition | null;
  onSave: (field: FieldDefinition) => void;
  onClose: () => void;
  colors: any;
}

function FieldEditorModal({ visible, field, onSave, onClose, colors }: FieldEditorModalProps) {
  const [label, setLabel] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [required, setRequired] = useState(false);
  const [sensitive, setSensitive] = useState(false);
  const [multiline, setMultiline] = useState(false);
  const [keyboardType, setKeyboardType] = useState<KeyboardType>('default');

  useEffect(() => {
    if (field) {
      setLabel(field.label);
      setPlaceholder(field.placeholder || '');
      setRequired(field.required || false);
      setSensitive(field.sensitive || false);
      setMultiline(field.multiline || false);
      setKeyboardType(field.keyboardType || 'default');
    } else {
      setLabel('');
      setPlaceholder('');
      setRequired(false);
      setSensitive(false);
      setMultiline(false);
      setKeyboardType('default');
    }
  }, [field, visible]);

  const handleSave = () => {
    if (!label.trim()) {
      Alert.alert('Error', 'Please enter a field label');
      return;
    }

    const key = field?.key || label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    onSave({
      key,
      label: label.trim(),
      placeholder: placeholder.trim() || undefined,
      required,
      sensitive,
      multiline,
      keyboardType: keyboardType !== 'default' ? keyboardType : undefined,
    });
  };

  const keyboardTypes: { value: KeyboardType; label: string }[] = [
    { value: 'default', label: 'Text' },
    { value: 'numeric', label: 'Number' },
    { value: 'email-address', label: 'Email' },
    { value: 'phone-pad', label: 'Phone' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <ThemedText variant="body" style={{ color: colors.error }}>Cancel</ThemedText>
          </TouchableOpacity>
          <ThemedText variant="subtitle">{field ? 'Edit Field' : 'Add Field'}</ThemedText>
          <TouchableOpacity onPress={handleSave}>
            <ThemedText variant="body" style={{ color: colors.primary }}>Save</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
          <Input
            label="Field Label *"
            value={label}
            onChangeText={setLabel}
            placeholder="e.g., Account Number"
          />

          <Input
            label="Placeholder"
            value={placeholder}
            onChangeText={setPlaceholder}
            placeholder="Hint text shown when empty"
          />

          <ThemedText variant="label" color="secondary" style={styles.optionsLabel}>
            Field Type
          </ThemedText>
          <View style={styles.keyboardTypeRow}>
            {keyboardTypes.map(({ value, label: typeLabel }) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.keyboardTypeOption,
                  { backgroundColor: colors.card },
                  keyboardType === value && { backgroundColor: colors.primary },
                ]}
                onPress={() => setKeyboardType(value)}
              >
                <ThemedText
                  variant="caption"
                  style={{ color: keyboardType === value ? '#FFFFFF' : colors.text }}
                >
                  {typeLabel}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          <ThemedText variant="label" color="secondary" style={styles.optionsLabel}>
            Options
          </ThemedText>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[
                styles.optionToggle,
                { backgroundColor: colors.card },
                required && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
              ]}
              onPress={() => setRequired(!required)}
            >
              <Ionicons
                name={required ? 'checkbox' : 'square-outline'}
                size={20}
                color={required ? colors.primary : colors.textSecondary}
              />
              <ThemedText variant="bodySmall">Required</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionToggle,
                { backgroundColor: colors.card },
                sensitive && { backgroundColor: colors.warning + '20', borderColor: colors.warning },
              ]}
              onPress={() => setSensitive(!sensitive)}
            >
              <Ionicons
                name={sensitive ? 'eye-off' : 'eye-outline'}
                size={20}
                color={sensitive ? colors.warning : colors.textSecondary}
              />
              <ThemedText variant="bodySmall">Sensitive</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionToggle,
                { backgroundColor: colors.card },
                multiline && { backgroundColor: colors.accent + '20', borderColor: colors.accent },
              ]}
              onPress={() => setMultiline(!multiline)}
            >
              <Ionicons
                name={multiline ? 'document-text' : 'document-text-outline'}
                size={20}
                color={multiline ? colors.accent : colors.textSecondary}
              />
              <ThemedText variant="bodySmall">Multiline</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function CategoryEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { categories, addCategory, updateCategory, getCategoryById, getDefaultColor, generateCategoryId } = useCategories();

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
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);

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
  }, [isNew, id, label, icon, color, fields, previewField, addCategory, updateCategory, generateCategoryId, router]);

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

  const handleAddField = useCallback(() => {
    setEditingField(null);
    setShowFieldEditor(true);
  }, []);

  const handleEditField = useCallback((field: FieldDefinition) => {
    setEditingField(field);
    setShowFieldEditor(true);
  }, []);

  const handleSaveField = useCallback((field: FieldDefinition) => {
    setFields(prev => {
      if (editingField) {
        return prev.map(f => f.key === editingField.key ? field : f);
      }
      return [...prev, field];
    });
    setShowFieldEditor(false);
    setEditingField(null);
    setHasChanges(true);
  }, [editingField]);

  const handleDeleteField = useCallback((field: FieldDefinition) => {
    Alert.alert(
      'Delete Field',
      `Are you sure you want to delete "${field.label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setFields(prev => prev.filter(f => f.key !== field.key));
            setHasChanges(true);
          },
        },
      ]
    );
  }, []);

  const handleMoveField = useCallback((index: number, direction: 'up' | 'down') => {
    setFields(prev => {
      const newFields = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newFields.length) return prev;
      [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
      return newFields;
    });
    setHasChanges(true);
  }, []);

  const renderFieldItem = (field: FieldDefinition, index: number) => (
    <View
      key={field.key}
      style={[styles.fieldCard, { backgroundColor: colors.card }, shadows.sm]}
    >
      <View style={styles.fieldInfo}>
        <View style={styles.fieldHeader}>
          <ThemedText variant="body" style={styles.fieldLabel}>
            {field.label}
          </ThemedText>
          {field.required && (
            <View style={[styles.fieldBadge, { backgroundColor: colors.primary + '20' }]}>
              <ThemedText variant="caption" style={{ color: colors.primary }}>Required</ThemedText>
            </View>
          )}
          {field.sensitive && (
            <View style={[styles.fieldBadge, { backgroundColor: colors.warning + '20' }]}>
              <ThemedText variant="caption" style={{ color: colors.warning }}>Sensitive</ThemedText>
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
        <TouchableOpacity
          style={styles.fieldActionBtn}
          onPress={() => handleEditField(field)}
        >
          <Ionicons name="pencil" size={16} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fieldActionBtn}
          onPress={() => handleDeleteField(field)}
        >
          <Ionicons name="trash-outline" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient
        colors={[color.gradientStart, color.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <ThemedText variant="subtitle" style={styles.headerTitle}>
            {isNew ? 'New Category' : 'Edit Category'}
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.content, { backgroundColor: colors.background }]}>
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
              onChangeText={(val) => { setLabel(val); setHasChanges(true); }}
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
                <TouchableOpacity
                  style={[styles.addFieldBtn, { backgroundColor: colors.primary }]}
                  onPress={handleAddField}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <ThemedText variant="caption" style={{ color: '#FFFFFF' }}>Add</ThemedText>
                </TouchableOpacity>
              </View>

              {fields.length === 0 ? (
                <View style={[styles.emptyFields, { backgroundColor: colors.backgroundTertiary }]}>
                  <Ionicons name="list-outline" size={32} color={colors.textTertiary} />
                  <ThemedText variant="bodySmall" color="tertiary" style={styles.emptyText}>
                    No fields yet. Add fields to define what data this category stores.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.fieldsList}>
                  {fields.map(renderFieldItem)}
                </View>
              )}
            </View>

            {/* Save button */}
            <View style={styles.saveContainer}>
              <Button
                title={isSaving ? 'Saving...' : (isNew ? 'Create Category' : 'Save Changes')}
                onPress={handleSave}
                icon="checkmark"
                fullWidth
                size="lg"
                loading={isSaving}
                disabled={isSaving}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Icon Picker Modal */}
      <Modal visible={showIconPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowIconPicker(false)}>
              <ThemedText variant="body" style={{ color: colors.primary }}>Done</ThemedText>
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
                  icon === iconName && { backgroundColor: color.bg, borderColor: color.icon, borderWidth: 2 },
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
      <Modal visible={showColorPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowColorPicker(false)}>
              <ThemedText variant="body" style={{ color: colors.primary }}>Done</ThemedText>
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

      {/* Field Editor Modal */}
      <FieldEditorModal
        visible={showFieldEditor}
        field={editingField}
        onSave={handleSaveField}
        onClose={() => { setShowFieldEditor(false); setEditingField(null); }}
        colors={colors}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.base,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    marginTop: -spacing.md,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
    paddingTop: spacing.lg,
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
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  addFieldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
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
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: spacing.base,
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
});

