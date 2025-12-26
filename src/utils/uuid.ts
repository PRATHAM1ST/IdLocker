/**
 * Centralized UUID generation utilities
 * Single source of truth for ID generation across the app
 */

/**
 * Generate a UUID v4 compatible string
 * Works in React Native without external dependencies
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a prefixed UUID (e.g., 'cat-xxxxx' for categories)
 */
export function generatePrefixedId(prefix: string): string {
  return `${prefix}-${generateUUID()}`;
}

/**
 * Generate a timestamp-based ID for assets/files
 * More compact and sortable than UUID
 */
export function generateTimestampId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}-${randomPart2}`;
}

/**
 * Alias for generateUUID - for compatibility with uuid package
 */
export const v4 = generateUUID;

