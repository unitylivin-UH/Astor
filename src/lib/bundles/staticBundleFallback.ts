import type { CmsSnapshot, ProductBundle, ProductBundleItem } from '@/data/static-cms'
import { getProductBySlug } from '@/lib/cms/loadCmsSnapshot'
import { bundleItemRequiresSelection } from '@/lib/bundles/mapBundle'

export type BundleSelection = {
  bundleItemId: string
  variantId: string
}

function itemInventory(item: ProductBundleItem, selections: BundleSelection[]): number {
  if (item.variantId) {
    const variant = item.product.variants?.find((v) => v.id === item.variantId)
    return variant?.inventoryCount ?? item.product.inventoryCount
  }

  const selected = selections.find((s) => s.bundleItemId === item.id)
  if (selected) {
    const variant = item.product.variants?.find((v) => v.id === selected.variantId)
    if (variant) return variant.inventoryCount
  }

  return item.product.inventoryCount
}

export function computeStaticBundleAvailableQuantity(
  bundle: ProductBundle,
  selections: BundleSelection[] = [],
): number {
  if (!bundle.items.length) return 0

  let max: number | null = null
  for (const item of bundle.items) {
    if (bundleItemRequiresSelection(item) && !selections.some((s) => s.bundleItemId === item.id)) {
      return 0
    }
    const inventory = itemInventory(item, selections)
    const candidate = Math.floor(inventory / Math.max(1, item.quantity))
    max = max == null ? candidate : Math.min(max, candidate)
  }
  return max ?? 0
}

export function listStaticBundles(snapshot: CmsSnapshot, limit: number, offset: number) {
  const published = snapshot.bundles
    .filter((b) => b.published)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
  return {
    items: published.slice(offset, offset + limit),
    total: published.length,
  }
}

export function getStaticBundleBySlug(snapshot: CmsSnapshot, slug: string): ProductBundle | null {
  const bundle = snapshot.bundles.find((b) => b.slug === slug && b.published)
  if (!bundle) return null

  const items = bundle.items.map((item) => {
    const fullProduct = snapshot.products.find((p) => p.id === item.productId)
    return {
      ...item,
      product: {
        ...item.product,
        variants: fullProduct?.variants,
      },
    }
  })

  return {
    ...bundle,
    items,
    availableQuantity: computeStaticBundleAvailableQuantity({ ...bundle, items }),
  }
}

export function validateBundleSelections(bundle: ProductBundle, selections: BundleSelection[]): string | null {
  for (const item of bundle.items) {
    if (!bundleItemRequiresSelection(item)) continue
    const selected = selections.find((s) => s.bundleItemId === item.id)
    if (!selected?.variantId) {
      return `Please select an option for ${item.label ?? item.product.name}`
    }
    const variant = item.product.variants?.find((v) => v.id === selected.variantId)
    if (!variant) return `Invalid selection for ${item.product.name}`
  }
  return null
}

export function buildBundleComponentSummary(bundle: ProductBundle): string {
  const count = bundle.items.length
  return count === 1 ? '1 item included' : `${count} items included`
}

export function resolveBundleProductLinks(snapshot: CmsSnapshot, bundle: ProductBundle) {
  return bundle.items.map((item) => ({
    ...item,
    href: `/product/${getProductBySlug(snapshot, item.product.slug)?.slug ?? item.product.slug}`,
  }))
}
