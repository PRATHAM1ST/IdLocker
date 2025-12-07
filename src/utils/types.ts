/**
 * Core type definitions for IdLocker vault app
 */

// Vault item types - now supports both preset and custom category IDs
export type VaultItemType = string;

// Preset category IDs for type checking
export const PRESET_CATEGORY_IDS = ['bankAccount', 'card', 'govId', 'login', 'note', 'other'] as const;
export type PresetCategoryId = typeof PRESET_CATEGORY_IDS[number];

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

// Image attachment for vault items (legacy - kept for backward compatibility)
export interface ImageAttachment {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  createdAt: string;
}

// ==========================================
// Centralized Asset Management Types
// ==========================================

// Supported asset types
export type AssetType = 'image' | 'pdf' | 'document';

// Centralized asset stored in vault-assets directory
export interface Asset {
  id: string;
  type: AssetType;
  filename: string;           // Storage filename (e.g., "abc123.jpg")
  originalFilename: string;   // Original name from user (e.g., "passport.jpg")
  uri: string;               // Full file path
  mimeType: string;          // MIME type (e.g., "image/jpeg", "application/pdf")
  size: number;              // File size in bytes
  hash: string;              // Content hash for deduplication
  width?: number;            // For images only
  height?: number;           // For images only
  createdAt: string;
  updatedAt: string;
}

// Reference to an asset from a vault item
export interface AssetReference {
  assetId: string;
  addedAt: string;
}

// Assets data structure stored in SecureStore
export interface AssetsData {
  version: number;
  assets: Asset[];
  migrated?: boolean;        // Flag to track if legacy images have been migrated
}

// Custom field for item-level custom fields
export interface CustomField {
  id: string;
  label: string;
  value: string;
}

// Core vault item interface
export interface VaultItem {
  id: string;
  type: VaultItemType;
  label: string;
  fields: Record<string, string>;
  customFields?: CustomField[]; // Item-level custom fields
  images?: ImageAttachment[];   // Legacy image attachments (for backward compatibility)
  assetRefs?: AssetReference[]; // References to centralized assets
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
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  prefix?: string;
  multiline?: boolean;
  options?: { value: string; label: string }[]; // For select fields
}

// Category color configuration
export interface CategoryColor {
  gradientStart: string;
  gradientEnd: string;
  bg: string;
  icon: string;
  text: string;
}

// Custom category definition (user-created or preset)
export interface CustomCategory {
  id: string;
  label: string;
  icon: string;
  color: CategoryColor;
  fields: FieldDefinition[];
  previewField?: string; // Field to show in list preview (masked)
  isPreset?: boolean; // True for built-in categories
  createdAt: string;
  updatedAt: string;
}

// Categories data structure stored in SecureStore
export interface CategoriesData {
  version: number;
  categories: CustomCategory[];
}

// Type-specific field configurations (kept for backward compatibility)
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
  categories: undefined;
  'category/[id]': { id: string };
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

export function isCustomCategory(obj: unknown): obj is CustomCategory {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'label' in obj &&
    'icon' in obj &&
    'color' in obj &&
    'fields' in obj &&
    Array.isArray((obj as CustomCategory).fields)
  );
}

export function isCategoriesData(obj: unknown): obj is CategoriesData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'version' in obj &&
    'categories' in obj &&
    Array.isArray((obj as CategoriesData).categories)
  );
}

export function isAsset(obj: unknown): obj is Asset {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'type' in obj &&
    'filename' in obj &&
    'uri' in obj &&
    'hash' in obj
  );
}

export function isAssetsData(obj: unknown): obj is AssetsData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'version' in obj &&
    'assets' in obj &&
    Array.isArray((obj as AssetsData).assets)
  );
}

export function isAssetReference(obj: unknown): obj is AssetReference {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'assetId' in obj &&
    'addedAt' in obj
  );
}

