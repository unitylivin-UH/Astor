import type { CartItem } from '@/lib/stores/cart-store'

export function cartItemsToRpcPayload(items: CartItem[]) {
  return items.map((item) => {
    if (item.kind === 'bundle') {
      return {
        bundle_id: item.bundleId,
        quantity: item.quantity,
        selections: (item.bundleSelections ?? []).map((s) => ({
          bundle_item_id: s.bundleItemId,
          variant_id: s.variantId,
        })),
      }
    }
    return {
      product_id: item.productId,
      variant_id: item.variantId ?? undefined,
      quantity: item.quantity,
    }
  })
}

export function cartItemDetailPath(item: CartItem): '/product/$slug' | '/bundle/$slug' {
  return item.kind === 'bundle' ? '/bundle/$slug' : '/product/$slug'
}
