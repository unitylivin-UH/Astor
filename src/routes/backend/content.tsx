import { createFileRoute } from '@tanstack/react-router'
import { AdminContentHub, CONTENT_DEFAULT_TAB, CONTENT_TABS } from '@/admin/AdminContentHub'
import { createTabSearchSchema } from '@/admin/lib/adminTabSearch'

const contentSearchSchema = createTabSearchSchema(CONTENT_TABS, CONTENT_DEFAULT_TAB)

export const Route = createFileRoute('/backend/content')({
  validateSearch: contentSearchSchema,
  component: ContentPage,
})

function ContentPage() {
  const { tab } = Route.useSearch()
  return <AdminContentHub tab={tab} />
}
