import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { CustomerOrderSummary } from '@/lib/storefront/storefrontRpc'
import { useFormatPrice } from '@/lib/currency'
import { OrderDetailSheet } from '@/components/account/OrderDetailSheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const ORDERS_PAGE_SIZE = 6

type OrderHistoryTableProps = {
  orders: CustomerOrderSummary[]
}

export function OrderHistoryTable({ orders }: OrderHistoryTableProps) {
  const formatPrice = useFormatPrice()
  const [page, setPage] = useState(1)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const totalPages = Math.max(1, Math.ceil(orders.length / ORDERS_PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const pageOrders = useMemo(() => {
    const start = (safePage - 1) * ORDERS_PAGE_SIZE
    return orders.slice(start, start + ORDERS_PAGE_SIZE)
  }, [orders, safePage])

  function openOrder(orderId: string) {
    setSelectedOrderId(orderId)
    setSheetOpen(true)
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/60 text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Fulfillment</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {pageOrders.map((order) => (
              <tr
                key={order.id}
                className="cursor-pointer transition-colors hover:bg-surface/50"
                onClick={() => openOrder(order.id)}
              >
                <td className="border-b border-border px-4 py-3 font-semibold text-text-brown">
                  {order.order_number}
                </td>
                <td className="border-b border-border px-4 py-3 text-muted">
                  {new Date(order.created_at).toLocaleString()}
                </td>
                <td className="border-b border-border px-4 py-3 capitalize text-muted">
                  {order.status.replace(/_/g, ' ')}
                </td>
                <td className="border-b border-border px-4 py-3">
                  {(order.fulfillment_status === 'shipped' || order.fulfillment_status === 'delivered') ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium capitalize text-emerald-800">
                      {order.fulfillment_status}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="border-b border-border px-4 py-3 text-right font-extrabold text-text-brown">
                  {formatPrice(Number(order.total))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orders.length > ORDERS_PAGE_SIZE ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Showing {(safePage - 1) * ORDERS_PAGE_SIZE + 1}–{Math.min(safePage * ORDERS_PAGE_SIZE, orders.length)} of{' '}
            {orders.length} orders
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className={cn('min-w-16 text-center text-sm text-muted')}>
              {safePage} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <OrderDetailSheet
        orderId={selectedOrderId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        enabled
      />
    </>
  )
}
