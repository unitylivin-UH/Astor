import type { ProductVariant } from '@/data/static-cms'
import { cn } from '@/lib/utils'

type ProductVariantSelectorProps = {
  variants: ProductVariant[]
  selectedId: string | null
  onSelect: (variant: ProductVariant) => void
}

export function ProductVariantSelector({ variants, selectedId, onSelect }: ProductVariantSelectorProps) {
  if (variants.length === 0) return null

  return (
    <div className="mt-6 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Options</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const active = variant.id === selectedId
          const outOfStock = variant.inventoryCount <= 0
          return (
            <button
              key={variant.id}
              type="button"
              disabled={outOfStock}
              onClick={() => onSelect(variant)}
              className={cn(
                'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                active && 'border-cta-brown bg-cta-brown/10 font-semibold text-cta-brown',
                !active && !outOfStock && 'border-border bg-surface hover:border-cta-brown/50',
                outOfStock && 'cursor-not-allowed border-border/60 bg-surface/40 text-muted line-through',
              )}
            >
              <span className="block">{variant.name}</span>
              {outOfStock ? <span className="mt-0.5 block text-[10px] uppercase">Out of stock</span> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
