import { createFileRoute } from '@tanstack/react-router'
import { AdminHomepageHub, HOMEPAGE_DEFAULT_TAB, HOMEPAGE_TABS } from '@/admin/AdminHomepageHub'
import { createTabSearchSchema } from '@/admin/lib/adminTabSearch'

const homepageSearchSchema = createTabSearchSchema(HOMEPAGE_TABS, HOMEPAGE_DEFAULT_TAB)

export const Route = createFileRoute('/backend/homepage')({
  validateSearch: homepageSearchSchema,
  component: HomepagePage,
})

function HomepagePage() {
  const { tab } = Route.useSearch()
  return <AdminHomepageHub tab={tab} />
}
