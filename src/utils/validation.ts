/**
 * Form validation utilities
 */

import { ITEM_TYPE_CONFIGS } from './constants';
import type { CustomCategory, FieldDefinition, VaultItem, VaultItemType } from './types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate a single field value
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
 * Validate all fields for a vault item
 */
export function validateVaultItem(
  type: VaultItemType,
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

  // Get field definitions for this type
  const config = ITEM_TYPE_CONFIGS[type];
  if (!config) {
    errors.push({ field: 'type', message: 'Invalid item type' });
    return { isValid: false, errors };
  }

  // Validate each field
  for (const fieldDef of config.fields) {
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
 * Sanitize input string
 */
export function sanitizeInput(value: string): string {
  // Remove control characters but preserve newlines for multiline fields
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Mask sensitive value for display
 */
export function maskValue(value: string, visibleChars = 4): string {
  if (!value || value.length <= visibleChars) {
    return '•'.repeat(value?.length || 4);
  }

  const masked = '•'.repeat(value.length - visibleChars);
  const visible = value.slice(-visibleChars);
  return `${masked}${visible}`;
}

/**
 * Format card expiry as MM/YY
 */
export function formatCardExpiry(month: string, year: string): string {
  if (!month || !year) return '';
  const m = month.padStart(2, '0');
  const y = year.length === 4 ? year.slice(-2) : year;
  return `${m}/${y}`;
}

/**
 * Get preview text for vault item in list
 * Accepts optional category for custom categories
 */
export function getItemPreview(item: VaultItem, category?: CustomCategory | null): string {
  // Try to use category's previewField if provided
  if (category?.previewField && item.fields[category.previewField]) {
    return maskValue(item.fields[category.previewField]);
  }

  // Try legacy config for preset categories
  const config = ITEM_TYPE_CONFIGS[item.type as keyof typeof ITEM_TYPE_CONFIGS];
  if (config?.previewField && item.fields[config.previewField]) {
    return maskValue(item.fields[config.previewField]);
  }

  // Fallback previews by type
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
      // For custom categories, try to find first non-empty field
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
