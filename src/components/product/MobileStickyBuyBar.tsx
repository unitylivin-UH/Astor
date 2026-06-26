import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useFormatPrice } from '@/lib/currency'
import { useCartStore } from '@/lib/stores/cart-store'
import type { Product, ProductVariant } from '@/data/static-cms'

type MobileStickyBuyBarProps = {
  product: Product
  variant: ProductVariant | null
  price: number
  inventory: number
}

export function MobileStickyBuyBar({ product, variant, price, inventory }: MobileStickyBuyBarProps) {
  const formatPrice = useFormatPrice()
  const addItem = useCartStore((s) => s.addItem)
  const navigate = useNavigate()

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e8e0d4] bg-white/95 p-3 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-muted">{product.name}</p>
          <p className="font-display text-lg font-extrabold">{formatPrice(price)}</p>
        </div>
        <Button
          type="button"
          className="shrink-0"
          disabled={inventory <= 0}
          onClick={() => {
            const result = addItem({ product, variant })
            if (!result.ok) {
              toast.error(result.error)
              return
            }
            toast.success('Added to cart')
            void navigate({ to: '/cart' })
          }}
        >
          {inventory <= 0 ? 'Out of stock' : 'Add to Cart'}
        </Button>
      </div>
    </div>
  )
}
