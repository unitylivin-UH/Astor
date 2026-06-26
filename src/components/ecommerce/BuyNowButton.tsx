import { useNavigate } from '@tanstack/react-router'
import type { Product } from '@/data/static-cms'
import { useCartStore } from '@/lib/stores/cart-store'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function BuyNowButton({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem)
  const navigate = useNavigate()

  return (
    <Button
      type="button"
      variant="default"
      size="product"
      className="min-w-0 flex-1"
      disabled={product.inventoryCount <= 0}
      onClick={() => {
        const result = addItem({ product, variant: null }, 1)
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        void navigate({ to: '/checkout' })
      }}
    >
      Buy Now
    </Button>
  )
}
