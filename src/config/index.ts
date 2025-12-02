/**
 * Configuration loader with safe fallback
 * 
 * This module attempts to load devConfig.ts if it exists.
 * If not found, it falls back to production-safe defaults.
 * 
 * Dummy data is only loaded when:
 * 1. __DEV__ is true (development mode)
 * 2. devConfig.ts exists (user has created it)
 * 3. USE_DUMMY_DATA is set to true in devConfig
 */

// Default production config - all dev features disabled
const PRODUCTION_CONFIG = {
  USE_DUMMY_DATA: false,
  SKIP_AUTH: false,
  VERBOSE_LOGGING: false,
};

// Type for the config
export interface DevConfigType {
  USE_DUMMY_DATA: boolean;
  SKIP_AUTH: boolean;
  VERBOSE_LOGGING: boolean;
}

/**
 * Load development config if available
 * Uses dynamic require with try-catch for safe fallback
 */
function loadDevConfig(): DevConfigType {
  // Only attempt to load dev config in development mode
  if (!__DEV__) {
    return PRODUCTION_CONFIG;
  }

  try {
    // Try to require the dev config
    // This will throw if the file doesn't exist
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const devConfig = require('./devConfig');
    
    if (devConfig && devConfig.DEV_CONFIG) {
      console.log('📦 [DevConfig] Loaded development configuration');
      return {
        ...PRODUCTION_CONFIG,
        ...devConfig.DEV_CONFIG,
      };
    }
  } catch (error) {
    // devConfig.ts doesn't exist - this is expected in production
    // or if user hasn't created the file yet
    console.log('📦 [DevConfig] No devConfig.ts found, using defaults');
  }

  return PRODUCTION_CONFIG;
}

// Export the loaded config
export const Config = loadDevConfig();

/**
 * Check if dummy data should be used
 */
export function shouldUseDummyData(): boolean {
  return __DEV__ && Config.USE_DUMMY_DATA;
}

/**
 * Check if auth should be skipped (dangerous - dev only)
 */
export function shouldSkipAuth(): boolean {
  return __DEV__ && Config.SKIP_AUTH;
}

/**
 * Check if verbose logging is enabled
 */
export function isVerboseLogging(): boolean {
  return __DEV__ && Config.VERBOSE_LOGGING;
}

