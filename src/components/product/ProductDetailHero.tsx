import { SiteHeader } from '@/components/layout/SiteHeader'
import { TextMarquee } from '@/components/layout/TextMarquee'
import { ProductBuyBox } from '@/components/product/ProductBuyBox'
import type { Product, ProductVariant } from '@/data/static-cms'

type ProductDetailHeroProps = {
  product: Product
  heroImage: string
  activeVariant: ProductVariant | null
  displayPrice: number
  displayCompareAt: number | null
  displaySku: string | null | undefined
  displayInventory: number
  categoryName?: string | null
  categorySlug?: string | null
  parentCategoryName?: string | null
  parentCategorySlug?: string | null
  marqueeText: string
  onVariantSelect: (variant: ProductVariant) => void
}

export function ProductDetailHero({
  product,
  heroImage,
  activeVariant,
  displayPrice,
  displayCompareAt,
  displaySku,
  displayInventory,
  categoryName,
  categorySlug,
  parentCategoryName,
  parentCategorySlug,
  marqueeText,
  onVariantSelect,
}: ProductDetailHeroProps) {
  return (
    <section className="relative bg-hero-brown text-white">
      <SiteHeader />

      <div className="relative flex min-h-[55vh] flex-col md:min-h-[75vh]">
        <div className="absolute inset-0 top-16 md:top-20">
          {heroImage ? (
            <img
              src={heroImage}
              alt={product.name}
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <div className="h-full w-full bg-[#f3f1ec]" />
          )}
        </div>

        <div className="relative z-10 flex flex-1 flex-col">
          <div className="flex flex-1 flex-col justify-end px-6 pb-8 pt-20 md:justify-start md:px-14 md:pb-10 md:pt-28">
            <div className="ml-auto w-full max-w-[420px]">
              <ProductBuyBox
                product={product}
                activeVariant={activeVariant}
                displayPrice={displayPrice}
                displayCompareAt={displayCompareAt}
                displaySku={displaySku}
                displayInventory={displayInventory}
                categoryName={categoryName}
                categorySlug={categorySlug}
                parentCategoryName={parentCategoryName}
                parentCategorySlug={parentCategorySlug}
                onVariantSelect={onVariantSelect}
              />
            </div>
          </div>

          <TextMarquee text={marqueeText} />
        </div>
      </div>
    </section>
  )
}
