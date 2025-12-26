/**
 * Centralized formatting utilities
 * Single source of truth for data formatting across the app
 */

/**
 * Mask sensitive value for display
 * Shows only the last N characters
 */
export function maskValue(value: string, visibleChars = 4): string {
  if (!value || value.length <= visibleChars) {
    return '•'.repeat(value?.length || 4);
  }

  const masked = '•'.repeat(value.length - visibleChars);
  const visible = value.slice(-visibleChars);
  return `${masked}${visible}`;
}

/**
 * Format card expiry as MM/YY
 */
export function formatCardExpiry(month: string, year: string): string {
  if (!month || !year) return '';
  const m = month.padStart(2, '0');
  const y = year.length === 4 ? year.slice(-2) : year;
  return `${m}/${y}`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Format relative time (e.g., "2h ago", "Yesterday")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)}w ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

/**
 * Sanitize input string - remove control characters
 */
export function sanitizeInput(value: string): string {
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

