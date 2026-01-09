/**
 * Helper functions for category color management
 */

import type { CategoryColor } from './types';

/**
 * Get the appropriate icon color based on theme
 * Provides backward compatibility for categories with only 'icon' property
 */
export function getCategoryIconColor(color: CategoryColor, isDark: boolean): string {
  if (isDark) {
    // @ts-ignore - backward compatibility for old 'icon' property
    return color.iconDark ?? color.iconLight ?? color.icon ?? '#FFFFFF';
  }
  // @ts-ignore - backward compatibility for old 'icon' property
  return color.iconLight ?? color.icon ?? '#000000';
}

