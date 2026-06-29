import { AdminTabHub } from '@/admin/components/AdminTabHub'
import { AdminProducts } from '@/admin/AdminProducts'
import { AdminBundles } from '@/admin/AdminBundles'
import { AdminCollections } from '@/admin/AdminCollections'
import { AdminCategories } from '@/admin/AdminCategories'
import { AdminReviews } from '@/admin/AdminReviews'

const TABS = [
  { id: 'products', label: 'Products', content: <AdminProducts /> },
  { id: 'bundles', label: 'Bundles', content: <AdminBundles /> },
  { id: 'collections', label: 'Collections', content: <AdminCollections /> },
  { id: 'categories', label: 'Categories', content: <AdminCategories /> },
  { id: 'reviews', label: 'Reviews', content: <AdminReviews /> },
] as const

type TabId = (typeof TABS)[number]['id']

export function AdminCatalogHub({ tab }: { tab: TabId }) {
  return (
    <AdminTabHub
      title="Catalog"
      subtitle="Manage products, bundles, collections, and categories."
      hubPath="/backend/catalog"
      tabs={[...TABS]}
      activeTab={tab}
    />
  )
}

export const CATALOG_TABS = TABS.map((t) => t.id) as unknown as readonly [TabId, ...TabId[]]
export const CATALOG_DEFAULT_TAB: TabId = 'products'
