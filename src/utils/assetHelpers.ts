/**
 * Helper utilities for working with centralized assets.
 */

import type { Asset, ImageAttachment } from './types';

/**
 * Convert an `Asset` into the legacy `ImageAttachment` shape expected by
 * the image tools when the asset represents an image. Returns null if the
 * asset is missing required metadata.
 */
export function assetToImageAttachment(asset: Asset | null): ImageAttachment | null {
  if (!asset || asset.type !== 'image') {
    return null;
  }

  const width = asset.width ?? 0;
  const height = asset.height ?? 0;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return {
    id: asset.id,
    uri: asset.uri,
    filename: asset.filename,
    width,
    height,
    createdAt: asset.createdAt,
  };
}
