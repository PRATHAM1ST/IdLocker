/**
 * Hook for auto-saving form data with debounce
 * Manages save status and handles validation
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
  dependencies: T[];
  saveFn: () => Promise<boolean>;
  debounceMs?: number;
  enabled?: boolean;
  onSaveComplete?: (success: boolean) => void;
}

export function useAutoSave<T>({
  dependencies,
  saveFn,
  debounceMs = 500,
  enabled = true,
  onSaveComplete,
}: UseAutoSaveOptions<T>): SaveStatus {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const savedIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (savedIndicatorTimeoutRef.current) {
        clearTimeout(savedIndicatorTimeoutRef.current);
      }
    };
  }, []);

  // Auto-save effect with debounce
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Clear saved indicator timeout if it exists
    if (savedIndicatorTimeoutRef.current) {
      clearTimeout(savedIndicatorTimeoutRef.current);
      savedIndicatorTimeoutRef.current = null;
    }

    // Don't save if disabled
    if (!enabled) {
      return;
    }

    // Set status to saving after debounce
    timeoutRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;

      setSaveStatus('saving');

      try {
        const success = await saveFn();

        if (!isMountedRef.current) return;

        if (success) {
          setSaveStatus('saved');
          onSaveComplete?.(true);

          // Auto-hide "saved" indicator after 2 seconds
          savedIndicatorTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setSaveStatus('idle');
            }
          }, 2000);
        } else {
          setSaveStatus('error');
          onSaveComplete?.(false);
        }
      } catch (error) {
        if (!isMountedRef.current) return;
        setSaveStatus('error');
        onSaveComplete?.(false);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  return saveStatus;
}

