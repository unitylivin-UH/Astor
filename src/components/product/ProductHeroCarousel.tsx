import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type ProductHeroCarouselProps = {
  name: string
  images: string[]
  className?: string
}

export function ProductHeroCarousel({ name, images, className }: ProductHeroCarouselProps) {
  const [index, setIndex] = useState(0)
  const [visibleCount, setVisibleCount] = useState(3)

  useEffect(() => {
    const update = () => setVisibleCount(window.innerWidth >= 768 ? 3 : 1)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const maxIndex = Math.max(0, images.length - visibleCount)

  const goTo = useCallback(
    (next: number) => {
      setIndex(Math.min(Math.max(0, next), maxIndex))
    },
    [maxIndex],
  )

  useEffect(() => {
    setIndex((current) => Math.min(current, maxIndex))
  }, [maxIndex])

  if (images.length === 0) {
    return (
      <div className={cn('flex h-full items-center justify-center bg-[#f3f1ec]', className)}>
        <span className="text-sm text-muted">No image</span>
      </div>
    )
  }

  const slideWidth = 100 / visibleCount

  return (
    <div className={cn('relative flex h-full flex-col', className)}>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * slideWidth}%)` }}
        >
          {images.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="h-full shrink-0 overflow-hidden bg-gradient-to-b from-[#f8f8f6] to-[#eeeeea]"
              style={{ width: `${slideWidth}%` }}
            >
              <img src={url} alt={`${name} — image ${i + 1}`} className="h-full w-full object-cover object-center" />
            </div>
          ))}
        </div>

        {images.length > visibleCount ? (
          <>
            <button
              type="button"
              aria-label="Previous images"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-text-brown shadow-md transition hover:bg-white disabled:pointer-events-none disabled:opacity-40 md:left-6"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next images"
              onClick={() => goTo(index + 1)}
              disabled={index >= maxIndex}
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-text-brown shadow-md transition hover:bg-white disabled:pointer-events-none disabled:opacity-40 md:right-6"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="flex justify-center gap-1.5 py-3">
          {Array.from({ length: maxIndex + 1 }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                index === i ? 'w-6 bg-cta-brown' : 'w-1.5 bg-text-brown/30 hover:bg-text-brown/50',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
