import { useState } from 'react'
import { STOREFRONT_PAGE_SIZE_OPTIONS } from '@/lib/storefrontPagination'

const DEFAULT_PAGE_SIZE = STOREFRONT_PAGE_SIZE_OPTIONS[0]

export type StorefrontPaginationView = {
  page: number
  pageSize: number
  totalPages: number
  totalItems: number
  hasPrev: boolean
  hasNext: boolean
}

/** Server-driven pagination state for storefront PLP/search. */
export function useServerStorefrontPagination(initialPageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const offset = (page - 1) * pageSize

  function view(totalItems: number): StorefrontPaginationView {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const safePage = Math.min(page, totalPages)
    return {
      page: safePage,
      pageSize,
      totalPages,
      totalItems,
      hasPrev: safePage > 1,
      hasNext: safePage < totalPages,
    }
  }

  function goToPage(next: number, totalItems: number) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    setPage(Math.min(Math.max(1, next), totalPages))
  }

  function changePageSize(next: number) {
    setPageSize(next)
    setPage(1)
  }

  function resetPage() {
    setPage(1)
  }

  return {
    pageSize,
    offset,
    setPage: goToPage,
    setPageSize: changePageSize,
    resetPage,
    view,
  }
}
