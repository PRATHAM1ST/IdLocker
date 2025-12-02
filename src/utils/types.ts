/**
 * Core type definitions for IdLocker vault app
 */

// Vault item types
export type VaultItemType = 'bankAccount' | 'card' | 'govId' | 'login' | 'note' | 'other';

// Government ID subtypes
export type GovIdSubtype = 
  | 'aadhaar' 
  | 'pan' 
  | 'passport' 
  | 'drivingLicense' 
  | 'voterId' 
  | 'other';

// Card brands
export type CardBrand = 
  | 'visa' 
  | 'mastercard' 
  | 'amex' 
  | 'rupay' 
  | 'discover' 
  | 'diners' 
  | 'other';

// Bank account types
export type BankAccountType = 'savings' | 'current' | 'salary' | 'fixed' | 'other';

// Image attachment for vault items
export interface ImageAttachment {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  createdAt: string;
}

// Core vault item interface
export interface VaultItem {
  id: string;
  type: VaultItemType;
  label: string;
  fields: Record<string, string>;
  images?: ImageAttachment[];
  createdAt: string;
  updatedAt: string;
}

// Vault data structure stored in SecureStore
export interface VaultData {
  version: number;
  items: VaultItem[];
}

// App settings
export interface AppSettings {
  hasCompletedOnboarding: boolean;
  autoLockTimeout: number; // seconds: 30, 60, 120, 300
  theme: 'light' | 'dark' | 'system';
}

// Field definition for dynamic forms
export interface FieldDefinition {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  sensitive?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  maxLength?: number;
  multiline?: boolean;
  options?: { value: string; label: string }[]; // For select fields
}

// Type-specific field configurations
export interface ItemTypeConfig {
  type: VaultItemType;
  label: string;
  icon: string;
  fields: FieldDefinition[];
  previewField?: string; // Field to show in list preview (masked)
}

// Vault metadata for chunked storage
export interface VaultMeta {
  version: number;
  chunkCount: number;
  lastUpdated: string;
}

// Auth lock state
export interface AuthState {
  isLocked: boolean;
  isAuthenticating: boolean;
  lastUnlockedAt: number | null;
  error: string | null;
}

// Theme colors interface
export interface ThemeColors {
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  
  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Primary
  primary: string;
  primaryDark: string;
  primaryLight: string;
  
  // Accent (coral/orange)
  accent: string;
  accentLight: string;
  
  // Status
  success: string;
  warning: string;
  error: string;
  
  // UI elements
  border: string;
  borderLight: string;
  card: string;
  cardElevated: string;
  
  // Input
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  placeholder: string;
  
  // Header gradient
  headerGradientStart: string;
  headerGradientEnd: string;
}

// Navigation params
export type RootStackParamList = {
  index: undefined;
  onboarding: undefined;
  lock: undefined;
  '(vault)': undefined;
};

export type VaultStackParamList = {
  index: undefined;
  'item/[id]': { id: string };
  add: { type?: VaultItemType };
  'edit/[id]': { id: string };
  settings: undefined;
};

// Type guards
export function isVaultItem(obj: unknown): obj is VaultItem {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'type' in obj &&
    'label' in obj &&
    'fields' in obj
  );
}

export function isVaultData(obj: unknown): obj is VaultData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'version' in obj &&
    'items' in obj &&
    Array.isArray((obj as VaultData).items)
  );
}

export function isAppSettings(obj: unknown): obj is AppSettings {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'hasCompletedOnboarding' in obj &&
    'autoLockTimeout' in obj &&
    'theme' in obj
  );
}

export function isImageAttachment(obj: unknown): obj is ImageAttachment {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'uri' in obj &&
    'filename' in obj &&
    'width' in obj &&
    'height' in obj
  );
}

