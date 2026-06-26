import { CmsLink } from '@/components/layout/CmsLink'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SectionContainer } from '@/components/layout/SectionContainer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Storefront inner-page hero background (public/images/section bg.webp) */
export const PAGE_HERO_BG_IMAGE = '/images/section%20bg.webp'

type PageHeroProps = {
  title: string
  subtitle?: string
  backLabel?: string
  backTo?: string
  contained?: boolean
  className?: string
}

export function PageHero({
  title,
  subtitle,
  backLabel = 'Back to Home',
  backTo = '/',
  contained = false,
  className,
}: PageHeroProps) {
  const heading = (
    <>
      <h1 className="font-display text-4xl font-extrabold">{title}</h1>
      {subtitle ? <p className="mt-2 max-w-lg text-sm text-white/75">{subtitle}</p> : null}
      <Button asChild variant="cream" size="sm" className="mt-4">
        <CmsLink href={backTo}>{backLabel}</CmsLink>
      </Button>
    </>
  )

  return (
    <div className={cn('relative overflow-hidden bg-hero-brown text-white', className)}>
      <img
        src={PAGE_HERO_BG_IMAGE}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/45 via-hero-brown/72 to-hero-brown/88"
        aria-hidden
      />
      <div className="relative z-10">
        <SiteHeader />
        {contained ? (
          <SectionContainer className="pb-12 pt-28">{heading}</SectionContainer>
        ) : (
          <div className="px-6 pb-10 pt-28 md:px-14">{heading}</div>
        )}
      </div>
    </div>
  )
}
