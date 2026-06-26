import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { adminSheetPanel } from '@/admin/adminClassNames'
import { cn } from '@/lib/utils'

export type DetailField = {
  label: string
  value: ReactNode
}

type EntityDetailSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  fields: DetailField[]
}

export function EntityDetailSheet({ open, onOpenChange, title, subtitle, fields }: EntityDetailSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            adminSheetPanel,
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'max-sm:data-[state=closed]:slide-out-to-bottom max-sm:data-[state=open]:slide-in-from-bottom',
            'sm:max-w-md sm:data-[state=closed]:slide-out-to-right sm:data-[state=open]:slide-in-from-right',
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-[var(--admin-border)] p-4">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-semibold text-[var(--admin-text)]">{title}</Dialog.Title>
              {subtitle ? <p className="mt-1 text-sm text-[var(--admin-muted)]">{subtitle}</p> : null}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="rounded-[var(--admin-radius)] p-2 text-[var(--admin-muted)] hover:bg-[var(--admin-primary-muted)]"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <dl className="flex-1 space-y-4 overflow-y-auto p-4">
            {fields.map((field) => (
              <div key={field.label} className="space-y-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--admin-muted)]">{field.label}</dt>
                <dd className="text-sm text-[var(--admin-text)] break-words">{field.value ?? '—'}</dd>
              </div>
            ))}
          </dl>

          <div className="border-t border-[var(--admin-border)] p-4">
            <Dialog.Close asChild>
              <button
                type="button"
                className="w-full rounded-[var(--admin-radius)] border border-[var(--admin-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--admin-primary-muted)]"
              >
                Close
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
