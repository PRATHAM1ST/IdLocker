/**
 * CustomFieldEditor component
 * Allows users to add, edit, and delete custom fields on individual items
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import { borderRadius, shadows, spacing } from '../styles/theme';
import type { CustomField } from '../utils/types';
import { Input } from './Input';
import { SectionTitle } from './SectionTitle';
import { ThemedText } from './ThemedText';

/**
 * Generate a unique ID for custom fields
 */
function generateFieldId(): string {
  return 'cf-' + Math.random().toString(36).substring(2, 9);
}

interface CustomFieldEditorProps {
  customFields: CustomField[];
  onCustomFieldsChange: (fields: CustomField[]) => void;
}

export function CustomFieldEditor({ customFields, onCustomFieldsChange }: CustomFieldEditorProps) {
  const { colors } = useTheme();
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  
  // Use ref to store latest customFields to avoid stale closure issues with auto-save
  const customFieldsRef = useRef<CustomField[]>(customFields);
  const onCustomFieldsChangeRef = useRef(onCustomFieldsChange);
  
  // Update refs whenever props change
  useEffect(() => {
    customFieldsRef.current = customFields;
  }, [customFields]);
  
  useEffect(() => {
    onCustomFieldsChangeRef.current = onCustomFieldsChange;
  }, [onCustomFieldsChange]);

  const handleAddField = useCallback(() => {
    if (!newFieldLabel.trim()) {
      Alert.alert('Error', 'Please enter a field name');
      return;
    }

    const newField: CustomField = {
      id: generateFieldId(),
      label: newFieldLabel.trim(),
      value: newFieldValue.trim(),
    };

    onCustomFieldsChange([...customFields, newField]);
    setNewFieldLabel('');
    setNewFieldValue('');
    setIsAddingField(false);
  }, [newFieldLabel, newFieldValue, customFields, onCustomFieldsChange]);

  const handleUpdateField = useCallback(
    (id: string, updates: Partial<CustomField>) => {
      onCustomFieldsChange(
        customFields.map((field) => (field.id === id ? { ...field, ...updates } : field)),
      );
    },
    [customFields, onCustomFieldsChange],
  );

  const handleDeleteField = useCallback(
    (id: string) => {
      // Get field info from current props (not closure) for the alert message
      const field = customFields.find((f) => f.id === id);
      if (!field) {
        // Field not found, might have been deleted already
        return;
      }
      
      Alert.alert('Delete Field', `Are you sure you want to delete "${field.label}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Use refs to get latest values, avoiding stale closure issues with auto-save
            // This ensures we always use the most current state, even if auto-save updated it
            const currentFields = customFieldsRef.current;
            const currentOnChange = onCustomFieldsChangeRef.current;
            const filteredFields = currentFields.filter((f) => f.id !== id);
            
            // Only update if the field still exists (defensive check)
            if (currentFields.some((f) => f.id === id)) {
              currentOnChange(filteredFields);
            }
          },
        },
      ]);
    },
    [customFields],
  );

  const handleCancelAdd = useCallback(() => {
    setNewFieldLabel('');
    setNewFieldValue('');
    setIsAddingField(false);
  }, []);

  return (
    <View style={styles.container}>
      {/* Section header */}
      <SectionTitle>Custom Fields</SectionTitle>

      {/* Existing custom fields */}
      {customFields.map((field) => (
        <View
          key={field.id}
          style={[styles.fieldCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.sm]}
        >
          <View style={styles.fieldHeader}>
            <View style={styles.fieldLabelContainer} pointerEvents="box-none">
              <Input
                label=""
                value={field.label}
                onChangeText={(text) => handleUpdateField(field.id, { label: text })}
                placeholder="Field name"
                containerStyle={styles.compactInput}
                inputStyle={styles.fieldLabelInput}
              />
            </View>
            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: colors.error + '20' }]}
              onPress={(e) => {
                e?.stopPropagation?.();
                handleDeleteField(field.id);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
          <View style={styles.fieldValueContainer}>
            <Input
              label=""
              value={field.value}
              onChangeText={(text) => handleUpdateField(field.id, { value: text })}
              placeholder="Field value"
              multiline
              containerStyle={styles.compactInput}
            />
          </View>
        </View>
      ))}

      {/* Add new field form */}
      {isAddingField && (
        <View style={[styles.newFieldCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.sm]}>
          <Input
            label="Field Name"
            value={newFieldLabel}
            onChangeText={setNewFieldLabel}
            placeholder="e.g., Serial Number"
            autoFocus
            containerStyle={styles.compactInput}
          />
          <Input
            label="Value"
            value={newFieldValue}
            onChangeText={setNewFieldValue}
            placeholder="Enter value"
            multiline
            containerStyle={styles.compactInput}
          />
          <View style={styles.newFieldActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton, { borderColor: colors.border }]}
              onPress={handleCancelAdd}
              activeOpacity={0.7}
            >
              <ThemedText variant="bodySmall" color="secondary">
                Cancel
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton, { backgroundColor: colors.accent }]}
              onPress={handleAddField}
              activeOpacity={0.7}
            >
              <ThemedText variant="bodySmall" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                Add Field
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Add button - shown when not adding and fields exist */}
      {!isAddingField && customFields.length > 0 && (
        <TouchableOpacity
          style={[styles.addButton, { borderColor: colors.border }]}
          onPress={() => setIsAddingField(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
          <ThemedText variant="bodySmall" color="accent" style={styles.addButtonText}>
            Add Custom Field
          </ThemedText>
        </TouchableOpacity>
      )}

      {/* Empty state */}
      {customFields.length === 0 && !isAddingField && (
        <View style={[styles.emptyState, { backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.accent + '15' }]}>
            <Ionicons name="document-text-outline" size={32} color={colors.accent} />
          </View>
          <ThemedText variant="body" color="secondary" style={styles.emptyTitle}>
            No Custom Fields
          </ThemedText>
          <ThemedText variant="caption" color="tertiary" style={styles.emptyText}>
            Add custom fields to store additional information about this item
          </ThemedText>
          <TouchableOpacity
            style={[styles.emptyAddButton, { backgroundColor: colors.accent }]}
            onPress={() => setIsAddingField(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <ThemedText variant="bodySmall" style={{ color: '#FFFFFF', marginLeft: spacing.xs, fontWeight: '600' }}>
              Add Field
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  fieldCard: {
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  fieldLabelContainer: {
    flex: 1,
    minWidth: 0,
  },
  fieldLabelInput: {
    fontSize: 15,
    fontWeight: '600',
  },
  fieldValueContainer: {
    marginTop: spacing.xs,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    zIndex: 10,
  },
  compactInput: {
    marginBottom: 0,
  },
  newFieldCard: {
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  newFieldActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1.5,
  },
  saveButton: {
    minWidth: 100,
  },
  addButton: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addButtonText: {
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  emptyState: {
    padding: spacing['2xl'],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  emptyText: {
    marginBottom: spacing.lg,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
});
