/**
 * Authentication and lock state provider
 * Handles biometric auth, auto-lock on background, and idle timeout
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { AppState, AppStateStatus, Platform, View, PanResponder } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import type { AuthState, AppSettings } from '../utils/types';
import { loadSettings } from '../storage/vaultStorage';
import { logger } from '../utils/logger';
import { DEFAULT_SETTINGS } from '../utils/constants';

interface AuthLockContextValue {
  // Auth state
  isLocked: boolean;
  isAuthenticating: boolean;
  error: string | null;
  
  // Biometric info
  biometricType: LocalAuthentication.AuthenticationType | null;
  hasBiometrics: boolean;
  
  // Actions
  unlock: () => Promise<boolean>;
  lock: () => void;
  clearError: () => void;
  resetActivity: () => void;
  
  // Settings
  autoLockTimeout: number;
}

const AuthLockContext = createContext<AuthLockContextValue | null>(null);

interface AuthLockProviderProps {
  children: React.ReactNode;
}

export function AuthLockProvider({ children }: AuthLockProviderProps) {
  // Auth state
  const [isLocked, setIsLocked] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Biometric capabilities
  const [biometricType, setBiometricType] = useState<LocalAuthentication.AuthenticationType | null>(null);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  
  // Settings
  const [autoLockTimeout, setAutoLockTimeout] = useState(DEFAULT_SETTINGS.autoLockTimeout);
  
  // Background tracking
  const backgroundTimeRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check biometric capabilities on mount
  useEffect(() => {
    const checkBiometrics = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        
        setHasBiometrics(hasHardware && isEnrolled);
        
        if (supportedTypes.length > 0) {
          // Prefer Face ID over fingerprint
          if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
          } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType(LocalAuthentication.AuthenticationType.FINGERPRINT);
          } else {
            setBiometricType(supportedTypes[0]);
          }
        }
        
        logger.info('Biometric check:', { hasHardware, isEnrolled, types: supportedTypes.length });
      } catch (err) {
        logger.error('Failed to check biometrics:', err);
      }
    };
    
    checkBiometrics();
  }, []);

  // Load settings on mount
  useEffect(() => {
    loadSettings().then(settings => {
      setAutoLockTimeout(settings.autoLockTimeout);
    });
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App going to background - record time
        backgroundTimeRef.current = Date.now();
        logger.info('App backgrounded');
      } else if (nextAppState === 'active') {
        // App coming to foreground - check if we should lock
        if (backgroundTimeRef.current) {
          const backgroundDuration = Date.now() - backgroundTimeRef.current;
          const timeoutMs = autoLockTimeout * 1000;
          
          if (backgroundDuration >= timeoutMs) {
            logger.info('Auto-locking after background timeout');
            setIsLocked(true);
            setError(null);
          }
          
          backgroundTimeRef.current = null;
        }
        
        // Reset activity timer
        lastActivityRef.current = Date.now();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [autoLockTimeout]);

  // Idle timeout tracking (when app is in foreground)
  useEffect(() => {
    if (isLocked) {
      // Clear timer when locked
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      return;
    }
    
    // Check for idle timeout every 10 seconds
    idleTimerRef.current = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current;
      const timeoutMs = autoLockTimeout * 1000;
      
      if (idleTime >= timeoutMs) {
        logger.info('Auto-locking after idle timeout');
        setIsLocked(true);
        setError(null);
      }
    }, 10000);
    
    return () => {
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
      }
    };
  }, [isLocked, autoLockTimeout]);

  // Reset activity on user interaction
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Unlock function
  const unlock = useCallback(async (): Promise<boolean> => {
    if (isAuthenticating) return false;
    
    setIsAuthenticating(true);
    setError(null);
    
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock IdLocker',
        fallbackLabel: 'Use device passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false, // Allow PIN/pattern/password fallback
      });
      
      if (result.success) {
        setIsLocked(false);
        lastActivityRef.current = Date.now();
        logger.authEvent('unlock', true);
        return true;
      } else {
        const errorMessage = result.error === 'user_cancel' 
          ? 'Authentication cancelled'
          : result.error === 'lockout'
            ? 'Too many attempts. Try again later.'
            : 'Authentication failed';
        setError(errorMessage);
        logger.authEvent('unlock', false);
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication error';
      setError(errorMessage);
      logger.error('Auth error:', err);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating]);

  // Lock function
  const lock = useCallback(() => {
    setIsLocked(true);
    setError(null);
    logger.authEvent('lock', true);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      isLocked,
      isAuthenticating,
      error,
      biometricType,
      hasBiometrics,
      unlock,
      lock,
      clearError,
      resetActivity,
      autoLockTimeout,
    }),
    [
      isLocked,
      isAuthenticating,
      error,
      biometricType,
      hasBiometrics,
      unlock,
      lock,
      clearError,
      resetActivity,
      autoLockTimeout,
    ]
  );

  // Create a PanResponder to detect any touch interaction
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: () => {
          // Reset activity on any touch, but don't capture the event
          if (!isLocked) {
            resetActivity();
          }
          return false; // Don't capture - let children handle touches
        },
        onMoveShouldSetPanResponderCapture: () => false,
      }),
    [isLocked, resetActivity]
  );

  return (
    <AuthLockContext.Provider value={value}>
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        {children}
      </View>
    </AuthLockContext.Provider>
  );
}

/**
 * Hook to access auth lock context
 */
export function useAuthLock(): AuthLockContextValue {
  const context = useContext(AuthLockContext);
  if (!context) {
    throw new Error('useAuthLock must be used within an AuthLockProvider');
  }
  return context;
}

/**
 * Get biometric type display name
 */
export function getBiometricTypeName(type: LocalAuthentication.AuthenticationType | null): string {
  if (!type) return 'Device Lock';
  
  switch (type) {
    case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    case LocalAuthentication.AuthenticationType.FINGERPRINT:
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    case LocalAuthentication.AuthenticationType.IRIS:
      return 'Iris Scanner';
    default:
      return 'Biometrics';
  }
}

