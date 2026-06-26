import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { ProductBundle } from '@/data/static-cms'
import type { BundleSelection } from '@/lib/stores/cart-store'
import { useCartStore } from '@/lib/stores/cart-store'
import { validateBundleSelections } from '@/lib/bundles/staticBundleFallback'
import { Button } from '@/components/ui/button'

type BundlePurchaseActionsProps = {
  bundle: ProductBundle
  selections?: BundleSelection[]
  inventory?: number
  className?: string
  compact?: boolean
}

export function BundlePurchaseActions({
  bundle,
  selections = [],
  inventory,
  className,
  compact = false,
}: BundlePurchaseActionsProps) {
  const addBundleItem = useCartStore((s) => s.addBundleItem)
  const navigate = useNavigate()
  const available = inventory ?? bundle.availableQuantity
  const validationError = validateBundleSelections(bundle, selections)
  const disabled = available <= 0 || Boolean(validationError)

  const selection = useMemo(() => ({ bundle, selections }), [bundle, selections])

  const label = validationError
    ? 'Select options'
    : available <= 0
      ? 'Out of stock'
      : compact
        ? 'Add to Cart'
        : 'Add Bundle to Cart'

  return (
    <div className={className}>
      <div className={`flex gap-3 ${compact ? 'min-w-0 flex-wrap' : 'max-w-sm'}`}>
        <Button
          type="button"
          variant="secondary"
          size="product"
          className="min-w-0 flex-1"
          disabled={disabled}
          onClick={() => {
            const result = addBundleItem(selection)
            if (!result.ok) {
              toast.error(result.error)
              return
            }
            toast.success(`${bundle.name} added to cart`)
          }}
        >
          {label}
        </Button>
        {!compact && (
          <Button
            type="button"
            variant="default"
            size="product"
            className="min-w-0 flex-1"
            disabled={disabled}
            onClick={() => {
              const result = addBundleItem(selection, 1)
              if (!result.ok) {
                toast.error(result.error)
                return
              }
              void navigate({ to: '/checkout' })
            }}
          >
            Buy Now
          </Button>
        )}
      </div>
    </div>
  )
}
