import { useEffect, useMemo, useState } from 'react'

export const ADMIN_PAGE_SIZE_OPTIONS = [20, 50, 100] as const
const DEFAULT_PAGE_SIZE = ADMIN_PAGE_SIZE_OPTIONS[0]

export function useAdminTablePagination(totalItems: number, initialPageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, totalPages)

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  const slice = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return { start, end: start + pageSize }
  }, [safePage, pageSize])

  function goToPage(next: number) {
    setPage(Math.min(Math.max(1, next), totalPages))
  }

  function resetPage() {
    setPage(1)
  }

  function changePageSize(next: number) {
    setPageSize(next)
    setPage(1)
  }

  function paginate<T>(items: T[]): T[] {
    return items.slice(slice.start, slice.end)
  }

  return {
    page: safePage,
    pageSize,
    totalPages,
    totalItems,
    start: slice.start,
    end: slice.end,
    setPage: goToPage,
    setPageSize: changePageSize,
    resetPage,
    paginate,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  }
}
