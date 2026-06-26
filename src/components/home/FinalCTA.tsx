import { useEffect, useRef } from 'react'
import { CmsLink } from '@/components/layout/CmsLink'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useCms } from '@/contexts/CmsContext'
import { getSectionByKey } from '@/lib/cms/loadCmsSnapshot'
import { Button } from '@/components/ui/button'

gsap.registerPlugin(ScrollTrigger)

export function FinalCTA() {
  const { snapshot } = useCms()
  const section = getSectionByKey(snapshot, 'final_cta')
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!ref.current || !section) return
    const ctx = gsap.context(() => {
      gsap.from('.final-cta-bg', {
        scrollTrigger: { trigger: ref.current, start: 'top 80%' },
        scale: 1.08,
        duration: 1.2,
        ease: 'power2.out',
      })
      gsap.from('.final-cta-content > *', {
        scrollTrigger: { trigger: ref.current, start: 'top 75%' },
        y: 24,
        opacity: 0,
        stagger: 0.12,
        duration: 0.7,
        ease: 'power3.out',
      })
    }, ref)
    return () => ctx.revert()
  }, [section])

  if (!section) return null

  return (
    <section ref={ref} className="mx-6 my-20 overflow-hidden rounded-[14px] md:mx-14">
      <div className="relative h-[300px]">
        <img src={section.imageUrl} alt="" className="final-cta-bg absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/35" />
        <div className="final-cta-content absolute left-8 top-1/2 max-w-[560px] -translate-y-1/2 md:left-[90px]">
          <h2 className="font-display text-3xl font-extrabold leading-tight text-white md:text-4xl">
            {section.title}
          </h2>
          <Button asChild variant="cream" className="mt-6 h-10 px-6 text-xs font-bold">
            <CmsLink href={section.ctaUrl}>{section.ctaLabel}</CmsLink>
          </Button>
        </div>
      </div>
    </section>
  )
}
