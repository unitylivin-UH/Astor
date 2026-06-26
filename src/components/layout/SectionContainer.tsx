import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function SectionContainer({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('mx-auto w-full max-w-[1280px] px-6 md:px-14', className)}>{children}</div>
}
