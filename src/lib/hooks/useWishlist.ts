import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useStorefrontAuth } from '@/contexts/StorefrontAuthContext'
import { isSupabaseConfigured } from '@/integrations/supabase/client'
import { fetchWishlistProducts, toggleWishlist } from '@/lib/storefront/storefrontRpc'

export const wishlistKeys = {
  all: ['wishlist'] as const,
  products: () => [...wishlistKeys.all, 'products'] as const,
}

export function useWishlistProducts() {
  const { user } = useStorefrontAuth()

  return useQuery({
    queryKey: wishlistKeys.products(),
    queryFn: fetchWishlistProducts,
    enabled: Boolean(user) && isSupabaseConfigured(),
    staleTime: 30_000,
  })
}

export function useWishlistToggle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleWishlist,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.all })
    },
  })
}

export function useIsInWishlist(productId: string) {
  const { data: products = [] } = useWishlistProducts()
  return products.some((product) => product.id === productId)
}
