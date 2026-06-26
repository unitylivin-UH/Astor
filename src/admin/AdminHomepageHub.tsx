import { AdminTabHub } from '@/admin/components/AdminTabHub'
import { AdminHeroSlides } from '@/admin/AdminHeroSlides'
import { AdminFeatureCards } from '@/admin/AdminFeatureCards'
import { AdminLifestyleCards } from '@/admin/AdminLifestyleCards'
import { AdminHomepageSections } from '@/admin/AdminHomepageSections'

const TABS = [
  { id: 'hero-slides', label: 'Hero Slides', content: <AdminHeroSlides /> },
  { id: 'feature-cards', label: 'Feature Cards', content: <AdminFeatureCards /> },
  { id: 'lifestyle-cards', label: 'Lifestyle Cards', content: <AdminLifestyleCards /> },
  { id: 'homepage-sections', label: 'Sections', content: <AdminHomepageSections /> },
] as const

type TabId = (typeof TABS)[number]['id']

export function AdminHomepageHub({ tab }: { tab: TabId }) {
  return (
    <AdminTabHub
      title="Homepage"
      subtitle="Configure hero, features, lifestyle cards, and content sections."
      hubPath="/admin/homepage"
      tabs={[...TABS]}
      activeTab={tab}
    />
  )
}

export const HOMEPAGE_TABS = TABS.map((t) => t.id) as unknown as readonly [TabId, ...TabId[]]
export const HOMEPAGE_DEFAULT_TAB: TabId = 'hero-slides'
