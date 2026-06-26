import { Trash2 } from 'lucide-react'
import { adminBtnDanger, adminBtnSecondary } from '@/admin/adminClassNames'

type AdminBulkToolbarProps = {
  selectedCount: number
  onClear: () => void
  onDelete?: () => void
  onPublish?: () => void
  onUnpublish?: () => void
  busy?: boolean
}

export function AdminBulkToolbar({
  selectedCount,
  onClear,
  onDelete,
  onPublish,
  onUnpublish,
  busy = false,
}: AdminBulkToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="admin-bulk-bar">
      <p className="text-sm font-medium text-[var(--admin-text)]">{selectedCount} selected</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={adminBtnSecondary} disabled={busy} onClick={onClear}>
          Clear
        </button>
        {onPublish ? (
          <button type="button" className={adminBtnSecondary} disabled={busy} onClick={onPublish}>
            Publish
          </button>
        ) : null}
        {onUnpublish ? (
          <button type="button" className={adminBtnSecondary} disabled={busy} onClick={onUnpublish}>
            Unpublish
          </button>
        ) : null}
        {onDelete ? (
          <button type="button" className={adminBtnDanger} disabled={busy} onClick={onDelete}>
            <Trash2 className="mr-1 inline h-4 w-4" />
            Delete
          </button>
        ) : null}
      </div>
    </div>
  )
}
