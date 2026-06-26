import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ADMIN_PAGE_SIZE_OPTIONS } from '@/admin/useAdminTablePagination'
import { adminBtnGhost, adminBtnSecondary, adminLabel } from '@/admin/adminClassNames'
import { BrandedSelect } from '@/components/ui/BrandedSelect'

type AdminTablePaginationProps = {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  hasPrev: boolean
  hasNext: boolean
}

export function AdminTablePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  hasPrev,
  hasNext,
}: AdminTablePaginationProps) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-sm text-[var(--admin-muted)]">
        {totalItems === 0 ? 'No records' : `Showing ${start}–${end} of ${totalItems}`}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {onPageSizeChange ? (
          <label className="flex items-center gap-2 text-sm text-[var(--admin-muted)]">
            <span className={adminLabel}>Rows</span>
            <BrandedSelect
              aria-label="Rows per page"
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
              options={ADMIN_PAGE_SIZE_OPTIONS.map((size) => ({ value: String(size), label: String(size) }))}
              triggerClassName="h-9 w-[5.5rem] py-1"
            />
          </label>
        ) : null}
        <div className="flex items-center gap-2">
          <button type="button" className={adminBtnGhost} disabled={!hasPrev} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <span className="min-w-[4rem] text-center text-sm text-[var(--admin-muted)]">
            {page} / {totalPages}
          </span>
          <button type="button" className={adminBtnSecondary} disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
