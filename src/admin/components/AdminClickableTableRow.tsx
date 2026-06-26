import type { ComponentProps, KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AdminClickableTableRowProps = {
  onOpen: () => void
  children: ReactNode
  className?: string
}

/** Table row that opens a detail sheet on click; use AdminTableStopCell on checkbox/action cells. */
export function AdminClickableTableRow({ onOpen, children, className }: AdminClickableTableRowProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLTableRowElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen()
    }
  }

  return (
    <tr
      className={cn('admin-table-row-clickable border-t border-[var(--admin-border)]', className)}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
    >
      {children}
    </tr>
  )
}

type AdminTableStopCellProps = ComponentProps<'td'>

/** Prevents row click when interacting with checkboxes or action menus. */
export function AdminTableStopCell({ className, children, onClick, ...props }: AdminTableStopCellProps) {
  function handleClick(e: MouseEvent<HTMLTableCellElement>) {
    e.stopPropagation()
    onClick?.(e)
  }

  return (
    <td {...props} className={className} onClick={handleClick}>
      {children}
    </td>
  )
}
