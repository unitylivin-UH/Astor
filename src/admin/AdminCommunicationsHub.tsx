import { AdminTabHub } from '@/admin/components/AdminTabHub'
import { AdminEmailTemplates } from '@/admin/AdminEmailTemplates'
import { AdminNewsletter } from '@/admin/AdminNewsletter'
import { AdminFormSubmissions } from '@/admin/AdminFormSubmissions'

const TABS = [
  { id: 'email-templates', label: 'Email Templates', content: <AdminEmailTemplates /> },
  { id: 'newsletter', label: 'Newsletter', content: <AdminNewsletter /> },
  { id: 'submissions', label: 'Submissions', content: <AdminFormSubmissions /> },
] as const

type TabId = (typeof TABS)[number]['id']

export function AdminCommunicationsHub({ tab }: { tab: TabId }) {
  return (
    <AdminTabHub
      title="Communications"
      subtitle="Email templates, newsletter subscribers, and form submissions."
      hubPath="/backend/communications"
      tabs={[...TABS]}
      activeTab={tab}
    />
  )
}

export const COMMUNICATIONS_TABS = TABS.map((t) => t.id) as unknown as readonly [TabId, ...TabId[]]
export const COMMUNICATIONS_DEFAULT_TAB: TabId = 'email-templates'
