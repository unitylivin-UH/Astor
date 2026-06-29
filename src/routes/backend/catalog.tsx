import { createFileRoute } from '@tanstack/react-router'
import { AdminCatalogHub, CATALOG_DEFAULT_TAB, CATALOG_TABS } from '@/admin/AdminCatalogHub'
import { createTabSearchSchema } from '@/admin/lib/adminTabSearch'

const catalogSearchSchema = createTabSearchSchema(CATALOG_TABS, CATALOG_DEFAULT_TAB)

export const Route = createFileRoute('/backend/catalog')({
  validateSearch: catalogSearchSchema,
  component: CatalogPage,
})

function CatalogPage() {
  const { tab } = Route.useSearch()
  return <AdminCatalogHub tab={tab} />
}
