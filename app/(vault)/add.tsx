/**
 * Add item screen - dynamic form based on item type
 * Redesigned with modern styling
 * Supports custom categories and item-level custom fields
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { CustomFieldEditor } from '../../src/components/CustomFieldEditor';
import { ImagePicker } from '../../src/components/ImagePicker';
import { Input, Select } from '../../src/components/Input';
import { ThemedText } from '../../src/components/ThemedText';
import { ThemedView } from '../../src/components/ThemedView';
import { useCategories } from '../../src/context/CategoryProvider';
import { useTheme } from '../../src/context/ThemeProvider';
import { useVault } from '../../src/context/VaultProvider';
import { borderRadius, shadows, spacing } from '../../src/styles/theme';
import type { CustomCategory, CustomField, FieldDefinition, ImageAttachment, VaultItemType } from '../../src/utils/types';
import { sanitizeInput } from '../../src/utils/validation';

export default function AddItemScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: VaultItemType }>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { addItem } = useVault();
  const { categories, getCategoryById } = useCategories();

  const [selectedType, setSelectedType] = useState<VaultItemType | null>(
    params.type || null
  );
  const [label, setLabel] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Get the selected category
  const selectedCategory = useMemo(() => {
    if (!selectedType) return null;
    return getCategoryById(selectedType) || null;
  }, [selectedType, getCategoryById]);

  const categoryColor = selectedCategory?.color || null;

  const handleTypeSelect = useCallback((category: CustomCategory) => {
    setSelectedType(category.id);
    setLabel('');
    setFields({});
    setCustomFields([]);
    setImages([]);
    setErrors({});
  }, []);

  const handleCreateCategory = useCallback(() => {
    router.push('/(vault)/category/new' as any);
  }, [router]);

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
    if (!selectedType || !selectedCategory) return;

    // Basic validation
    const errorMap: Record<string, string> = {};
    
    if (!label.trim()) {
      errorMap.label = 'Label is required';
    }
    
    // Validate required fields from category
    for (const fieldDef of selectedCategory.fields) {
      if (fieldDef.required && !fields[fieldDef.key]?.trim()) {
        errorMap[fieldDef.key] = `${fieldDef.label} is required`;
      }
    }
    
    if (Object.keys(errorMap).length > 0) {
      setErrors(errorMap);
      return;
    }

    setIsSaving(true);
    
    // Debug: Log what we're saving
    console.log('[AddItem] Saving item with images:', {
      type: selectedType,
      label: label.trim(),
      imageCount: images.length,
      customFieldCount: customFields.length,
    });
    
    const newItem = await addItem({
      type: selectedType,
      label: label.trim(),
      fields,
      customFields: customFields.length > 0 ? customFields : undefined,
      images: images.length > 0 ? images : undefined,
    });
    
    // Debug: Log the saved item
    console.log('[AddItem] Saved item:', newItem);
    
    setIsSaving(false);

    if (newItem) {
      // Small delay to ensure navigation is ready
      setTimeout(() => {
        router.back();
      }, 100);
    } else {
      Alert.alert('Error', 'Failed to save item. Please try again.');
    }
  }, [selectedType, selectedCategory, label, fields, customFields, images, addItem, router]);

  const renderTypeSelector = () => (
    <View style={styles.typeSelectorContainer}>
      <ThemedText variant="subtitle" style={styles.sectionTitle}>
        What would you like to add?
      </ThemedText>
      
      <View style={styles.typeGrid}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.typeCard}
            onPress={() => handleTypeSelect(category)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[category.color.gradientStart, category.color.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.typeCardGradient}
            >
              <View style={styles.typeCardDecor} />
              <View style={styles.typeIconContainer}>
                <Ionicons name={category.icon as any} size={28} color="rgba(255,255,255,0.95)" />
              </View>
              <ThemedText variant="label" style={styles.typeLabel}>
                {category.label}
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        ))}
        
        {/* Create new category option */}
        <TouchableOpacity
          style={styles.typeCard}
          onPress={handleCreateCategory}
          activeOpacity={0.85}
        >
          <View style={[styles.createCategoryCard, { borderColor: colors.border }]}>
            <View style={[styles.createCategoryIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="add" size={28} color={colors.primary} />
            </View>
            <ThemedText variant="label" style={[styles.createCategoryLabel, { color: colors.primary }]}>
              New Category
            </ThemedText>
          </View>
        </TouchableOpacity>
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
    if (!selectedCategory || !categoryColor) return null;

    return (
      <View style={styles.formContainer}>
        {/* Type indicator */}
        <TouchableOpacity 
          style={[styles.typeIndicator, shadows.sm]}
          onPress={() => setSelectedType(null)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[categoryColor.gradientStart, categoryColor.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.typeIndicatorGradient}
          >
            <View style={styles.typeIndicatorIcon}>
              <Ionicons name={selectedCategory.icon as any} size={20} color="rgba(255,255,255,0.95)" />
            </View>
            <ThemedText variant="label" style={styles.typeIndicatorLabel}>
              {selectedCategory.label}
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

        {/* Dynamic fields from category */}
        {selectedCategory.fields.map(renderField)}

        {/* Custom fields section */}
        <CustomFieldEditor
          customFields={customFields}
          onCustomFieldsChange={setCustomFields}
        />

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
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <ThemedText variant="subtitle" style={styles.headerTitle}>
            {selectedType ? `Add ${selectedCategory?.label}` : 'Add Item'}
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.mainContent, { backgroundColor: colors.background }]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {!selectedType ? renderTypeSelector() : renderForm()}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
  mainContent: {
    flex: 1,
    marginTop: -spacing.md,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingTop: spacing.lg,
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
  createCategoryCard: {
    flex: 1,
    padding: spacing.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createCategoryIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  createCategoryLabel: {
    fontWeight: '600',
  },
  formContainer: {
    paddingTop: spacing.sm,
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
