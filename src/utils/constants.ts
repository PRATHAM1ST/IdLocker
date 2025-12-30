/**
 * App constants and field configurations
 * Single source of truth for categories and fields via DEFAULT_CATEGORIES
 */

import { Ionicons } from '@expo/vector-icons';
import gradients from '../styles/gradients';
import type {
  AppSettings,
  BankAccountType,
  CardBrand,
  CustomCategory,
  GovIdSubtype,
} from './types';

// Storage keys
export const STORAGE_KEYS = {
  VAULT_META: 'vault.meta.',
  VAULT_CHUNK_PREFIX: 'vault.chunk.',
  APP_SETTINGS: 'app.settings.',
  CATEGORIES: 'categories.data.',
} as const;

// Chunking configuration
export const CHUNK_SIZE = 2000; // bytes, leaving buffer under 2048 limit

// Default app settings
export const DEFAULT_SETTINGS: AppSettings = {
  hasCompletedOnboarding: false,
  autoLockTimeout: 120, // 2 minutes default (more reasonable for active use)
  theme: 'system',
};

// Auto-lock timeout options (in seconds)
export const AUTO_LOCK_OPTIONS = [
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 120, label: '2 minutes' },
  { value: 300, label: '5 minutes' },
] as const;

// Card brand options (used in field definitions)
export const CARD_BRANDS: { value: CardBrand; label: string }[] = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'amex', label: 'American Express' },
  { value: 'rupay', label: 'RuPay' },
  { value: 'discover', label: 'Discover' },
  { value: 'diners', label: 'Diners Club' },
  { value: 'other', label: 'Other' },
];

// Government ID subtypes (used in field definitions)
export const GOV_ID_TYPES: { value: GovIdSubtype; label: string }[] = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'drivingLicense', label: 'Driving License' },
  { value: 'voterId', label: 'Voter ID' },
  { value: 'other', label: 'Other' },
];

// Bank account types (used in field definitions)
export const BANK_ACCOUNT_TYPES: { value: BankAccountType; label: string }[] = [
  { value: 'savings', label: 'Savings' },
  { value: 'current', label: 'Current' },
  { value: 'salary', label: 'Salary' },
  { value: 'fixed', label: 'Fixed Deposit' },
  { value: 'other', label: 'Other' },
];

// Default preset categories with full configuration
// This is the SINGLE SOURCE OF TRUTH for category definitions
const now = new Date().toISOString();

