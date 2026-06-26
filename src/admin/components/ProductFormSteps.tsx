import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { adminBtnPrimary, adminBtnSecondary } from '@/admin/adminClassNames'

export type ProductFormStep = {
  id: string
  label: string
  content: ReactNode
}

type ProductFormStepsProps = {
  steps: ProductFormStep[]
  stepIndex: number
  onStepChange: (index: number) => void
  onSave: () => void
  saving?: boolean
  saveLabel?: string
}

export function ProductFormSteps({
  steps,
  stepIndex,
  onStepChange,
  onSave,
  saving = false,
  saveLabel = 'Save product',
}: ProductFormStepsProps) {
  const step = steps[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === steps.length - 1

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Product form steps">
        {steps.map((s, index) => {
          const active = index === stepIndex
          const done = index < stepIndex
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                active && 'bg-[var(--admin-primary)] text-white',
                !active && done && 'bg-[var(--admin-primary-muted)] text-[var(--admin-text)]',
                !active && !done && 'bg-[var(--admin-surface)] text-[var(--admin-muted)] hover:bg-[var(--admin-primary-muted)]',
              )}
              onClick={() => onStepChange(index)}
            >
              {index + 1}. {s.label}
            </button>
          )
        })}
      </div>

      <div className="min-h-0 flex-1">{step?.content}</div>

      <div className="flex flex-col-reverse gap-2 border-t border-[var(--admin-border)] pt-4 sm:flex-row sm:justify-between">
        <button
          type="button"
          className={adminBtnSecondary}
          disabled={isFirst}
          onClick={() => onStepChange(stepIndex - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          {!isLast ? (
            <button type="button" className={adminBtnPrimary} onClick={() => onStepChange(stepIndex + 1)}>
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" className={adminBtnPrimary} disabled={saving} onClick={onSave}>
              {saving ? 'Saving…' : saveLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
