import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/data/static-cms'
import { useStorefrontAuth } from '@/contexts/StorefrontAuthContext'
import { canReviewProduct, submitProductReview } from '@/lib/storefront/storefrontRpc'
import { isSupabaseConfigured } from '@/integrations/supabase/client'
import { storefrontKeys } from '@/lib/storefront/storefrontQueries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const iconClass = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(iconClass, i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-border')}
        />
      ))}
    </div>
  )
}

export function ProductRatingStars({ rating }: { rating: number }) {
  return <Stars rating={rating} size="lg" />
}

type ProductReviewSectionProps = {
  product: Product
  showApprovedOnly: boolean
}

export function ProductReviewSection({ product, showApprovedOnly }: ProductReviewSectionProps) {
  const { user } = useStorefrontAuth()
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: eligibility } = useQuery({
    queryKey: [...storefrontKeys.product(product.slug), 'can-review'],
    queryFn: () => canReviewProduct(product.id),
    enabled: Boolean(user) && isSupabaseConfigured() && !showApprovedOnly,
    staleTime: 30_000,
  })

  if (showApprovedOnly) {
    const reviews = product.reviews
    if (!reviews || reviews.count === 0) return null

    return (
      <ul className="space-y-4">
        {reviews.items.map((review) => (
          <li key={review.id}>
            {review.title ? (
              <p className="text-[15px] font-semibold leading-6 text-text-brown md:text-base md:leading-7">
                {review.title}
              </p>
            ) : null}
            <p
              className={cn(
                'text-[15px] leading-6 text-muted md:text-base md:leading-7',
                review.title ? 'mt-1' : undefined,
              )}
            >
              {review.body}
            </p>
          </li>
        ))}
      </ul>
    )
  }

  if (!eligibility?.canReview) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) {
      toast.error('Please write your review')
      return
    }
    setSubmitting(true)
    try {
      await submitProductReview({
        productId: product.id,
        rating,
        title: title.trim() || undefined,
        body: body.trim(),
      })
      toast.success('Review submitted — it will appear after approval')
      setTitle('')
      setBody('')
      setRating(5)
      void queryClient.invalidateQueries({ queryKey: storefrontKeys.product(product.slug) })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-8 rounded-lg border border-border bg-surface/30 p-4 sm:p-6">
      <h3 className="font-display text-lg font-extrabold">Write a review</h3>
      <p className="mt-1 text-sm text-muted">Share your experience with this product. Reviews are moderated before publishing.</p>
      <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold">Rating</label>
          <div className="flex gap-1">
            {Array.from({ length: 5 }, (_, i) => {
              const value = i + 1
              return (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} star`}
                  onClick={() => setRating(value)}
                  className="rounded p-1"
                >
                  <Star className={cn('h-6 w-6', value <= rating ? 'fill-amber-400 text-amber-400' : 'text-border')} />
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Title (optional)</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summarize your experience" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Review</label>
          <textarea
            className="min-h-[120px] w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What did you like or dislike?"
            required
          />
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit review'}
        </Button>
      </form>
    </div>
  )
}
