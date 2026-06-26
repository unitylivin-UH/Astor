import { useFormatPrice } from '@/lib/currency'
import { cn } from '@/lib/utils'

type ProductPriceProps = {
  price: number
  compareAtPrice?: number | null
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ProductPrice({ price, compareAtPrice, className, size = 'md' }: ProductPriceProps) {
  const formatPrice = useFormatPrice()
  const onSale = compareAtPrice != null && compareAtPrice > price

  const sizeClass =
    size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-lg' : 'text-lg'

  return (
    <div className={cn('flex flex-wrap items-baseline gap-2', className)}>
      <span className={cn('font-extrabold text-[#1d1813]', sizeClass)}>{formatPrice(price)}</span>
      {onSale ? (
        <span className="text-sm font-medium text-muted line-through">{formatPrice(compareAtPrice)}</span>
      ) : null}
    </div>
  )
}
