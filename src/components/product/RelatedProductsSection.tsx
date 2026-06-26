import { useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { Product } from '@/data/static-cms'
import { useRelatedProducts } from '@/lib/storefront/storefrontQueries'
import { ProductCard } from '@/components/home/ProductCard'
import { SectionContainer } from '@/components/layout/SectionContainer'
import { productGridClasses } from '@/components/storefront/productGridClasses'
import { cn } from '@/lib/utils'

function RelatedProductsCarousel({ products }: { products: Product[] }) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef(0)

  function goTo(next: number) {
    setIndex(Math.min(Math.max(0, next), products.length - 1))
  }

  return (
    <div className="mt-10 md:hidden">
      <div
        className="overflow-hidden"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? 0
        }}
        onTouchEnd={(e) => {
          const delta = touchStartX.current - (e.changedTouches[0]?.clientX ?? 0)
          if (delta > 48) goTo(index + 1)
          else if (delta < -48) goTo(index - 1)
        }}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {products.map((item) => (
            <div key={item.id} className="w-full shrink-0">
              <ProductCard product={item} />
            </div>
          ))}
        </div>
      </div>

      {products.length > 1 ? (
        <div className="flex justify-center gap-1.5 pt-5" role="tablist" aria-label="Related products">
          {products.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={index === i}
              aria-label={`Go to product ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                index === i ? 'w-6 bg-cta-brown' : 'w-1.5 bg-text-brown/30 hover:bg-text-brown/50',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function RelatedProductsSection({ product }: { product: Product }) {
  const { data: related = [], isLoading, isError } = useRelatedProducts(product, 4)

  if (!isLoading && !isError && related.length === 0) return null

  return (
    <section className="bg-white pb-16 pt-12 md:pt-16">
      <SectionContainer>
        <div className="mx-auto max-w-[420px] text-center">
          <h2 className="font-display text-3xl font-extrabold leading-tight text-text-brown md:text-4xl">
            You may also like
          </h2>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            More products picked for you from the same category
          </p>
        </div>

        {isLoading ? (
          <div className="mt-10 flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted" />
          </div>
        ) : isError ? (
          <p className="mt-10 text-center text-sm text-muted">Could not load related products.</p>
        ) : (
          <>
            <div className={`product-grid mt-10 hidden md:grid ${productGridClasses}`}>
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>

            <RelatedProductsCarousel products={related} />
          </>
        )}
      </SectionContainer>
    </section>
  )
}
