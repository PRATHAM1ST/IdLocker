/**
 * App constants and field configurations
 */

import type {
    AppSettings,
    BankAccountType,
    CardBrand,
    CustomCategory,
    GovIdSubtype,
    ItemTypeConfig,
    VaultItemType
} from './types';

// Storage keys
export const STORAGE_KEYS = {
  VAULT_META: 'vault:meta',
  VAULT_CHUNK_PREFIX: 'vault:chunk:',
  APP_SETTINGS: 'app:settings',
  CATEGORIES: 'categories:data',
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

// Card brand options
export const CARD_BRANDS: { value: CardBrand; label: string }[] = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'amex', label: 'American Express' },
  { value: 'rupay', label: 'RuPay' },
  { value: 'discover', label: 'Discover' },
  { value: 'diners', label: 'Diners Club' },
  { value: 'other', label: 'Other' },
];

// Government ID subtypes
export const GOV_ID_TYPES: { value: GovIdSubtype; label: string }[] = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'drivingLicense', label: 'Driving License' },
  { value: 'voterId', label: 'Voter ID' },
  { value: 'other', label: 'Other' },
];

// Bank account types
export const BANK_ACCOUNT_TYPES: { value: BankAccountType; label: string }[] = [
  { value: 'savings', label: 'Savings' },
  { value: 'current', label: 'Current' },
  { value: 'salary', label: 'Salary' },
  { value: 'fixed', label: 'Fixed Deposit' },
  { value: 'other', label: 'Other' },
];

// Item type configurations with field definitions
export const ITEM_TYPE_CONFIGS: Record<VaultItemType, ItemTypeConfig> = {
  bankAccount: {
    type: 'bankAccount',
    label: 'Bank Account',
    icon: 'business-outline',
    previewField: 'accountNumber',
    fields: [
      { key: 'bankName', label: 'Bank Name', required: true, placeholder: 'e.g., HDFC Bank' },
      { key: 'accountHolder', label: 'Account Holder Name', placeholder: 'Full name as on account' },
      { key: 'accountNumber', label: 'Account Number', required: true, sensitive: true, keyboardType: 'numeric', placeholder: 'Account number' },
      { key: 'accountType', label: 'Account Type', options: BANK_ACCOUNT_TYPES },
      { key: 'ifsc', label: 'IFSC Code', placeholder: 'e.g., HDFC0001234', maxLength: 11 },
      { key: 'swift', label: 'SWIFT/BIC Code', placeholder: 'For international transfers' },
      { key: 'branch', label: 'Branch', placeholder: 'Branch name or location' },
      { key: 'notes', label: 'Notes', multiline: true, placeholder: 'Additional notes...' },
    ],
  },
  card: {
    type: 'card',
    label: 'Card',
    icon: 'card-outline',
    previewField: 'lastFourDigits',
    fields: [
      { key: 'cardNickname', label: 'Card Nickname', required: true, placeholder: 'e.g., Personal HDFC Credit' },
      { key: 'brand', label: 'Card Brand', options: CARD_BRANDS },
      { key: 'lastFourDigits', label: 'Last 4 Digits', required: true, keyboardType: 'numeric', maxLength: 4, placeholder: '1234' },
      { key: 'expiryMonth', label: 'Expiry Month', keyboardType: 'numeric', maxLength: 2, placeholder: 'MM' },
      { key: 'expiryYear', label: 'Expiry Year', keyboardType: 'numeric', maxLength: 4, placeholder: 'YYYY' },
      { key: 'cardholderName', label: 'Cardholder Name', placeholder: 'Name as on card' },
      { key: 'billingAddress', label: 'Billing Address', multiline: true, placeholder: 'Billing address...' },
      { key: 'notes', label: 'Notes', multiline: true, placeholder: 'Additional notes...' },
    ],
  },
  govId: {
    type: 'govId',
    label: 'Government ID',
    icon: 'id-card-outline',
    previewField: 'idNumber',
    fields: [
      { key: 'idType', label: 'ID Type', required: true, options: GOV_ID_TYPES },
      { key: 'idNumber', label: 'ID Number', required: true, sensitive: true, placeholder: 'ID number' },
      { key: 'fullName', label: 'Full Name', placeholder: 'Name as on ID' },
      { key: 'dateOfBirth', label: 'Date of Birth', placeholder: 'DD/MM/YYYY' },
      { key: 'issuingAuthority', label: 'Issuing Authority', placeholder: 'e.g., UIDAI, Passport Office' },
      { key: 'issueDate', label: 'Issue Date', placeholder: 'DD/MM/YYYY' },
      { key: 'expiryDate', label: 'Expiry Date', placeholder: 'DD/MM/YYYY' },
      { key: 'notes', label: 'Notes', multiline: true, placeholder: 'Additional notes...' },
    ],
  },
  login: {
    type: 'login',
    label: 'Login',
    icon: 'key-outline',
    previewField: 'username',
    fields: [
      { key: 'serviceName', label: 'Service/Website', required: true, placeholder: 'e.g., Gmail, Netflix' },
      { key: 'username', label: 'Username/Email', required: true, placeholder: 'Username or email' },
      { key: 'password', label: 'Password', required: true, sensitive: true, placeholder: 'Password' },
      { key: 'website', label: 'Website URL', keyboardType: 'default', placeholder: 'https://...' },
      { key: 'notes', label: 'Notes', multiline: true, placeholder: 'Security questions, recovery codes...' },
    ],
  },
  note: {
    type: 'note',
    label: 'Secure Note',
    icon: 'document-text-outline',
    fields: [
      { key: 'title', label: 'Title', required: true, placeholder: 'Note title' },
      { key: 'content', label: 'Content', required: true, multiline: true, sensitive: true, placeholder: 'Your secure note...' },
    ],
  },
  other: {
    type: 'other',
    label: 'Other',
    icon: 'ellipsis-horizontal-circle-outline',
    fields: [
      { key: 'title', label: 'Title', required: true, placeholder: 'Item title' },
      { key: 'field1', label: 'Field 1', placeholder: 'Custom field' },
      { key: 'field2', label: 'Field 2', placeholder: 'Custom field' },
      { key: 'field3', label: 'Field 3', placeholder: 'Custom field' },
      { key: 'notes', label: 'Notes', multiline: true, placeholder: 'Additional notes...' },
    ],
  },
};

