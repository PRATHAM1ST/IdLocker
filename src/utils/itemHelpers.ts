/**
 * Helper utilities for working with vault items
 */

import type { CustomCategory, VaultItem } from './types';
import { SENSITIVE_FIELDS } from './constants';
import { formatCardExpiry } from './formatters';

export interface DisplayField {
  key: string;
  label: string;
  value: string;
  sensitive: boolean;
}

/**
 * Build display fields from category template and item data
 * Handles special cases like expiry date combination
 */
export function buildDisplayFields(
  item: VaultItem,
  category: CustomCategory,
): DisplayField[] {
  const displayFields: DisplayField[] = [];

  for (const fieldDef of category.fields) {
    const value = item.fields[fieldDef.key];
    if (value) {
      // Special formatting for expiry
      if (fieldDef.key === 'expiryMonth' && item.fields.expiryYear) {
        continue; // Skip month, we'll combine with year
      }
      if (fieldDef.key === 'expiryYear' && item.fields.expiryMonth) {
        displayFields.push({
          key: 'expiry',
          label: 'Expiry Date',
          value: formatCardExpiry(item.fields.expiryMonth, item.fields.expiryYear),
          sensitive: false,
        });
        continue;
      }

      displayFields.push({
        key: fieldDef.key,
        label: fieldDef.label,
        value,
        sensitive: fieldDef.sensitive || SENSITIVE_FIELDS.has(fieldDef.key),
      });
    }
  }

  return displayFields;
}

