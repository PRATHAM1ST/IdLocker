/**
 * Form validation utilities
 * All validation is dynamic based on CustomCategory definitions
 */

import { maskValue, formatCardExpiry, sanitizeInput } from './formatters';
import type { CustomCategory, FieldDefinition, VaultItem } from './types';

// Re-export formatters for backward compatibility
export { maskValue, formatCardExpiry, sanitizeInput } from './formatters';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate a single field value against its definition
 */
export function validateField(value: string | undefined, field: FieldDefinition): string | null {
  const trimmedValue = value?.trim() ?? '';

  // Required check
  if (field.required && !trimmedValue) {
    return `${field.label} is required`;
  }

  // Skip further validation if empty and not required
  if (!trimmedValue) return null;

  if (field.minLength && trimmedValue.length < field.minLength) {
    return `${field.label} must be at least ${field.minLength} characters`;
  }

  // Max length check
  if (field.maxLength && trimmedValue.length > field.maxLength) {
    return `${field.label} must be ${field.maxLength} characters or less`;
  }

  if (field.prefix && !trimmedValue.startsWith(field.prefix)) {
    return `${field.label} must start with ${field.prefix}`;
  }

  if (field.keyboardType === 'numeric') {
    const numericValue = Number(trimmedValue);
    if (Number.isNaN(numericValue)) {
      return `${field.label} must be a valid number`;
    }
    if (field.minValue !== undefined && numericValue < field.minValue) {
      return `${field.label} must be at least ${field.minValue}`;
    }
    if (field.maxValue !== undefined && numericValue > field.maxValue) {
      return `${field.label} must be at most ${field.maxValue}`;
    }
  }

  // Specific validations based on field key
  switch (field.key) {
    case 'lastFourDigits':
      if (!/^\d{4}$/.test(trimmedValue)) {
        return 'Must be exactly 4 digits';
      }
      break;

    case 'expiryMonth':
      const month = parseInt(trimmedValue, 10);
      if (isNaN(month) || month < 1 || month > 12) {
        return 'Invalid month (01-12)';
      }
      break;

    case 'expiryYear':
      const year = parseInt(trimmedValue, 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < currentYear || year > currentYear + 20) {
        return 'Invalid year';
      }
      break;

    case 'ifsc':
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(trimmedValue)) {
        return 'Invalid IFSC format';
      }
      break;

    case 'website':
      if (trimmedValue && !trimmedValue.match(/^https?:\/\//i)) {
        return 'URL should start with http:// or https://';
      }
      break;
  }

  return null;
}

/**
 * Validate all fields for a vault item using category definition
 * @param category - The category definition with fields
 * @param label - Item label
 * @param fields - Field values to validate
 */
export function validateVaultItem(
  category: CustomCategory | null | undefined,
  label: string,
  fields: Record<string, string>,
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate label
  if (!label.trim()) {
    errors.push({ field: 'label', message: 'Label is required' });
  } else if (label.length > 100) {
    errors.push({ field: 'label', message: 'Label must be 100 characters or less' });
  }

  // If no category provided, only validate label
  if (!category) {
    return { isValid: errors.length === 0, errors };
  }

  // Validate each field from category definition
  for (const fieldDef of category.fields) {
    const value = fields[fieldDef.key];
    const error = validateField(value, fieldDef);
    if (error) {
      errors.push({ field: fieldDef.key, message: error });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get preview text for vault item in list
 * Uses category definition for dynamic preview
 */
export function getItemPreview(item: VaultItem, category?: CustomCategory | null): string {
  // Try to use category's previewField if provided
  if (category?.previewField && item.fields[category.previewField]) {
    return maskValue(item.fields[category.previewField]);
  }

  // Fallback previews by type (for preset categories)
  switch (item.type) {
    case 'bankAccount':
      return item.fields.bankName || 'Bank Account';
    case 'card':
      return item.fields.brand
        ? `${item.fields.brand} •••• ${item.fields.lastFourDigits || '****'}`
        : `•••• ${item.fields.lastFourDigits || '****'}`;
    case 'govId':
      return item.fields.idType || 'Government ID';
    case 'login':
      return item.fields.serviceName || 'Login';
    case 'note':
      return 'Secure Note';
    default:
      // For custom categories, try to find first non-empty, non-sensitive field
      if (category) {
        for (const fieldDef of category.fields) {
          if (item.fields[fieldDef.key] && !fieldDef.sensitive) {
            return item.fields[fieldDef.key];
          }
        }
      }
      return item.label;
  }
}

/**
 * Check if a vault item matches search query
 * Searches label and common non-sensitive fields
 */
export function matchesSearch(item: VaultItem, query: string): boolean {
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) return true;

  // Search in label
  if (item.label.toLowerCase().includes(lowerQuery)) return true;

  // Search in non-sensitive fields
  const nonSensitiveFields = ['bankName', 'serviceName', 'cardNickname', 'idType', 'title'];
  for (const key of nonSensitiveFields) {
    if (item.fields[key]?.toLowerCase().includes(lowerQuery)) return true;
  }

  // Search by last 4 digits (exact match only for security)
  if (/^\d{4}$/.test(lowerQuery)) {
    if (item.fields.lastFourDigits === lowerQuery) return true;
    if (item.fields.accountNumber?.endsWith(lowerQuery)) return true;
  }

  return false;
}
