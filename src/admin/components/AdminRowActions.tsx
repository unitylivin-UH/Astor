import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Copy, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { adminBtnGhost } from '@/admin/adminClassNames'
import { cn } from '@/lib/utils'

export type AdminRowAction = {
  label: string
  icon?: ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
}

type AdminRowActionsProps = {
  actions: AdminRowAction[]
  label?: string
}

export function AdminRowActions({ actions, label = 'Row actions' }: AdminRowActionsProps) {
  if (actions.length === 0) return null

  return (
    <div className="admin-table-actions">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" className={cn(adminBtnGhost, 'admin-table-actions-trigger')} aria-label={label}>
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="admin-dropdown-menu" align="end" sideOffset={4}>
            {actions.map((action) => (
              <DropdownMenu.Item
                key={action.label}
                className={cn('admin-dropdown-item', action.variant === 'danger' && 'admin-dropdown-item-danger')}
                onSelect={(event) => {
                  event.preventDefault()
                  action.onClick()
                }}
              >
                {action.icon}
                <span>{action.label}</span>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}

export function crudRowActions({
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  viewLabel = 'View details',
  editLabel = 'Edit',
  duplicateLabel = 'Duplicate',
  deleteLabel = 'Delete',
}: {
  onView?: () => void
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  viewLabel?: string
  editLabel?: string
  duplicateLabel?: string
  deleteLabel?: string
}): AdminRowAction[] {
  const actions: AdminRowAction[] = []
  if (onView) {
    actions.push({ label: viewLabel, icon: <Eye className="h-4 w-4" />, onClick: onView })
  }
  if (onEdit) {
    actions.push({ label: editLabel, icon: <Pencil className="h-4 w-4" />, onClick: onEdit })
  }
  if (onDuplicate) {
    actions.push({ label: duplicateLabel, icon: <Copy className="h-4 w-4" />, onClick: onDuplicate })
  }
  if (onDelete) {
    actions.push({
      label: deleteLabel,
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      variant: 'danger',
    })
  }
  return actions
}

export const adminTableActionsHeadClass = 'admin-table-actions-head px-4 py-3 font-medium'
export const adminTableActionsCellClass = 'admin-table-actions-cell px-4 py-3'
