import { Link } from '@tanstack/react-router'
import type { ProductBundle } from '@/data/static-cms'
import { stripHtml } from '@/lib/stripHtml'
import { Badge } from '@/components/ui/badge'
import { ProductPrice } from '@/components/product/ProductPrice'
import { BundlePurchaseActions } from '@/components/bundle/BundlePurchaseActions'

export function BundleCard({ bundle }: { bundle: ProductBundle }) {
  const overviewText = stripHtml(bundle.overview ?? '')

  return (
    <article className="product-card min-w-0 max-w-full">
      <div className="group relative aspect-[1/0.82] overflow-hidden rounded-[10px] bg-gradient-to-b from-[#f8f8f6] to-[#eeeeea]">
        <Link to="/bundle/$slug" params={{ slug: bundle.slug }} className="block h-full w-full">
          {bundle.imageUrl ? (
            <img
              src={bundle.imageUrl}
              alt={bundle.name}
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[250ms] ease-out group-hover:scale-[1.04]"
            />
          ) : null}
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <ProductPrice price={bundle.price} compareAtPrice={bundle.compareAtPrice} size="sm" />
          {bundle.badge ? <Badge>{bundle.badge}</Badge> : <Badge>Bundle</Badge>}
        </div>
        <Link to="/bundle/$slug" params={{ slug: bundle.slug }}>
          <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-text-brown">{bundle.name}</h3>
        </Link>
        {overviewText ? (
          <p className="line-clamp-1 text-xs leading-5 text-muted">{overviewText}</p>
        ) : (
          <p className="line-clamp-1 text-xs leading-5 text-muted">
            {bundle.items.length} item{bundle.items.length === 1 ? '' : 's'} included
          </p>
        )}
        <BundlePurchaseActions bundle={bundle} compact className="pt-1" />
      </div>
    </article>
  )
}
