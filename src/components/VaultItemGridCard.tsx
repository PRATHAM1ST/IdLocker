/**
 * Vault item grid card component - squircle box design
 * Displays item info in a visually rich card format
 */

import React, { useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeProvider';
import { ThemedText } from './ThemedText';
import { spacing, borderRadius, getCategoryColor, shadows } from '../styles/theme';
import type { VaultItem } from '../utils/types';
import { ITEM_TYPE_CONFIGS } from '../utils/constants';
import { getItemPreview, formatCardExpiry } from '../utils/validation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.base * 2 - CARD_GAP) / 2;

interface VaultItemGridCardProps {
  item: VaultItem;
  onPress: (item: VaultItem) => void;
}

export function VaultItemGridCard({ item, onPress }: VaultItemGridCardProps) {
  const { colors, isDark } = useTheme();
  
  const config = ITEM_TYPE_CONFIGS[item.type];
  const categoryColor = getCategoryColor(item.type, isDark);
  const preview = useMemo(() => getItemPreview(item), [item]);
  
  // Get secondary info based on item type
  const secondaryInfo = useMemo(() => {
    switch (item.type) {
      case 'bankAccount':
        return item.fields.bankName || 'Bank Account';
      case 'card':
        const expiry = formatCardExpiry(item.fields.expiryMonth || '', item.fields.expiryYear || '');
        return expiry ? `Exp: ${expiry}` : item.fields.brand || 'Card';
      case 'govId':
        return item.fields.idType || 'Government ID';
      case 'login':
        return item.fields.serviceName || 'Login';
      case 'note':
        return 'Secure Note';
      default:
        return config.label;
    }
  }, [item, config]);

  // Format last updated time
  const lastUpdated = useMemo(() => {
    const date = new Date(item.updatedAt);
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
  }, [item.updatedAt]);

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
      {/* Gradient header section */}
      <LinearGradient
        colors={[categoryColor.gradientStart, categoryColor.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={config.icon as any}
            size={28}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.typeBadge}>
          <ThemedText style={styles.typeBadgeText}>
            {config.label}
          </ThemedText>
        </View>
      </LinearGradient>
      
      {/* Content section */}
      <View style={styles.content}>
        <ThemedText 
          variant="label" 
          numberOfLines={2} 
          style={styles.label}
        >
          {item.label}
        </ThemedText>
        
        <ThemedText 
          variant="caption" 
          color="secondary" 
          numberOfLines={1}
          style={styles.secondaryInfo}
        >
          {secondaryInfo}
        </ThemedText>
        
        <View style={styles.previewRow}>
          <ThemedText 
            variant="bodySmall" 
            color="tertiary" 
            numberOfLines={1}
            style={styles.preview}
          >
            {preview}
          </ThemedText>
        </View>
        
        {/* Footer with time */}
        <View style={styles.footer}>
          <View style={[styles.dot, { backgroundColor: categoryColor.icon }]} />
          <ThemedText variant="caption" color="tertiary" style={styles.time}>
            {lastUpdated}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: CARD_GAP,
  },
  headerGradient: {
    height: 72,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  label: {
    fontWeight: '600',
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  secondaryInfo: {
    marginBottom: spacing.xs,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  preview: {
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  time: {
    fontSize: 11,
  },
});

