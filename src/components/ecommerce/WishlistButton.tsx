import { Heart } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useStorefrontAuth } from '@/contexts/StorefrontAuthContext'
import { useIsInWishlist, useWishlistToggle } from '@/lib/hooks/useWishlist'
import { isSupabaseConfigured } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'

type WishlistButtonProps = {
  productId: string
  className?: string
  size?: 'sm' | 'md'
  variant?: 'default' | 'icon'
}

export function WishlistButton({ productId, className, size = 'md', variant = 'default' }: WishlistButtonProps) {
  const { user } = useStorefrontAuth()
  const navigate = useNavigate()
  const inWishlist = useIsInWishlist(productId)
  const toggle = useWishlistToggle()

  const isIcon = variant === 'icon'
  const iconClass = isIcon ? 'h-5 w-5' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const buttonClass = isIcon ? '' : size === 'sm' ? 'h-9 w-9' : 'h-11 w-11'

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (!isSupabaseConfigured()) {
      toast.error('Wishlist requires an online store connection')
      return
    }
    if (!user) {
      toast.message('Sign in to save items to your wishlist')
      void navigate({ to: '/account' })
      return
    }

    toggle.mutate(productId, {
      onSuccess: (result) => {
        toast.success(result.inWishlist ? 'Added to wishlist' : 'Removed from wishlist')
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Could not update wishlist')
      },
    })
  }

  return (
    <button
      type="button"
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={inWishlist}
      disabled={toggle.isPending}
      onClick={handleClick}
      className={cn(
        isIcon
          ? 'inline-flex shrink-0 items-center justify-center p-0 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)] transition-colors hover:text-red-400'
          : 'inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-surface/80 text-muted transition-colors hover:border-cta-brown hover:text-cta-brown',
        !isIcon && buttonClass,
        !isIcon && inWishlist && 'border-red-300 bg-red-50 text-red-600 hover:border-red-400 hover:text-red-700',
        isIcon && inWishlist && 'text-red-500 hover:text-red-400',
        className,
      )}
    >
      <Heart className={cn(iconClass, inWishlist && 'fill-current')} />
    </button>
  )
}
