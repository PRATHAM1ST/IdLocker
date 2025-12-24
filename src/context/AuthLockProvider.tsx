/**
 * Authentication and lock state provider
 * Handles biometric auth, auto-lock on background, and idle timeout
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as LocalAuthentication from 'expo-local-authentication';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  AppStateStatus,
  Modal,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { shouldSkipAuth } from '../config';
import { loadSettings, updateSettings } from '../storage/vaultStorage';
import { borderRadius, darkColors, lightColors, spacing } from '../styles/theme';
import { DEFAULT_SETTINGS } from '../utils/constants';
import { logger } from '../utils/logger';

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
  // Theme
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  // Auth state - skip auth in dev mode if configured
  const [isLocked, setIsLocked] = useState(!shouldSkipAuth());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Biometric capabilities
  const [biometricType, setBiometricType] = useState<LocalAuthentication.AuthenticationType | null>(
    null,
  );
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
    // Log if auth is skipped in dev mode
    if (shouldSkipAuth()) {
      logger.info('🔓 Authentication DISABLED (SKIP_AUTH=true in devConfig)');
    }

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
    loadSettings().then((settings) => {
      setAutoLockTimeout(settings.autoLockTimeout);
    });
  }, []);

  // Refs for functions used in app state handler to avoid stale closures
  const lockRef = useRef(() => {
    setIsLocked(true);
    setError(null);
    logger.authEvent('lock', true);
  });

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App going to background - record time
        backgroundTimeRef.current = Date.now();
        logger.info('App backgrounded');

        // Clear idle timer when going to background (JS timers don't run in background)
        if (idleTimerRef.current) {
          clearInterval(idleTimerRef.current);
          idleTimerRef.current = null;
        }

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
        // App coming to foreground - check timeout status
        if (backgroundTimeRef.current && !isLocked) {
          const backgroundDuration = Date.now() - backgroundTimeRef.current;
          // Calculate total idle time: time idle before background + time in background
          const idleBeforeBackground = backgroundTimeRef.current - lastActivityRef.current;
          const totalIdleTime = idleBeforeBackground + backgroundDuration;
          const timeoutMs = autoLockTimeout * 1000;
          const remainingMs = timeoutMs - totalIdleTime;
          const remainingSeconds = remainingMs / 1000;

          logger.info('App resumed', {
            backgroundDuration: Math.round(backgroundDuration / 1000),
            idleBeforeBackground: Math.round(idleBeforeBackground / 1000),
            totalIdleTime: Math.round(totalIdleTime / 1000),
            timeoutSeconds: autoLockTimeout,
            remainingSeconds: Math.round(remainingSeconds),
          });

          if (remainingSeconds <= 0) {
            // Time expired - logout immediately without showing modal
            logger.info('Session expired - logging out immediately');
            lockRef.current();
          } else if (remainingSeconds <= LOGOUT_WARNING_SECONDS) {
            // Less than 20 seconds remaining - show warning with actual remaining time
            logger.info('Less than 20s remaining - showing warning', { remainingSeconds });
            setCountdown(Math.ceil(remainingSeconds));
            setShowLogoutWarning(true);
          } else {
            // More than 20 seconds remaining - continue idle tracking
            logger.info('Timeout not reached, continuing idle tracking');
          }

          backgroundTimeRef.current = null;
        } else if (!isLocked) {
          // First activation or no background time recorded - reset activity
          lastActivityRef.current = Date.now();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [autoLockTimeout, showLogoutWarning, isLocked]);

  // Show logout warning with countdown (accepts remaining seconds)
  const showLogoutWarningDialog = useCallback((remainingSeconds?: number) => {
    if (showLogoutWarning || isLocked) return;

    // Use provided remaining seconds, capped at LOGOUT_WARNING_SECONDS
    const initialCountdown = remainingSeconds !== undefined 
      ? Math.min(Math.max(Math.ceil(remainingSeconds), 1), LOGOUT_WARNING_SECONDS)
      : LOGOUT_WARNING_SECONDS;

    logger.info('Showing logout warning dialog', { initialCountdown });
    setCountdown(initialCountdown);
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

  // Store handleLogout in a ref so we can call it from the interval without stale closures
  const handleLogoutRef = useRef(handleLogout);
  useEffect(() => {
    handleLogoutRef.current = handleLogout;
  }, [handleLogout]);

  // Countdown timer effect - handles decrementing and triggers logout at zero
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
        const next = prev - 1;
        if (next <= 0) {
          // Clear interval immediately to prevent multiple calls
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          // Schedule logout on next tick to avoid state update conflicts
          setTimeout(() => {
            handleLogoutRef.current();
          }, 0);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [showLogoutWarning]);

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

    // Check for idle timeout every 1 second for accurate timing
    idleTimerRef.current = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current;
      const timeoutMs = autoLockTimeout * 1000;
      const remainingMs = timeoutMs - idleTime;
      const remainingSeconds = remainingMs / 1000;

      if (remainingSeconds <= 0) {
        // Time expired - logout immediately
        logger.info('Session expired - logging out immediately');
        lockRef.current();
      } else if (remainingSeconds <= LOGOUT_WARNING_SECONDS) {
        // Less than 20 seconds remaining - show warning with actual remaining time
        logger.info('Less than 20s remaining - showing warning', { remainingSeconds: Math.ceil(remainingSeconds) });
        showLogoutWarningDialog(remainingSeconds);
      }
    }, 1000);

    return () => {
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [isLocked, autoLockTimeout, showLogoutWarning, showLogoutWarningDialog]);

  // Reset activity on user interaction
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Unlock function
  const unlock = useCallback(async (): Promise<boolean> => {
    // Auto-unlock if auth is skipped in dev mode
    if (shouldSkipAuth()) {
      setIsLocked(false);
      logger.debug('Unlock skipped - SKIP_AUTH is enabled');
      return true;
    }

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
        const errorMessage =
          result.error === 'user_cancel'
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
    // Don't lock if auth is skipped in dev mode
    if (shouldSkipAuth()) {
      logger.debug('Lock skipped - SKIP_AUTH is enabled');
      return;
    }
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
    ],
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
    [isLocked, resetActivity],
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
          statusBarTranslucent={false}
        >
          <BlurView
            style={styles.modalOverlay}
            intensity={isDark ? 40 : 60}
            tint={isDark ? 'dark' : 'light'}
          >
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {/* Countdown Circle */}
              <View
                style={[
                  styles.timerCircle,
                  { backgroundColor: colors.error + '15', borderColor: colors.error },
                ]}
              >
                <Text style={[styles.timerText, { color: colors.error }]}>{countdown}</Text>
                <Text style={[styles.timerLabel, { color: colors.error }]}>seconds</Text>
              </View>

              <Text style={[styles.modalTitle, { color: colors.text }]}>Session Timeout</Text>
              <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                You will be logged out due to inactivity.{'\n'}
                Would you like to stay logged in?
              </Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.logoutButton,
                    {
                      backgroundColor: colors.error + '15',
                      borderColor: colors.error + '30',
                    },
                  ]}
                  onPress={handleLogout}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={18}
                    color={colors.error}
                    style={styles.buttonIcon}
                  />
                  <Text style={[styles.logoutButtonText, { color: colors.error }]}>Log Out</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.stayButton, { backgroundColor: colors.primary }]}
                  onPress={handleStayLoggedIn}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={18}
                    color="#FFFFFF"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.stayButtonText}>Stay Logged In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Modal>
      </View>
    </AuthLockContext.Provider>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  timerContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  timerCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '700',
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: -2,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  logoutButton: {
    borderWidth: 1,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  stayButton: {},
  stayButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
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
