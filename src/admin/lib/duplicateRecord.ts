import { sectionKeyify, slugify } from '@/lib/utils'

const LABEL_COPY_SUFFIX = ' (Copy)'

/** Append " (Copy)" for display names/titles when duplicating a record. */
export function duplicateCopyLabel(label: string): string {
  const trimmed = label.trim()
  if (!trimmed) return LABEL_COPY_SUFFIX.trim()
  if (trimmed.endsWith(LABEL_COPY_SUFFIX)) return trimmed
  return `${trimmed}${LABEL_COPY_SUFFIX}`
}

/** Derive a unique slug from an existing slug (e.g. `widget` → `widget-copy`). */
export function duplicateCopySlug(slug: string): string {
  const trimmed = slug.trim()
  if (!trimmed) return 'copy'
  return slugify(`${trimmed}-copy`)
}

/** Derive a unique section key from an existing key (e.g. `hero_banner` → `hero_banner_copy`). */
export function duplicateCopySectionKey(key: string): string {
  const trimmed = key.trim()
  if (!trimmed) return 'copy'
  const base = trimmed.replace(/_copy(_\d+)?$/, '')
  return sectionKeyify(`${base}_copy`)
}

/** Derive a unique SKU from an existing SKU when duplicating products/variants. */
export function duplicateCopySku(sku: string): string {
  const trimmed = sku.trim()
  if (!trimmed) return ''
  return `${trimmed}-COPY`
}
