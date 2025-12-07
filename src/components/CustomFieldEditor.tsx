/**
 * CustomFieldEditor component
 * Allows users to add, edit, and delete custom fields on individual items
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { Input } from './Input';
import { useTheme } from '../context/ThemeProvider';
import { spacing, borderRadius, shadows } from '../styles/theme';
import type { CustomField } from '../utils/types';

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
      const field = customFields.find((f) => f.id === id);
      Alert.alert('Delete Field', `Are you sure you want to delete "${field?.label}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onCustomFieldsChange(customFields.filter((f) => f.id !== id));
          },
        },
      ]);
    },
    [customFields, onCustomFieldsChange],
  );

  const handleCancelAdd = useCallback(() => {
    setNewFieldLabel('');
    setNewFieldValue('');
    setIsAddingField(false);
  }, []);

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.header}>
        <ThemedText variant="label" color="secondary">
          Custom Fields
        </ThemedText>
        {!isAddingField && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setIsAddingField(true)}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <ThemedText variant="caption" style={{ color: '#FFFFFF', marginLeft: 4 }}>
              Add
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {/* Existing custom fields */}
      {customFields.map((field) => (
        <View
          key={field.id}
          style={[styles.fieldCard, { backgroundColor: colors.card }, shadows.sm]}
        >
          <View style={styles.fieldContent}>
            <View style={styles.fieldLabelRow}>
              <View style={styles.labelInput}>
                <Input
                  label=""
                  value={field.label}
                  onChangeText={(text) => handleUpdateField(field.id, { label: text })}
                  placeholder="Field name"
                />
              </View>
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: colors.error + '15' }]}
                onPress={() => handleDeleteField(field.id)}
              >
                <Ionicons name="trash-outline" size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
            <Input
              label=""
              value={field.value}
              onChangeText={(text) => handleUpdateField(field.id, { value: text })}
              placeholder="Field value"
              multiline
            />
          </View>
        </View>
      ))}

      {/* Add new field form */}
      {isAddingField && (
        <View style={[styles.newFieldCard, { backgroundColor: colors.card }, shadows.sm]}>
          <Input
            label="Field Name"
            value={newFieldLabel}
            onChangeText={setNewFieldLabel}
            placeholder="e.g., Serial Number"
            autoFocus
          />
          <Input
            label="Value"
            value={newFieldValue}
            onChangeText={setNewFieldValue}
            placeholder="Enter value"
            multiline
          />
          <View style={styles.newFieldActions}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={handleCancelAdd}
            >
              <ThemedText variant="bodySmall" color="secondary">
                Cancel
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleAddField}
            >
              <ThemedText variant="bodySmall" style={{ color: '#FFFFFF' }}>
                Add Field
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Empty state */}
      {customFields.length === 0 && !isAddingField && (
        <View style={[styles.emptyState, { backgroundColor: colors.backgroundTertiary }]}>
          <Ionicons name="add-circle-outline" size={24} color={colors.textTertiary} />
          <ThemedText variant="caption" color="tertiary" style={styles.emptyText}>
            Add custom fields to store additional information
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  fieldCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  labelInput: {
    flex: 1,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  newFieldCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  newFieldActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  saveButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  emptyState: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
