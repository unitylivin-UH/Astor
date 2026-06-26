import { describe, expect, it } from 'vitest'
import { cartItemsToRpcPayload } from '@/lib/cart/cartPayload'
import type { ProductCartItem } from '@/lib/stores/cart-store'

describe('cartItemsToRpcPayload', () => {
  it('maps product cart lines', () => {
    const item: ProductCartItem = {
      kind: 'product',
      lineKey: 'p1',
      productId: 'p1',
      variantId: null,
      variantName: null,
      slug: 'test-product',
      name: 'Test',
      price: 10,
      imageUrl: '',
      quantity: 2,
      inventoryCount: 5,
    }
    expect(cartItemsToRpcPayload([item])).toEqual([
      { product_id: 'p1', variant_id: undefined, quantity: 2 },
    ])
  })

  it('maps bundle cart lines with selections', () => {
    const item = {
      kind: 'bundle' as const,
      lineKey: 'bundle:1',
      bundleId: 'b1',
      bundleSelections: [{ bundleItemId: 'bi1', variantId: 'v1' }],
      componentSummary: '2 items included',
      slug: 'test-bundle',
      name: 'Bundle',
      price: 99,
      imageUrl: '',
      quantity: 1,
      inventoryCount: 3,
    }
    expect(cartItemsToRpcPayload([item])).toEqual([
      {
        bundle_id: 'b1',
        quantity: 1,
        selections: [{ bundle_item_id: 'bi1', variant_id: 'v1' }],
      },
    ])
  })
})
