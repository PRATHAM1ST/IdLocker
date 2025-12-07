/**
 * Safe logging utility that redacts sensitive information
 * Never logs actual sensitive values in production
 */

import { SENSITIVE_FIELDS } from './constants';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Check if we're in development mode
const isDev = __DEV__;

// Sensitive patterns to redact
const SENSITIVE_PATTERNS = [
  /\b\d{12,16}\b/g, // Account/card numbers
  /\b[A-Z]{5}\d{4}[A-Z]\b/g, // PAN
  /\b\d{4}\s?\d{4}\s?\d{4}\b/g, // Aadhaar
  /password/gi,
  /secret/gi,
  /token/gi,
];

/**
 * Redact sensitive values from an object
 */
function redactObject(obj: unknown, depth = 0): unknown {
  if (depth > 5) return '[MAX_DEPTH]';

  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    let redacted = obj;
    for (const pattern of SENSITIVE_PATTERNS) {
      redacted = redacted.replace(pattern, '[REDACTED]');
    }
    return redacted;
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Redact known sensitive field keys
      if (SENSITIVE_FIELDS.has(key) || key.toLowerCase().includes('password')) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactObject(value, depth + 1);
      }
    }
    return redacted;
  }

  return '[UNKNOWN_TYPE]';
}

/**
 * Format log arguments safely
 */
function formatArgs(args: unknown[]): unknown[] {
  return args.map((arg) => {
    if (typeof arg === 'object') {
      return redactObject(arg);
    }
    if (typeof arg === 'string') {
      let redacted = arg;
      for (const pattern of SENSITIVE_PATTERNS) {
        redacted = redacted.replace(pattern, '[REDACTED]');
      }
      return redacted;
    }
    return arg;
  });
}

/**
 * Log with timestamp and level
 */
function log(level: LogLevel, ...args: unknown[]): void {
  if (!isDev && level === 'debug') return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  const safeArgs = formatArgs(args);

  switch (level) {
    case 'debug':
      console.debug(prefix, ...safeArgs);
      break;
    case 'info':
      console.info(prefix, ...safeArgs);
      break;
    case 'warn':
      console.warn(prefix, ...safeArgs);
      break;
    case 'error':
      console.error(prefix, ...safeArgs);
      break;
  }
}

/**
 * Logger utility with safe logging methods
 */
export const logger = {
  debug: (...args: unknown[]) => log('debug', ...args),
  info: (...args: unknown[]) => log('info', ...args),
  warn: (...args: unknown[]) => log('warn', ...args),
  error: (...args: unknown[]) => log('error', ...args),

  // Log vault operations without exposing data
  vaultOperation: (operation: string, itemCount?: number) => {
    log(
      'info',
      `Vault operation: ${operation}`,
      itemCount !== undefined ? `(${itemCount} items)` : '',
    );
  },

  // Log auth events
  authEvent: (event: string, success: boolean) => {
    log('info', `Auth event: ${event}`, success ? 'SUCCESS' : 'FAILED');
  },

  // Log navigation events
  navigation: (screen: string) => {
    log('debug', `Navigate to: ${screen}`);
  },
};

export default logger;
