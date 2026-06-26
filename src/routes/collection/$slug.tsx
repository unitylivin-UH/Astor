import { createFileRoute, notFound } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useCms } from '@/contexts/CmsContext'
import { ProductCard } from '@/components/home/ProductCard'
import { productGridClasses } from '@/components/storefront/productGridClasses'
import { PageHero } from '@/components/layout/PageHero'
import { StorefrontLayout } from '@/components/layout/StorefrontLayout'
import { ProductGridPagination } from '@/components/storefront/ProductGridPagination'
import { getCategoryBySlug } from '@/lib/cms/loadCmsSnapshot'
import { buildCollectionMeta, usePageMeta } from '@/lib/seo'
import { resolveStorefrontListParams } from '@/lib/storefront/staticProductFallback'
import { useStorefrontProductList } from '@/lib/storefront/storefrontQueries'
import { useServerStorefrontPagination } from '@/lib/storefront/useServerStorefrontPagination'
import { CollectionFilters, type CollectionFilterState } from '@/components/storefront/CollectionFilters'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildCollectionJsonLd } from '@/lib/seo/jsonLd'

const VIRTUAL_COLLECTION_SLUGS = [
  'all', 'new', 'best', 'deals', 'summer', 'system-accessories', 'graphics-card', 'mobile-phones',
  'gaming', 'power-supply', 'motherboards', 'ram', 'processors', 'gaming-pc', 'msi', 'zotac',
  'gigabyte', 'apple', 'samsung', 'google', 'oneplus', 'nintendo', 'playstation-5', 'xbox',
] as const

export const Route = createFileRoute('/collection/$slug')({
  component: CollectionPage,
})

function CollectionPage() {
  const { slug } = Route.useParams()
  const { snapshot } = useCms()
  const collection = snapshot.collections.find((c) => c.slug === slug)
  const category = getCategoryBySlug(snapshot, slug)
  const listParams = resolveStorefrontListParams(slug, snapshot)

  if (!listParams && !VIRTUAL_COLLECTION_SLUGS.includes(slug as (typeof VIRTUAL_COLLECTION_SLUGS)[number])) {
    throw notFound()
  }

  const params = listParams ?? { filter: 'all' as const }
  const [filters, setFilters] = useState<CollectionFilterState>({
    minPrice: '',
    maxPrice: '',
    inStockOnly: false,
    sort: 'default',
  })

  const listParamsWithFilters = {
    ...params,
    minPrice: filters.minPrice ? Number(filters.minPrice) : null,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : null,
    inStockOnly: filters.inStockOnly,
    sort: filters.sort as 'default' | 'price_asc' | 'price_desc' | 'name',
  }

  const title = collection?.title ?? category?.name ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
  const storeUrl = snapshot.siteSettings.store_url?.trim() || (typeof window !== 'undefined' ? window.location.origin : '')

  const pagination = useServerStorefrontPagination()
  const { data, isLoading, isFetching } = useStorefrontProductList(
    listParamsWithFilters,
    pagination.pageSize,
    pagination.offset,
  )

  const total = data?.total ?? 0
  const products = data?.items ?? []
  const paging = pagination.view(total)

  useEffect(() => {
    pagination.resetPage()
  }, [slug, filters.minPrice, filters.maxPrice, filters.inStockOnly, filters.sort])

  usePageMeta(buildCollectionMeta(title, collection?.description, slug, snapshot.siteName))

  const loading = isLoading || (isFetching && products.length === 0)

  return (
    <StorefrontLayout>
      <JsonLd data={buildCollectionJsonLd(title, collection?.description, slug, storeUrl)} />
      <PageHero title={title} subtitle={collection?.description} />

      <div className="min-w-0 max-w-full px-6 py-12 md:px-14">
        <CollectionFilters value={filters} onChange={setFilters} />
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted" />
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-muted">No products in this collection yet.</p>
        ) : (
          <>
            <div className={productGridClasses}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <ProductGridPagination
              page={paging.page}
              totalPages={paging.totalPages}
              totalItems={paging.totalItems}
              pageSize={paging.pageSize}
              hasPrev={paging.hasPrev}
              hasNext={paging.hasNext}
              onPageChange={(next) => pagination.setPage(next, total)}
              onPageSizeChange={pagination.setPageSize}
            />
          </>
        )}
      </div>
    </StorefrontLayout>
  )
}
