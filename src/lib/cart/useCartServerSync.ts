import { useEffect } from 'react'
import { useCartStore } from '@/lib/stores/cart-store'
import { syncCartToServer } from '@/lib/cart/cartSync'

export function useCartServerSync(email?: string | null, couponCode?: string | null) {
  const items = useCartStore((s) => s.items)

  useEffect(() => {
    if (items.length === 0) return
    const timer = window.setTimeout(() => {
      void syncCartToServer(items, email, couponCode)
    }, 800)
    return () => window.clearTimeout(timer)
  }, [items, email, couponCode])
}
