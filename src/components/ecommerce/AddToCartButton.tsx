import type { Product } from '@/data/static-cms'
import { useCartStore } from '@/lib/stores/cart-store'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function AddToCartButton({ product, className }: { product: Product; className?: string }) {
  const addItem = useCartStore((s) => s.addItem)

  return (
    <Button
      type="button"
      variant="secondary"
      size="product"
      className={className}
      disabled={product.inventoryCount <= 0}
      onClick={() => {
        const result = addItem({ product, variant: null })
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        toast.success(`${product.name} added to cart`)
      }}
    >
      {product.inventoryCount <= 0 ? 'Out of stock' : 'Add to Cart'}
    </Button>
  )
}
