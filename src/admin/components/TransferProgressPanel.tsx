import type { TransferProgress } from '@/admin/lib/dataTransfer'
import { cn } from '@/lib/utils'

type TransferProgressPanelProps = {
  progress: TransferProgress | null
  className?: string
}

const PHASE_LABELS: Record<TransferProgress['phase'], string> = {
  idle: 'Complete',
  reading: 'Reading upload',
  exporting: 'Preparing export',
  downloading: 'Downloading',
  importing: 'Importing',
}

export function TransferProgressPanel({ progress, className }: TransferProgressPanelProps) {
  if (!progress || progress.phase === 'idle') return null

  return (
    <div className={cn('admin-progress-panel space-y-3', className)}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-[var(--admin-text)]">
          {PHASE_LABELS[progress.phase]} — {progress.label}
        </span>
        <span className="tabular-nums text-[var(--admin-muted)]">{progress.percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--admin-border)]">
        <div
          className="h-full rounded-full bg-[var(--admin-primary)] transition-[width] duration-200"
          style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
        />
      </div>
      {progress.detail ? <p className="text-xs text-[var(--admin-muted)]">{progress.detail}</p> : null}
    </div>
  )
}
