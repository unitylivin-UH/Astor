import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Full-bleed section width matching FinalCTA — viewport minus page gutters, no max-width cap. */
export function WideSectionContainer({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('mx-6 md:mx-14', className)}>{children}</div>
}