export const DEFAULT_CATEGORIES: CustomCategory[] = [
  {
    id: 'bankAccount',
    label: 'Bank Account',
    icon: 'business-outline',
    color: {
      gradientStart: '#3B82F6',
      gradientEnd: '#60A5FA',
      bg: '#DBEAFE',
      icon: '#3B82F6',
      text: '#1E40AF',
    },
    previewField: 'accountNumber',
    fields: [
      { key: 'bankName', label: 'Bank Name', required: true, placeholder: 'e.g., HDFC Bank' },
      {
        key: 'accountHolder',
        label: 'Account Holder Name',
        placeholder: 'Full name as on account',
      },
      {
        key: 'accountNumber',
        label: 'Account Number',
        required: true,
        sensitive: true,
        keyboardType: 'numeric',
        placeholder: 'Account number',
      },
      { key: 'accountType', label: 'Account Type', options: BANK_ACCOUNT_TYPES },
      { key: 'ifsc', label: 'IFSC Code', required: true, placeholder: 'e.g., HDFC0001234', maxLength: 11 },
      { key: 'upiId', label: 'UPI ID', placeholder: 'e.g., user@upi' },
      { key: 'swift', label: 'SWIFT/BIC Code', placeholder: 'For international transfers' },
      { key: 'branch', label: 'Branch', placeholder: 'Branch name or location' },
      { key: 'notes', label: 'Notes', multiline: true, placeholder: 'Additional notes...' },
    ],
    isPreset: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'card',
    label: 'Card',
    icon: 'card-outline',
    color: {
      gradientStart: '#EF4444',
      gradientEnd: '#F87171',
      bg: '#FEE2E2',
      icon: '#EF4444',
      text: '#991B1B',
    },
    previewField: 'lastFourDigits',
    fields: [
      {
        key: 'cardNickname',
        label: 'Card Nickname',
        required: true,
        placeholder: 'e.g., Personal HDFC Credit',
      },
      { key: 'brand', label: 'Card Brand', options: CARD_BRANDS },
      {
        key: 'lastFourDigits',
        label: 'Last 4 Digits',
        required: true,
        keyboardType: 'numeric',
        maxLength: 4,
        placeholder: '1234',
      },
      {
        key: 'expiryMonth',
        label: 'Expiry Month',
        keyboardType: 'numeric',
        maxLength: 2,
        placeholder: 'MM',
      },
      {
        key: 'expiryYear',
        label: 'Expiry Year',
        keyboardType: 'numeric',
        maxLength: 4,
        placeholder: 'YYYY',
      },
      {
        key: 'cvv',
        label: 'CVV',
        sensitive: true,
        keyboardType: 'numeric',
        maxLength: 4,
        placeholder: '123',
      },
      {
        key: 'pin',
        label: 'ATM PIN',
        sensitive: true,
        keyboardType: 'numeric',
        maxLength: 6,
        placeholder: '****',
      },
      { key: 'cardholderName', label: 'Cardholder Name', placeholder: 'Name as on card' },
      {
        key: 'billingAddress',
        label: 'Billing Address',
        multiline: true,
        placeholder: 'Billing address...',
      },
      { key: 'notes', label: 'Notes', multiline: true, placeholder: 'Additional notes...' },
    ],
    isPreset: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'govId',
    label: 'Government ID',
    icon: 'id-card-outline',
    color: {
      gradientStart: '#10B981',
      gradientEnd: '#34D399',
      bg: '#D1FAE5',
      icon: '#10B981',
      text: '#065F46',
    },
    previewField: 'idNumber',
    fields: [
      { key: 'idType', label: 'ID Type', required: true, options: GOV_ID_TYPES },
      {
        key: 'idNumber',
        label: 'ID Number',
        required: true,
        sensitive: true,
        placeholder: 'ID number',
      },
      { key: 'fullName', label: 'Full Name', placeholder: 'Name as on ID' },
      { key: 'dateOfBirth', label: 'Date of Birth', placeholder: 'DD/MM/YYYY' },
      {
        key: 'issuingAuthority',
        label: 'Issuing Authority',
        placeholder: 'e.g., UIDAI, Passport Office',
      },
      { key: 'issueDate', label: 'Issue Date', placeholder: 'DD/MM/YYYY' },
      { key: 'expiryDate', label: 'Expiry Date', placeholder: 'DD/MM/YYYY' },
      { key: 'address', label: 'Address', multiline: true, placeholder: 'Address as on ID' },
      { key: 'notes', label: 'Notes', multiline: true, placeholder: 'Additional notes...' },
    ],
    isPreset: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'login',
    label: 'Login',
    icon: 'key-outline',
    color: {
      gradientStart: '#6366F1',
      gradientEnd: '#818CF8',
      bg: '#E0E7FF',
      icon: '#6366F1',
      text: '#3730A3',
    },
    previewField: 'username',
    fields: [
      {
        key: 'serviceName',
        label: 'Service/Website',
        required: true,
        placeholder: 'e.g., Gmail, Netflix',
      },
      {
        key: 'username',
        label: 'Username/Email',
        required: true,
        placeholder: 'Username or email',
      },
      {
        key: 'password',
        label: 'Password',
        required: true,
        sensitive: true,
        placeholder: 'Password',
      },
      { key: 'website', label: 'Website URL', keyboardType: 'default', placeholder: 'https://...' },
      {
        key: 'notes',
        label: 'Notes',
        multiline: true,
        placeholder: 'Security questions, recovery codes...',
      },
    ],
    isPreset: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'note',
    label: 'Secure Note',
    icon: 'document-text-outline',
    color: {
      gradientStart: '#F59E0B',
      gradientEnd: '#FBBF24',
      bg: '#FEF3C7',
      icon: '#F59E0B',
      text: '#92400E',
    },
    fields: [
      { key: 'title', label: 'Title', required: true, placeholder: 'Note title' },
      {
        key: 'content',
        label: 'Content',
        required: true,
        multiline: true,
        sensitive: true,
        placeholder: 'Your secure note...',
      },
    ],
    isPreset: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'other',
    label: 'Other',
    icon: 'ellipsis-horizontal-circle-outline',
    color: {
      gradientStart: '#A855F7',
      gradientEnd: '#C084FC',
      bg: '#F3E8FF',
      icon: '#A855F7',
      text: '#6B21A8',
    },
    fields: [
      { key: 'title', label: 'Title', required: true, placeholder: 'Item title' },
      { key: 'field1', label: 'Field 1', placeholder: 'Custom field' },
      { key: 'field2', label: 'Field 2', placeholder: 'Custom field' },
      { key: 'field3', label: 'Field 3', placeholder: 'Custom field' },
      { key: 'notes', label: 'Notes', multiline: true, placeholder: 'Additional notes...' },
    ],
    isPreset: true,
    createdAt: now,
    updatedAt: now,
  },
];

// Available icons for custom categories
export const CATEGORY_ICONS = [...Object.keys(Ionicons.glyphMap)] as const;

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Helper function to convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
}

// Helper function to lighten a hex color (mix with white)
function lightenColor(hex: string, amount: number = 0.85): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const r = Math.min(255, rgb.r + (255 - rgb.r) * amount);
  const g = Math.min(255, rgb.g + (255 - rgb.g) * amount);
  const b = Math.min(255, rgb.b + (255 - rgb.b) * amount);

  return rgbToHex(r, g, b);
}

// Helper function to darken a hex color (mix with black)
function darkenColor(hex: string, amount: number = 0.4): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const r = Math.max(0, rgb.r * (1 - amount));
  const g = Math.max(0, rgb.g * (1 - amount));
  const b = Math.max(0, rgb.b * (1 - amount));

  return rgbToHex(r, g, b);
}

// Transform gradients to CategoryColor format
function transformGradientToCategoryColor(gradient: {
  name: string;
  colors: readonly string[];
}): {
  name: string;
  gradientStart: string;
  gradientEnd: string;
  bg: string;
  icon: string;
  text: string;
} {
  const colors = gradient.colors;
  const firstColor = colors[0];
  const lastColor = colors[colors.length - 1];

  // Use first color as the base for icon, bg, and text
  return {
    name: gradient.name,
    gradientStart: firstColor,
    gradientEnd: lastColor,
    icon: firstColor,
    bg: lightenColor(firstColor, 0.85),
    text: darkenColor(firstColor, 0.4),
  };
}

// Available colors for custom categories (used in category picker)
// Transformed from gradients.ts
export const CATEGORY_COLORS = gradients.map(transformGradientToCategoryColor);

// Sensitive field keys that should be masked by default
export const SENSITIVE_FIELDS = new Set(['accountNumber', 'idNumber', 'password', 'content', 'cvv', 'pin']);

// Fields that show masked preview in list
export const PREVIEW_MASK_LENGTH = 4;
