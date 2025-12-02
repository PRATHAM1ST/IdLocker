/**
 * Item detail screen - displays all fields with copy/show functionality
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeThemedView } from '../../../src/components/ThemedView';
import { ThemedText } from '../../../src/components/ThemedText';
import { SecureField } from '../../../src/components/SecureField';
import { Button, IconButton } from '../../../src/components/Button';
import { useTheme } from '../../../src/context/ThemeProvider';
import { useVault } from '../../../src/context/VaultProvider';
import { spacing, borderRadius, getCategoryColor } from '../../../src/styles/theme';
import { ITEM_TYPE_CONFIGS, SENSITIVE_FIELDS } from '../../../src/utils/constants';
import { formatCardExpiry } from '../../../src/utils/validation';
import type { VaultItem } from '../../../src/utils/types';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { getItem, deleteItem, isLoading } = useVault();

  const [isDeleting, setIsDeleting] = useState(false);

  const item = useMemo(() => getItem(id), [getItem, id]);
  
  const config = item ? ITEM_TYPE_CONFIGS[item.type] : null;
  const categoryColor = item ? getCategoryColor(item.type, isDark) : null;

  const handleEdit = useCallback(() => {
    if (item) {
      router.push(`/(vault)/edit/${item.id}` as any);
    }
  }, [item, router]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item?.label}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (item) {
              setIsDeleting(true);
              const success = await deleteItem(item.id);
              setIsDeleting(false);
              if (success) {
                router.back();
              } else {
                Alert.alert('Error', 'Failed to delete item. Please try again.');
              }
            }
          },
        },
      ]
    );
  }, [item, deleteItem, router]);

  if (!item || !config || !categoryColor) {
    return (
      <SafeThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Details' }} />
        <View style={styles.loadingContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
              <ThemedText variant="body" color="secondary" style={styles.errorText}>
                Item not found
              </ThemedText>
              <Button title="Go Back" onPress={() => router.back()} variant="outline" />
            </>
          )}
        </View>
      </SafeThemedView>
    );
  }

  // Build display fields
  const displayFields: { key: string; label: string; value: string; sensitive: boolean }[] = [];
  
  for (const fieldDef of config.fields) {
    const value = item.fields[fieldDef.key];
    if (value) {
      // Special formatting for expiry
      if (fieldDef.key === 'expiryMonth' && item.fields.expiryYear) {
        continue; // Skip month, we'll combine with year
      }
      if (fieldDef.key === 'expiryYear' && item.fields.expiryMonth) {
        displayFields.push({
          key: 'expiry',
          label: 'Expiry Date',
          value: formatCardExpiry(item.fields.expiryMonth, item.fields.expiryYear),
          sensitive: false,
        });
        continue;
      }
      
      displayFields.push({
        key: fieldDef.key,
        label: fieldDef.label,
        value,
        sensitive: fieldDef.sensitive || SENSITIVE_FIELDS.has(fieldDef.key),
      });
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeThemedView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: config.label,
          headerRight: () => (
            <IconButton
              icon="create-outline"
              onPress={handleEdit}
              color={colors.primary}
            />
          ),
        }}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header card */}
        <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
          <View style={[styles.iconContainer, { backgroundColor: categoryColor.bg }]}>
            <Ionicons
              name={config.icon as any}
              size={32}
              color={categoryColor.icon}
            />
          </View>
          <ThemedText variant="title" style={styles.itemLabel}>
            {item.label}
          </ThemedText>
          <View style={[styles.typeBadge, { backgroundColor: categoryColor.bg }]}>
            <ThemedText variant="caption" style={{ color: categoryColor.text }}>
              {config.label}
            </ThemedText>
          </View>
        </View>

        {/* Fields */}
        <View style={[styles.fieldsCard, { backgroundColor: colors.card }]}>
          <ThemedText variant="label" color="secondary" style={styles.sectionTitle}>
            Details
          </ThemedText>
          
          {displayFields.map(field => (
            <SecureField
              key={field.key}
              label={field.label}
              value={field.value}
              sensitive={field.sensitive}
              copyable
            />
          ))}
        </View>

        {/* Metadata */}
        <View style={[styles.metaCard, { backgroundColor: colors.backgroundTertiary }]}>
          <View style={styles.metaRow}>
            <ThemedText variant="caption" color="tertiary">Created</ThemedText>
            <ThemedText variant="caption" color="secondary">
              {formatDate(item.createdAt)}
            </ThemedText>
          </View>
          <View style={styles.metaRow}>
            <ThemedText variant="caption" color="tertiary">Last Updated</ThemedText>
            <ThemedText variant="caption" color="secondary">
              {formatDate(item.updatedAt)}
            </ThemedText>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Edit Item"
            onPress={handleEdit}
            variant="outline"
            icon="create-outline"
            fullWidth
            style={styles.actionButton}
          />
          <Button
            title={isDeleting ? 'Deleting...' : 'Delete Item'}
            onPress={handleDelete}
            variant="danger"
            icon="trash-outline"
            fullWidth
            loading={isDeleting}
            disabled={isDeleting}
          />
        </View>
      </ScrollView>
    </SafeThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  errorText: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  headerCard: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  itemLabel: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  fieldsCard: {
    padding: spacing.base,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metaCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
});

