import { useMemo, useState } from 'react'

export const STOREFRONT_PAGE_SIZE_OPTIONS = [12, 24, 48] as const
const DEFAULT_PAGE_SIZE = STOREFRONT_PAGE_SIZE_OPTIONS[0]

export function useStorefrontPagination<T>(items: T[], initialPageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize

  const pageItems = useMemo(
    () => items.slice(start, start + pageSize),
    [items, start, pageSize],
  )

  function goToPage(next: number) {
    setPage(Math.min(Math.max(1, next), totalPages))
  }

  function changePageSize(next: number) {
    setPageSize(next)
    setPage(1)
  }

  return {
    page: safePage,
    pageSize,
    totalPages,
    totalItems,
    pageItems,
    setPage: goToPage,
    setPageSize: changePageSize,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  }
}
