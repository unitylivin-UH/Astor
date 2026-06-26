import { Loader2 } from 'lucide-react'
import { useCustomerOrderDetail } from '@/lib/storefront/storefrontQueries'
import { OrderDetailContent } from '@/components/account/OrderDetailContent'
import { StorefrontSheet } from '@/components/layout/StorefrontSheet'

type OrderDetailSheetProps = {
  orderId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  enabled: boolean
}

export function OrderDetailSheet({ orderId, open, onOpenChange, enabled }: OrderDetailSheetProps) {
  const { data: order, isLoading, error } = useCustomerOrderDetail(orderId ?? '', enabled && open && Boolean(orderId))

  return (
    <StorefrontSheet
      open={open}
      onOpenChange={onOpenChange}
      title={order?.order_number ?? 'Order details'}
      description={
        order ? `Placed ${new Date(order.created_at).toLocaleString()}` : 'Loading order information…'
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted" />
        </div>
      ) : error || !order ? (
        <p className="py-8 text-center text-sm text-muted">Could not load this order.</p>
      ) : (
        <OrderDetailContent order={order} />
      )}
    </StorefrontSheet>
  )
}
