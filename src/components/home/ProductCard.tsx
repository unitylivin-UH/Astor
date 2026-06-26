import type { Product } from '@/data/static-cms'
import { stripHtml } from '@/lib/stripHtml'
import { Badge } from '@/components/ui/badge'
import { ProductPrice } from '@/components/product/ProductPrice'
import { AddToCartButton } from '@/components/ecommerce/AddToCartButton'
import { BuyNowButton } from '@/components/ecommerce/BuyNowButton'
import { WishlistButton } from '@/components/ecommerce/WishlistButton'
import { Link } from '@tanstack/react-router'

export function ProductCard({ product }: { product: Product }) {
  const overviewText = stripHtml(product.overview ?? '')

  return (
    <article className="product-card min-w-0 max-w-full">
      <div className="group relative aspect-[1/0.82] overflow-hidden rounded-[10px] bg-gradient-to-b from-[#f8f8f6] to-[#eeeeea]">
        <Link to="/product/$slug" params={{ slug: product.slug }} className="block h-full w-full">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[250ms] ease-out group-hover:scale-[1.04]"
            />
          ) : null}
        </Link>
        <WishlistButton
          productId={product.id}
          variant="icon"
          className="absolute right-2.5 top-2.5 z-10"
        />
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <ProductPrice price={product.price} compareAtPrice={product.compareAtPrice} size="sm" />
          {product.badge && <Badge>{product.badge}</Badge>}
        </div>
        <Link to="/product/$slug" params={{ slug: product.slug }}>
          <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-text-brown">{product.name}</h3>
        </Link>
        {overviewText ? (
          <p className="line-clamp-1 text-xs leading-5 text-muted">{overviewText}</p>
        ) : null}
        <div className="flex min-w-0 flex-wrap gap-2 pt-1">
          <AddToCartButton product={product} className="min-w-0 flex-1" />
          <BuyNowButton product={product} />
        </div>
      </div>
    </article>
  )
}
