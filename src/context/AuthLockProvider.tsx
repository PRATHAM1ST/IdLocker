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
import { AppState, AppStateStatus, Platform, View, PanResponder, Modal, StyleSheet, TouchableOpacity, Text } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import type { AuthState, AppSettings } from '../utils/types';
import { loadSettings, updateSettings } from '../storage/vaultStorage';
import { logger } from '../utils/logger';
import { DEFAULT_SETTINGS } from '../utils/constants';

// Countdown timer duration in seconds for logout warning
const LOGOUT_WARNING_SECONDS = 20;

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
  setAutoLockTimeout: (timeout: number) => Promise<void>;
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
  
  // Logout warning state
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const [countdown, setCountdown] = useState(LOGOUT_WARNING_SECONDS);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
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
        
        // Hide warning if app goes to background
        if (showLogoutWarning) {
          setShowLogoutWarning(false);
          setCountdown(LOGOUT_WARNING_SECONDS);
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
        }
      } else if (nextAppState === 'active') {
        // App coming to foreground - check if we should show warning
        if (backgroundTimeRef.current && !isLocked) {
          const backgroundDuration = Date.now() - backgroundTimeRef.current;
          const timeoutMs = autoLockTimeout * 1000;
          
          if (backgroundDuration >= timeoutMs) {
            logger.info('Background timeout reached - showing warning');
            // Show warning dialog instead of directly locking
            setCountdown(LOGOUT_WARNING_SECONDS);
            setShowLogoutWarning(true);
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
  }, [autoLockTimeout, showLogoutWarning, isLocked]);

  // Show logout warning with countdown
  const showLogoutWarningDialog = useCallback(() => {
    if (showLogoutWarning || isLocked) return;
    
    logger.info('Showing logout warning dialog');
    setCountdown(LOGOUT_WARNING_SECONDS);
    setShowLogoutWarning(true);
  }, [showLogoutWarning, isLocked]);

  // Handle staying logged in
  const handleStayLoggedIn = useCallback(() => {
    logger.info('User chose to stay logged in');
    setShowLogoutWarning(false);
    setCountdown(LOGOUT_WARNING_SECONDS);
    lastActivityRef.current = Date.now();
    
    // Clear countdown timer
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  // Handle logout (lock)
  const handleLogout = useCallback(() => {
    logger.info('User chose to log out');
    setShowLogoutWarning(false);
    setCountdown(LOGOUT_WARNING_SECONDS);
    setIsLocked(true);
    setError(null);
    
    // Clear countdown timer
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    
    logger.authEvent('lock', true);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!showLogoutWarning) {
      // Clear timer when warning is not shown
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      return;
    }

    // Start countdown
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto-lock when countdown reaches 0
          handleLogout();
          return LOGOUT_WARNING_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [showLogoutWarning, handleLogout]);

  // Idle timeout tracking (when app is in foreground)
  useEffect(() => {
    if (isLocked || showLogoutWarning) {
      // Clear timer when locked or warning is shown
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
        logger.info('Idle timeout reached - showing warning');
        showLogoutWarningDialog();
      }
    }, 10000);
    
    return () => {
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
      }
    };
  }, [isLocked, autoLockTimeout, showLogoutWarning, showLogoutWarningDialog]);

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

  // Update auto-lock timeout (persists to storage and updates context)
  const updateAutoLockTimeout = useCallback(async (timeout: number) => {
    setAutoLockTimeout(timeout);
    await updateSettings({ autoLockTimeout: timeout });
    // Reset activity so the new timeout takes effect from now
    lastActivityRef.current = Date.now();
    logger.debug('Auto-lock timeout updated:', timeout);
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
      setAutoLockTimeout: updateAutoLockTimeout,
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
      updateAutoLockTimeout,
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
        
        {/* Logout Warning Modal */}
        <Modal
          visible={showLogoutWarning}
          transparent
          animationType="fade"
          onRequestClose={handleStayLoggedIn}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.timerCircle}>
                <Text style={styles.timerText}>{countdown}</Text>
              </View>
              
              <Text style={styles.modalTitle}>Session Timeout</Text>
              <Text style={styles.modalMessage}>
                You will be logged out due to inactivity.{'\n'}
                Would you like to stay logged in?
              </Text>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.logoutButton]}
                  onPress={handleLogout}
                >
                  <Text style={styles.logoutButtonText}>Log Out</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.stayButton]}
                  onPress={handleStayLoggedIn}
                >
                  <Text style={styles.stayButtonText}>Stay Logged In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </AuthLockContext.Provider>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 3,
    borderColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ef4444',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  stayButton: {
    backgroundColor: '#3b82f6',
  },
  stayButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

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

