import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import type { Product } from '@/data/static-cms'
import { ProductCard } from '@/components/home/ProductCard'
import { Button } from '@/components/ui/button'
import { productGridClasses } from '@/components/storefront/productGridClasses'

type AccountWishlistSectionProps = {
  products: Product[]
  isLoading: boolean
}

export function AccountWishlistSection({ products, isLoading }: AccountWishlistSectionProps) {
  if (isLoading) {
    return (
      <div className="mb-12 flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted" />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="mb-12 rounded-lg border border-border bg-white p-10 text-center">
        <p className="text-muted">Your wishlist is empty.</p>
        <Button asChild className="mt-4">
          <Link to="/">Browse products</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className={`product-grid mb-12 grid ${productGridClasses}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
