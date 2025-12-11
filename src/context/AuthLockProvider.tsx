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
