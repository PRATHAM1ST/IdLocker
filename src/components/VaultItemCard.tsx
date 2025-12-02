/**
 * Vault item card component for list display
 * Redesigned with modern styling and larger touch targets
 */

import React, { useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeProvider';
import { ThemedText } from './ThemedText';
import { spacing, borderRadius, getCategoryColor, shadows } from '../styles/theme';
import type { VaultItem, VaultItemType } from '../utils/types';
import { ITEM_TYPE_CONFIGS } from '../utils/constants';
import { getItemPreview } from '../utils/validation';

interface VaultItemCardProps {
  item: VaultItem;
  onPress: (item: VaultItem) => void;
  showMenu?: boolean;
}

export function VaultItemCard({ item, onPress, showMenu = false }: VaultItemCardProps) {
  const { colors, isDark } = useTheme();
  
  const config = ITEM_TYPE_CONFIGS[item.type];
  const categoryColor = getCategoryColor(item.type, isDark);
  const preview = useMemo(() => getItemPreview(item), [item]);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.card },
        shadows.md,
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {/* Gradient accent bar */}
      <LinearGradient
        colors={[categoryColor.gradientStart, categoryColor.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.accentBar}
      />
      
      <View style={[styles.iconContainer, { backgroundColor: categoryColor.bg }]}>
        <Ionicons
          name={config.icon as any}
          size={22}
          color={categoryColor.icon}
        />
      </View>
      
      <View style={styles.content}>
        <ThemedText variant="label" numberOfLines={1} style={styles.label}>
          {item.label}
        </ThemedText>
        <ThemedText variant="caption" color="secondary" numberOfLines={1}>
          {preview}
        </ThemedText>
      </View>

      {showMenu ? (
        <TouchableOpacity style={styles.menuButton} activeOpacity={0.7}>
          <Ionicons
            name="ellipsis-vertical"
            size={18}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
      ) : (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textTertiary}
        />
      )}
    </TouchableOpacity>
  );
}

/**
 * Compact card variant for grouped lists
 */
export function VaultItemCardCompact({ item, onPress }: VaultItemCardProps) {
  const { colors, isDark } = useTheme();
  
  const config = ITEM_TYPE_CONFIGS[item.type];
  const categoryColor = getCategoryColor(item.type, isDark);
  const preview = useMemo(() => getItemPreview(item), [item]);

  return (
    <TouchableOpacity
      style={[
        styles.compactContainer,
        { 
          backgroundColor: colors.backgroundSecondary,
          borderBottomColor: colors.border,
        },
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.compactIcon, { backgroundColor: categoryColor.bg }]}>
        <Ionicons
          name={config.icon as any}
          size={18}
          color={categoryColor.icon}
        />
      </View>
      
      <View style={styles.compactContent}>
        <ThemedText variant="bodySmall" numberOfLines={1}>
          {item.label}
        </ThemedText>
        <ThemedText variant="caption" color="tertiary" numberOfLines={1}>
          {preview}
        </ThemedText>
      </View>
      
      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.textTertiary}
      />
    </TouchableOpacity>
  );
}

/**
 * Schedule-style card (inspired by the schedule design)
 */
interface ScheduleCardProps {
  item: VaultItem;
  onPress: (item: VaultItem) => void;
  isHighlighted?: boolean;
}

export function VaultItemScheduleCard({ item, onPress, isHighlighted = false }: ScheduleCardProps) {
  const { colors, isDark } = useTheme();
  
  const config = ITEM_TYPE_CONFIGS[item.type];
  const categoryColor = getCategoryColor(item.type, isDark);
  const preview = useMemo(() => getItemPreview(item), [item]);

  const updatedDate = new Date(item.updatedAt);
  const timeStr = updatedDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  return (
    <View style={styles.scheduleRow}>
      {/* Time column */}
      <View style={styles.scheduleTime}>
        <ThemedText variant="body" style={{ fontWeight: '600' }}>
          {timeStr}
        </ThemedText>
      </View>

      {/* Card */}
      <TouchableOpacity
        style={[
          styles.scheduleCard,
          isHighlighted 
            ? { backgroundColor: categoryColor.gradientStart }
            : { backgroundColor: colors.card },
          shadows.sm,
        ]}
        onPress={() => onPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.scheduleCardHeader}>
          <ThemedText 
            variant="subtitle" 
            style={{ color: isHighlighted ? '#FFFFFF' : colors.text }}
          >
            {item.label}
          </ThemedText>
          <TouchableOpacity style={styles.menuButton} activeOpacity={0.7}>
            <Ionicons
              name="ellipsis-vertical"
              size={16}
              color={isHighlighted ? 'rgba(255,255,255,0.7)' : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
        
        <ThemedText 
          variant="caption" 
          style={{ color: isHighlighted ? 'rgba(255,255,255,0.8)' : colors.textSecondary }}
        >
          {preview}
        </ThemedText>

        <View style={styles.scheduleCardMeta}>
          <View style={styles.scheduleMetaItem}>
            <Ionicons
              name={config.icon as any}
              size={14}
              color={isHighlighted ? 'rgba(255,255,255,0.7)' : categoryColor.icon}
            />
            <ThemedText 
              variant="caption" 
              style={{ 
                color: isHighlighted ? 'rgba(255,255,255,0.7)' : colors.textSecondary,
                marginLeft: spacing.xs 
              }}
            >
              {config.label}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingLeft: spacing.sm,
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.base,
    marginVertical: spacing.xs,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  label: {
    marginBottom: 2,
  },
  menuButton: {
    padding: spacing.xs,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  compactIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  compactContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  // Schedule card styles
  scheduleRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  scheduleTime: {
    width: 60,
    paddingTop: spacing.md,
  },
  scheduleCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
  },
  scheduleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  scheduleCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  scheduleMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
