import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AdminPageHeadingProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
  backAction?: ReactNode
}

export function AdminPageHeading({ title, subtitle, actions, backAction }: AdminPageHeadingProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--admin-text)]">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[var(--admin-muted)]">{subtitle}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {actions}
        {backAction ? <div className="ml-auto sm:ml-0">{backAction}</div> : null}
      </div>
    </div>
  )
}

export function AdminErrorBanner({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className={cn('mb-4 rounded-[var(--admin-radius)] border border-red-200 bg-[var(--admin-danger-muted)] px-4 py-3 text-sm text-[var(--admin-danger)]')}>
      {message}
    </div>
  )
}

export function AdminLoadingState() {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-[var(--admin-muted)]">Loading…</div>
  )
}