// Get all item types for category selection (legacy - use DEFAULT_CATEGORIES instead)
export const VAULT_ITEM_TYPES: { type: VaultItemType; label: string; icon: string }[] = 
  Object.values(ITEM_TYPE_CONFIGS).map(config => ({
    type: config.type,
    label: config.label,
    icon: config.icon,
  }));

// Default preset categories with full configuration
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
      { key: 'accountHolder', label: 'Account Holder Name', placeholder: 'Full name as on account' },
      { key: 'accountNumber', label: 'Account Number', required: true, sensitive: true, keyboardType: 'numeric', placeholder: 'Account number' },
      { key: 'accountType', label: 'Account Type', options: BANK_ACCOUNT_TYPES },
      { key: 'ifsc', label: 'IFSC Code', placeholder: 'e.g., HDFC0001234', maxLength: 11 },
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
      { key: 'cardNickname', label: 'Card Nickname', required: true, placeholder: 'e.g., Personal HDFC Credit' },
      { key: 'brand', label: 'Card Brand', options: CARD_BRANDS },
      { key: 'lastFourDigits', label: 'Last 4 Digits', required: true, keyboardType: 'numeric', maxLength: 4, placeholder: '1234' },
      { key: 'expiryMonth', label: 'Expiry Month', keyboardType: 'numeric', maxLength: 2, placeholder: 'MM' },
      { key: 'expiryYear', label: 'Expiry Year', keyboardType: 'numeric', maxLength: 4, placeholder: 'YYYY' },
      { key: 'cardholderName', label: 'Cardholder Name', placeholder: 'Name as on card' },
      { key: 'billingAddress', label: 'Billing Address', multiline: true, placeholder: 'Billing address...' },
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
      { key: 'idNumber', label: 'ID Number', required: true, sensitive: true, placeholder: 'ID number' },
      { key: 'fullName', label: 'Full Name', placeholder: 'Name as on ID' },
      { key: 'dateOfBirth', label: 'Date of Birth', placeholder: 'DD/MM/YYYY' },
      { key: 'issuingAuthority', label: 'Issuing Authority', placeholder: 'e.g., UIDAI, Passport Office' },
      { key: 'issueDate', label: 'Issue Date', placeholder: 'DD/MM/YYYY' },
      { key: 'expiryDate', label: 'Expiry Date', placeholder: 'DD/MM/YYYY' },
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
      { key: 'serviceName', label: 'Service/Website', required: true, placeholder: 'e.g., Gmail, Netflix' },
      { key: 'username', label: 'Username/Email', required: true, placeholder: 'Username or email' },
      { key: 'password', label: 'Password', required: true, sensitive: true, placeholder: 'Password' },
      { key: 'website', label: 'Website URL', keyboardType: 'default', placeholder: 'https://...' },
      { key: 'notes', label: 'Notes', multiline: true, placeholder: 'Security questions, recovery codes...' },
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
      { key: 'content', label: 'Content', required: true, multiline: true, sensitive: true, placeholder: 'Your secure note...' },
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
export const CATEGORY_ICONS = [
  'business-outline',
  'card-outline',
  'id-card-outline',
  'key-outline',
  'document-text-outline',
  'ellipsis-horizontal-circle-outline',
  'wallet-outline',
  'home-outline',
  'car-outline',
  'medkit-outline',
  'school-outline',
  'briefcase-outline',
  'globe-outline',
  'wifi-outline',
  'lock-closed-outline',
  'shield-checkmark-outline',
  'person-outline',
  'people-outline',
  'heart-outline',
  'star-outline',
  'bookmark-outline',
  'folder-outline',
  'gift-outline',
  'airplane-outline',
  'fitness-outline',
  'restaurant-outline',
  'musical-notes-outline',
  'game-controller-outline',
  'camera-outline',
  'desktop-outline',
];

