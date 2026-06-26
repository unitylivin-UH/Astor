import { BrandedSelect } from '@/components/ui/BrandedSelect'
import { cn } from '@/lib/utils'

export type CollectionFilterState = {
  minPrice: string
  maxPrice: string
  inStockOnly: boolean
  sort: string
}

type CollectionFiltersProps = {
  value: CollectionFilterState
  onChange: (next: CollectionFilterState) => void
}

const SORT_OPTIONS = [
  { value: 'default', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A–Z' },
]

const fieldLabelClass = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted'

const filterControlClass =
  'flex h-10 items-center justify-between gap-3 rounded-md border border-[#d7c7b4]/60 bg-white px-3 text-sm text-text-brown transition focus-visible:border-cta-brown/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-brown/20'

const filterSelectTriggerClass =
  '!h-10 !min-h-10 !gap-3 !px-3 !py-0 !border-[#d7c7b4]/60 !shadow-none focus-visible:!border-cta-brown/40 focus-visible:!shadow-none focus-visible:!ring-2 focus-visible:!ring-cta-brown/20'

const rangeInputClass =
  'min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-text-brown placeholder:text-muted/80 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

export function CollectionFilters({ value, onChange }: CollectionFiltersProps) {
  return (
    <div className="mb-8 border-b border-[#e8e0d4] pb-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-5">
        <div className="w-full lg:max-w-[240px]">
          <label className={fieldLabelClass} htmlFor="collection-price-min">
            Price range
          </label>
          <div className="flex h-10 items-stretch overflow-hidden rounded-md border border-[#d7c7b4]/60 bg-white focus-within:border-cta-brown/40 focus-within:ring-2 focus-within:ring-cta-brown/20">
            <input
              id="collection-price-min"
              type="number"
              min="0"
              inputMode="decimal"
              value={value.minPrice}
              onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
              placeholder="Min"
              className={cn(rangeInputClass, 'text-left')}
              aria-label="Minimum price"
            />
            <span className="flex w-8 shrink-0 items-center justify-center border-x border-[#e8e0d4] bg-soft-beige/60 text-xs font-medium text-muted">
              –
            </span>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              value={value.maxPrice}
              onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
              placeholder="Max"
              className={cn(rangeInputClass, 'text-right')}
              aria-label="Maximum price"
            />
          </div>
        </div>

        <div className="w-fit max-w-full">
          <span className={fieldLabelClass}>Sort</span>
          <BrandedSelect
            aria-label="Sort products"
            value={value.sort}
            onValueChange={(sort) => onChange({ ...value, sort })}
            options={SORT_OPTIONS}
            variant="storefront"
            triggerClassName={filterSelectTriggerClass}
          />
        </div>

        <div className="w-fit max-w-full">
          <span className={fieldLabelClass} id="collection-stock-label">
            Stock
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={value.inStockOnly}
            aria-labelledby="collection-stock-label"
            onClick={() => onChange({ ...value, inStockOnly: !value.inStockOnly })}
            className={cn(
              filterControlClass,
              'w-full min-w-[11.5rem]',
              value.inStockOnly && 'border-cta-brown/40',
            )}
          >
            <span className="truncate">{value.inStockOnly ? 'In stock only' : 'All items'}</span>
            <span
              aria-hidden
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
                value.inStockOnly ? 'bg-cta-brown' : 'bg-[#e8e0d4]',
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                  value.inStockOnly ? 'translate-x-[18px]' : 'translate-x-0.5',
                )}
              />
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
