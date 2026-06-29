import { createFileRoute } from '@tanstack/react-router'
import {
  AdminCommunicationsHub,
  COMMUNICATIONS_DEFAULT_TAB,
  COMMUNICATIONS_TABS,
} from '@/admin/AdminCommunicationsHub'
import { createTabSearchSchema } from '@/admin/lib/adminTabSearch'

const communicationsSearchSchema = createTabSearchSchema(COMMUNICATIONS_TABS, COMMUNICATIONS_DEFAULT_TAB)

export const Route = createFileRoute('/backend/communications')({
  validateSearch: communicationsSearchSchema,
  component: CommunicationsPage,
})

function CommunicationsPage() {
  const { tab } = Route.useSearch()
  return <AdminCommunicationsHub tab={tab} />
}
