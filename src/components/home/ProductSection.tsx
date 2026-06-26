import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Loader2 } from 'lucide-react'
import { useCms } from '@/contexts/CmsContext'
import { getSectionByKey } from '@/lib/cms/loadCmsSnapshot'
import { useHomepageProducts } from '@/lib/storefront/storefrontQueries'
import { ProductCard } from '@/components/home/ProductCard'
import { CmsLink } from '@/components/layout/CmsLink'
import { WideSectionContainer } from '@/components/layout/WideSectionContainer'
import { Button } from '@/components/ui/button'
import { homepageProductGridClasses } from '@/components/storefront/productGridClasses'

gsap.registerPlugin(ScrollTrigger)

export function ProductSection({ sectionKey }: { sectionKey: 'newly_dropped' | 'summer_collections' }) {
  const { snapshot } = useCms()
  const section = getSectionByKey(snapshot, sectionKey)
  const { data: products = [], isLoading } = useHomepageProducts(sectionKey)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!ref.current || products.length === 0) return
    const ctx = gsap.context(() => {
      gsap.from('.product-card', {
        scrollTrigger: { trigger: ref.current, start: 'top 80%' },
        y: 40,
        opacity: 0,
        stagger: 0.08,
        duration: 0.65,
        ease: 'power3.out',
      })
    }, ref)
    return () => ctx.revert()
  }, [sectionKey, products.length])

  if (!section) return null

  const showMoreHref = section.ctaUrl || (sectionKey === 'newly_dropped' ? '/collection/new' : '/collection/deals')
  const showMoreLabel = section.ctaLabel?.trim() || 'Show more'

  return (
    <section ref={ref} className="pb-8">
      <WideSectionContainer>
        <div className="mx-auto max-w-[420px] text-center">
          <h2 className="font-display text-4xl font-extrabold leading-tight text-text-brown">{section.title}</h2>
          {section.subtitle && (
            <p className="mt-2 text-[11px] leading-relaxed text-muted">{section.subtitle}</p>
          )}
        </div>

        {isLoading ? (
          <div className="mt-10 flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted" />
          </div>
        ) : (
          <div className={`product-grid mt-10 ${homepageProductGridClasses}`}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!isLoading && products.length > 0 ? (
          <div className="mt-8 flex justify-center">
            <Button asChild variant="outline" className="h-[38px] rounded-lg px-8 text-xs font-bold">
              <CmsLink href={showMoreHref}>{showMoreLabel}</CmsLink>
            </Button>
          </div>
        ) : null}
      </WideSectionContainer>
    </section>
  )
}
