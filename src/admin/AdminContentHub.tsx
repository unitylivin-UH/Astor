import { AdminTabHub } from '@/admin/components/AdminTabHub'
import { AdminPages } from '@/admin/AdminPages'
import { AdminNavLinks } from '@/admin/AdminNavLinks'
import { AdminSocialLinks } from '@/admin/AdminSocialLinks'
import { AdminMedia } from '@/admin/AdminMedia'

const TABS = [
  { id: 'pages', label: 'Pages', content: <AdminPages /> },
  { id: 'nav-links', label: 'Nav Links', content: <AdminNavLinks /> },
  { id: 'social-links', label: 'Social Links', content: <AdminSocialLinks /> },
  { id: 'media', label: 'Media', content: <AdminMedia /> },
] as const

type TabId = (typeof TABS)[number]['id']

export function AdminContentHub({ tab }: { tab: TabId }) {
  return (
    <AdminTabHub
      title="Site Content"
      subtitle="Pages, navigation, social links, and media library."
      hubPath="/backend/content"
      tabs={[...TABS]}
      activeTab={tab}
    />
  )
}

export const CONTENT_TABS = TABS.map((t) => t.id) as unknown as readonly [TabId, ...TabId[]]
export const CONTENT_DEFAULT_TAB: TabId = 'pages'
