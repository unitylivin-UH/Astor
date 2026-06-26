import { createFileRoute } from '@tanstack/react-router'
import { AdminSettingsHub, SETTINGS_DEFAULT_TAB, SETTINGS_TABS } from '@/admin/AdminSettingsHub'
import { createTabSearchSchema } from '@/admin/lib/adminTabSearch'

const settingsSearchSchema = createTabSearchSchema(SETTINGS_TABS, SETTINGS_DEFAULT_TAB)

export const Route = createFileRoute('/admin/settings')({
  validateSearch: settingsSearchSchema,
  component: SettingsPage,
})

function SettingsPage() {
  const { tab } = Route.useSearch()
  return <AdminSettingsHub tab={tab} />
}
