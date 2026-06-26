import { createFileRoute, notFound } from '@tanstack/react-router'
import { useCms } from '@/contexts/CmsContext'
import { ContactPage } from '@/components/pages/ContactPage'
import { PageHero } from '@/components/layout/PageHero'
import { SectionContainer } from '@/components/layout/SectionContainer'
import { StorefrontLayout } from '@/components/layout/StorefrontLayout'
import { buildMarketingPageMeta, usePageMeta } from '@/lib/seo'
import { sanitizeMarketingHtml } from '@/lib/sanitizeHtml'

export const Route = createFileRoute('/pages/$slug')({
  component: MarketingPage,
})

function MarketingPage() {
  const { slug } = Route.useParams()
  const { snapshot } = useCms()
  const page = snapshot.marketingPages?.find((p) => p.slug === slug)

  if (!page) throw notFound()

  usePageMeta(buildMarketingPageMeta(
    { title: page.title, metaDescription: page.metaDescription, slug: page.slug },
    snapshot.siteName,
  ))

  if (slug === 'contact') {
    return <ContactPage page={page} />
  }

  const safeHtml = page.bodyHtml ? sanitizeMarketingHtml(page.bodyHtml) : ''

  return (
    <StorefrontLayout>
      <PageHero title={page.title} contained />
      <SectionContainer className="prose prose-sm max-w-none py-12 text-text-brown">
        {safeHtml ? <div dangerouslySetInnerHTML={{ __html: safeHtml }} /> : null}
      </SectionContainer>
    </StorefrontLayout>
  )
}