// Available colors for custom categories
export const CATEGORY_COLORS = [
  { name: 'Blue', gradientStart: '#3B82F6', gradientEnd: '#60A5FA', bg: '#DBEAFE', icon: '#3B82F6', text: '#1E40AF' },
  { name: 'Red', gradientStart: '#EF4444', gradientEnd: '#F87171', bg: '#FEE2E2', icon: '#EF4444', text: '#991B1B' },
  { name: 'Green', gradientStart: '#10B981', gradientEnd: '#34D399', bg: '#D1FAE5', icon: '#10B981', text: '#065F46' },
  { name: 'Purple', gradientStart: '#6366F1', gradientEnd: '#818CF8', bg: '#E0E7FF', icon: '#6366F1', text: '#3730A3' },
  { name: 'Yellow', gradientStart: '#F59E0B', gradientEnd: '#FBBF24', bg: '#FEF3C7', icon: '#F59E0B', text: '#92400E' },
  { name: 'Pink', gradientStart: '#EC4899', gradientEnd: '#F472B6', bg: '#FCE7F3', icon: '#EC4899', text: '#9D174D' },
  { name: 'Cyan', gradientStart: '#06B6D4', gradientEnd: '#22D3EE', bg: '#CFFAFE', icon: '#06B6D4', text: '#0E7490' },
  { name: 'Orange', gradientStart: '#F97316', gradientEnd: '#FB923C', bg: '#FFEDD5', icon: '#F97316', text: '#9A3412' },
  { name: 'Violet', gradientStart: '#A855F7', gradientEnd: '#C084FC', bg: '#F3E8FF', icon: '#A855F7', text: '#6B21A8' },
  { name: 'Teal', gradientStart: '#14B8A6', gradientEnd: '#2DD4BF', bg: '#CCFBF1', icon: '#14B8A6', text: '#0F766E' },
];

// Sensitive field keys that should be masked by default
export const SENSITIVE_FIELDS = new Set([
  'accountNumber',
  'idNumber',
  'password',
  'content',
]);

// Fields that show masked preview in list
export const PREVIEW_MASK_LENGTH = 4;

