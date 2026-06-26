import type { ReactNode } from 'react'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { CmsLoadingGate } from '@/components/layout/CmsLoadingGate'
import { cn } from '@/lib/utils'

type StorefrontLayoutProps = {
  children: ReactNode
  className?: string
  hideFooter?: boolean
}

/** Sticky footer: content grows, footer stays at viewport bottom on short pages. */
export function StorefrontLayout({ children, className, hideFooter = false }: StorefrontLayoutProps) {
  return (
    <CmsLoadingGate>
      <main className={cn('flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden bg-content-bg', className)}>
        <div className="flex flex-1 flex-col">{children}</div>
        {!hideFooter ? <SiteFooter /> : null}
      </main>
    </CmsLoadingGate>
  )
}
