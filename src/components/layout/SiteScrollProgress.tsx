import { useEffect } from 'react'
import { useWindowScrollProgress } from '@/hooks/useScrollProgress'
import { ScrollProgressBar } from '@/components/layout/ScrollProgressBar'

export function SiteScrollProgress() {
  const { progress, scrollable } = useWindowScrollProgress()

  useEffect(() => {
    document.documentElement.classList.add('storefront-no-scrollbar')
    return () => document.documentElement.classList.remove('storefront-no-scrollbar')
  }, [])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[45]">
      <ScrollProgressBar progress={progress} visible={scrollable} label="Page scroll progress" />
    </div>
  )
}
