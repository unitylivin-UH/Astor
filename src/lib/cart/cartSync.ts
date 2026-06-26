import { getOrCreateCartSessionId } from '@/lib/cart/cartSession'
import { cartItemsToRpcPayload } from '@/lib/cart/cartPayload'
import type { CartItem } from '@/lib/stores/cart-store'
import { tryGetSupabase } from '@/integrations/supabase/client'

export async function syncCartToServer(items: CartItem[], email?: string | null, couponCode?: string | null) {
  const supabase = tryGetSupabase()
  if (!supabase) return

  const sessionId = getOrCreateCartSessionId()
  await supabase.rpc('rpc_sync_storefront_cart', {
    p_session_id: sessionId,
    p_items: cartItemsToRpcPayload(items),
    p_email: email ?? null,
    p_coupon_code: couponCode ?? null,
  })
}
