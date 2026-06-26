import { Link } from '@tanstack/react-router'
import { Download, Printer } from 'lucide-react'
import { useCms } from '@/contexts/CmsContext'
import { useFormatPrice } from '@/lib/currency'
import { formatShippingAddress } from '@/lib/formatShippingAddress'
import { downloadOrderDocument, printOrderDocument } from '@/lib/orders/downloadOrderDocument'
import type { CustomerOrderDetail } from '@/lib/storefront/storefrontRpc'
import { Button } from '@/components/ui/button'

type OrderDetailContentProps = {
  order: CustomerOrderDetail
}

export function OrderDetailContent({ order }: OrderDetailContentProps) {
  const { snapshot } = useCms()
  const formatPrice = useFormatPrice()
  const shippingText = formatShippingAddress(order.shipping_address)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-surface px-3 py-1 text-sm capitalize text-text-brown">
          {order.status.replace(/_/g, ' ')}
        </span>
        {(order.fulfillment_status === 'shipped' || order.fulfillment_status === 'delivered') ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium capitalize text-emerald-800">
            {order.fulfillment_status}
          </span>
        ) : null}
      </div>

      <p className="text-sm text-muted">{order.email}</p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => downloadOrderDocument(order, snapshot.siteName, 'invoice', formatPrice)}
        >
          <Download className="mr-1.5 h-4 w-4" />
          Download invoice
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => downloadOrderDocument(order, snapshot.siteName, 'receipt', formatPrice)}
        >
          <Download className="mr-1.5 h-4 w-4" />
          Download receipt
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => printOrderDocument(order, snapshot.siteName, 'invoice', formatPrice)}
        >
          <Printer className="mr-1.5 h-4 w-4" />
          Print
        </Button>
      </div>

      {shippingText ? (
        <div className="rounded-lg border border-border bg-surface/40 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Shipping address</h3>
          <p className="mt-2 whitespace-pre-line text-sm text-text-brown">{shippingText}</p>
        </div>
      ) : null}

      {(order.fulfillment_status === 'shipped' || order.fulfillment_status === 'delivered') && order.tracking_number ? (
        <div className="rounded-lg border border-border bg-surface/40 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Tracking</h3>
          <p className="mt-2 text-sm text-text-brown">
            <span className="font-medium">{order.carrier ?? 'Carrier'}:</span> {order.tracking_number}
          </p>
          {order.shipped_at ? (
            <p className="mt-1 text-xs text-muted">Shipped {new Date(order.shipped_at).toLocaleDateString()}</p>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="hidden border-b border-border bg-surface/60 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted md:grid md:grid-cols-[1fr_72px_72px_80px] md:gap-3">
          <span>Product</span>
          <span className="text-right">Price</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Total</span>
        </div>

        <ul className="divide-y divide-border">
          {order.order_items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 px-3 py-3 md:grid md:grid-cols-[1fr_72px_72px_80px] md:items-center md:gap-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />
                ) : null}
                <div className="min-w-0">
                  {item.product_slug ? (
                    <Link
                      to="/product/$slug"
                      params={{ slug: item.product_slug }}
                      className="line-clamp-2 text-sm font-semibold text-text-brown hover:text-cta-brown"
                    >
                      {item.product_name}
                    </Link>
                  ) : (
                    <p className="line-clamp-2 text-sm font-semibold text-text-brown">{item.product_name}</p>
                  )}
                  {item.variant_name ? <p className="text-xs text-muted">{item.variant_name}</p> : null}
                </div>
              </div>
              <p className="text-sm md:text-right">{formatPrice(Number(item.unit_price))}</p>
              <p className="text-sm md:text-right">{item.quantity}</p>
              <p className="text-sm font-semibold md:text-right">{formatPrice(Number(item.line_total))}</p>
            </li>
          ))}
        </ul>

        <div className="border-t border-border bg-surface/40 px-3 py-3">
          <div className="ml-auto flex max-w-xs flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span>{formatPrice(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold">
              <span>Total</span>
              <span>{formatPrice(Number(order.total))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
