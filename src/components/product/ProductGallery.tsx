import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type ProductGalleryProps = {
  name: string
  imageUrl: string
  galleryUrls?: string[]
  variant?: 'default' | 'detail'
  className?: string
}

export function ProductGallery({
  name,
  imageUrl,
  galleryUrls = [],
  variant = 'default',
  className,
}: ProductGalleryProps) {
  const images = [imageUrl, ...galleryUrls.filter((url) => url && url !== imageUrl)].filter(Boolean)
  const [active, setActive] = useState(0)

  useEffect(() => {
    setActive(0)
  }, [imageUrl])

  const current = images[active] ?? imageUrl
  const isDetail = variant === 'detail'

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn(
          'flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#f8f8f6] to-[#eeeeea]',
          isDetail
            ? 'aspect-square h-[65vh] w-[65vh] max-w-full rounded-2xl'
            : 'aspect-square rounded-[14px]',
        )}
      >
        {current ? (
          <img src={current} alt={name} className="h-full w-full object-cover object-center" />
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className={cn('flex gap-2 overflow-x-auto pb-1', isDetail && 'max-w-[65vh]')}>
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              aria-label={`View image ${index + 1}`}
              aria-current={active === index}
              onClick={() => setActive(index)}
              className={cn(
                'h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-[#f3f1ec]',
                active === index ? 'border-cta-brown' : 'border-transparent opacity-80 hover:opacity-100',
              )}
            >
              <img src={url} alt="" className="h-full w-full object-cover object-center" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
