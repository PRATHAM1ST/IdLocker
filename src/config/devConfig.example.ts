/**
 * Development Configuration - EXAMPLE FILE
 *
 * To enable dummy data for development:
 * 1. Copy this file to `devConfig.ts` in the same folder
 * 2. Modify the settings as needed
 * 3. The `devConfig.ts` file is gitignored and won't be pushed
 *
 * IMPORTANT: Never commit devConfig.ts to the repository!
 */

export const DEV_CONFIG = {
  /**
   * Enable dummy data loading in development mode
   * Set to true to load sample vault items for UI testing
   */
  USE_DUMMY_DATA: false,

  /**
   * Skip authentication in development (DANGEROUS - for UI testing only)
   * Set to true to bypass biometric lock
   */
  SKIP_AUTH: true,

  /**
   * Enable verbose logging
   */
  VERBOSE_LOGGING: true,
};
