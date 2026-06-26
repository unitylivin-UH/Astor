import { useQuery } from '@tanstack/react-query'
import { tryGetSupabase } from '@/integrations/supabase/client'
import { cartItemsToRpcPayload } from '@/lib/cart/cartPayload'
import type { CartItem } from '@/lib/stores/cart-store'

export type CartTotals = {
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
  currency: string
  couponCode: string | null
}

export function useCartTotals(
  items: CartItem[],
  shippingCountry: string | null,
  couponCode: string | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['cart-totals', items, shippingCountry, couponCode],
    queryFn: async (): Promise<CartTotals> => {
      const sb = tryGetSupabase()
      if (!sb || items.length === 0) {
        const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
        return { subtotal, discount: 0, shipping: 0, tax: 0, total: subtotal, currency: 'USD', couponCode: null }
      }
      const { data, error } = await sb.rpc('rpc_get_cart_totals', {
        p_items: cartItemsToRpcPayload(items),
        p_shipping_country: shippingCountry ?? undefined,
        p_coupon_code: couponCode ?? undefined,
      })
      if (error || !(data as { ok?: boolean })?.ok) {
        throw new Error((data as { error?: string })?.error ?? error?.message ?? 'Could not calculate totals')
      }
      const result = data as {
        subtotal: number
        discount?: number
        shipping?: number
        tax?: number
        total: number
        currency: string
        coupon_code?: string | null
      }
      return {
        subtotal: Number(result.subtotal),
        discount: Number(result.discount ?? 0),
        shipping: Number(result.shipping ?? 0),
        tax: Number(result.tax ?? 0),
        total: Number(result.total),
        currency: result.currency,
        couponCode: result.coupon_code ?? null,
      }
    },
    enabled: enabled && items.length > 0,
    staleTime: 15_000,
  })
}
