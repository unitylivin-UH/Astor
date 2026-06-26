import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type StorefrontSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function StorefrontSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: StorefrontSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed z-50 flex max-h-[92vh] flex-col bg-white shadow-xl outline-none',
            'inset-x-0 bottom-0 top-auto mb-0 w-full rounded-t-2xl',
            'sm:inset-y-0 sm:right-0 sm:left-auto sm:mb-0 sm:max-h-none sm:w-full sm:max-w-lg sm:rounded-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
            <div className="min-w-0 flex-1 pr-8">
              <Dialog.Title className="font-display text-lg font-extrabold text-text-brown sm:text-xl">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="absolute right-3 top-3 rounded-full p-2 text-muted transition hover:bg-surface hover:text-text-brown"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>

          <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
            {footer}
            <Dialog.Close asChild>
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Close
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
