/**
 * Hook for managing auto-lock timeout updates
 */

import { useCallback } from 'react';
import { updateSettings } from '../storage/vaultStorage';
import { logger } from '../utils/logger';

/**
 * Hook to manage auto-lock settings
 */
export function useAutoLock() {
  const setAutoLockTimeout = useCallback(async (timeout: number): Promise<boolean> => {
    try {
      const result = await updateSettings({ autoLockTimeout: timeout });
      if (result) {
        logger.info('Auto-lock timeout updated:', timeout);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to update auto-lock timeout:', error);
      return false;
    }
  }, []);

  return { setAutoLockTimeout };
}
