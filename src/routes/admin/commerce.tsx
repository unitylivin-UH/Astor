import { createFileRoute } from '@tanstack/react-router'
import { AdminCommerceHub, COMMERCE_DEFAULT_TAB, COMMERCE_TABS } from '@/admin/AdminCommerceHub'
import { createTabSearchSchema } from '@/admin/lib/adminTabSearch'

const commerceSearchSchema = createTabSearchSchema(COMMERCE_TABS, COMMERCE_DEFAULT_TAB)

export const Route = createFileRoute('/admin/commerce')({
  validateSearch: commerceSearchSchema,
  component: CommercePage,
})

function CommercePage() {
  const { tab } = Route.useSearch()
  return <AdminCommerceHub tab={tab} />
}
