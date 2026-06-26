import { Link } from '@tanstack/react-router'
import { BundleCard } from '@/components/bundle/BundleCard'
import { productGridClasses } from '@/components/storefront/productGridClasses'
import { useStorefrontBundleList } from '@/lib/storefront/storefrontQueries'
import { Loader2 } from 'lucide-react'

export function BundlesSection() {
  const { data, isLoading } = useStorefrontBundleList(4, 0)
  const bundles = data?.items ?? []
  if (!isLoading && bundles.length === 0) return null

  return (
    <section className="px-6 py-14 md:px-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-text-brown md:text-3xl">Build & Save Bundles</h2>
          <p className="mt-2 text-sm text-muted">Curated component kits at bundle pricing.</p>
        </div>
        <Link to="/bundles" className="text-sm font-bold text-cta-brown underline-offset-2 hover:underline">
          View all bundles
        </Link>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted" />
        </div>
      ) : (
        <div className={productGridClasses}>
          {bundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} />
          ))}
        </div>
      )}
    </section>
  )
}
