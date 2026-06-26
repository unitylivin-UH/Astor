import { SiteHeader } from '@/components/layout/SiteHeader'
import { TextMarquee } from '@/components/layout/TextMarquee'
import { ProductPrice } from '@/components/product/ProductPrice'
import { Badge } from '@/components/ui/badge'
import { BundlePurchaseActions } from '@/components/bundle/BundlePurchaseActions'
import type { ProductBundle } from '@/data/static-cms'
import type { BundleSelection } from '@/lib/stores/cart-store'

type BundleDetailHeroProps = {
  bundle: ProductBundle
  selections: BundleSelection[]
  availableQuantity: number
  marqueeText: string
}

export function BundleDetailHero({ bundle, selections, availableQuantity, marqueeText }: BundleDetailHeroProps) {
  return (
    <section className="relative bg-hero-brown text-white">
      <SiteHeader />

      <div className="relative flex min-h-[55vh] flex-col md:min-h-[75vh]">
        <div className="absolute inset-0 top-16 md:top-20">
          {bundle.imageUrl ? (
            <img
              src={bundle.imageUrl}
              alt={bundle.name}
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <div className="h-full w-full bg-[#f3f1ec]" />
          )}
        </div>

        <div className="relative z-10 flex flex-1 flex-col">
          <div className="flex flex-1 flex-col justify-end px-6 pb-8 pt-20 md:justify-start md:px-14 md:pb-10 md:pt-28">
            <div className="ml-auto w-full max-w-[420px] rounded-xl bg-white/95 p-5 text-text-brown shadow-lg backdrop-blur-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <ProductPrice price={bundle.price} compareAtPrice={bundle.compareAtPrice} size="lg" />
                {bundle.badge ? <Badge>{bundle.badge}</Badge> : <Badge>Bundle</Badge>}
              </div>
              <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight">{bundle.name}</h1>
              {bundle.overview ? (
                <p className="mt-2 text-sm text-muted">{bundle.overview}</p>
              ) : null}
              <p className="mt-2 text-xs font-semibold text-muted">
                {availableQuantity > 0 ? `${availableQuantity} bundle(s) available` : 'Out of stock'}
              </p>
              <BundlePurchaseActions
                bundle={bundle}
                selections={selections}
                inventory={availableQuantity}
                className="mt-5"
              />
            </div>
          </div>

          <TextMarquee text={marqueeText} />
        </div>
      </div>
    </section>
  )
}
