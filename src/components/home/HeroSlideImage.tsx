import { getBrandSettings, resolveHeroSlideImages } from '@/lib/siteBrand'
import { cn } from '@/lib/utils'

type HeroSlideImageProps = {
  slide: {
    imageUrl: string
    imageUrlTablet?: string
    imageUrlMobile?: string
  }
  siteSettings: Record<string, string>
  className?: string
}

export function HeroSlideImage({ slide, siteSettings, className }: HeroSlideImageProps) {
  const brand = getBrandSettings(siteSettings)
  const { desktop, tablet, mobile } = resolveHeroSlideImages(slide, brand)

  if (!desktop && !tablet && !mobile) return null

  return (
    <picture>
      {mobile ? <source media="(max-width: 639px)" srcSet={mobile} /> : null}
      {tablet ? <source media="(max-width: 1023px)" srcSet={tablet} /> : null}
      <img
        src={desktop || tablet || mobile}
        alt=""
        className={cn('hero-image absolute inset-0 h-full w-full object-cover object-center', className)}
      />
    </picture>
  )
}
