import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useCms } from '@/contexts/CmsContext'
import { storefrontKeys } from '@/lib/storefront/storefrontQueries'

/** Refreshes CMS layout snapshot and invalidates storefront product/search caches. */
export function useAdminCatalogSync() {
  const { refetchCms } = useCms()
  const queryClient = useQueryClient()

  return useCallback(async () => {
    await refetchCms()
    await queryClient.invalidateQueries({ queryKey: storefrontKeys.all })
  }, [refetchCms, queryClient])
}
