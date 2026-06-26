import { useCallback, useEffect, useState } from 'react'
import { Package, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { tryGetSupabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/database.types'
import { listAdminOrders } from '@/admin/lib/adminRpc'
import { fulfillOrderInventory, markOrderShipped } from '@/admin/lib/adminFulfillment'
import { formatCurrency, getCurrencyFromSettings } from '@/lib/currency'
import { formatShippingAddress } from '@/lib/formatShippingAddress'
import { useCms } from '@/contexts/CmsContext'
import { AdminLoadingState } from '@/admin/components/AdminPageHeading'
import { AdminTablePagination } from '@/admin/components/AdminTablePagination'
import { AdminSheet } from '@/admin/components/AdminSheet'
import { useAdminTablePagination } from '@/admin/useAdminTablePagination'
import { BrandedSelect } from '@/components/ui/BrandedSelect'
import { adminBtnPrimary, adminBtnSecondary, adminInput, adminLabel } from '@/admin/adminClassNames'
import { AdminClickableTableRow, AdminTableStopCell } from '@/admin/components/AdminClickableTableRow'
import { AdminRowActions, adminTableActionsCellClass, adminTableActionsHeadClass, crudRowActions } from '@/admin/components/AdminRowActions'
import { cn } from '@/lib/utils'

type OrderRow = Database['public']['Tables']['orders']['Row']
type OrderItemRow = Database['public']['Tables']['order_items']['Row']

const STATUSES = ['pending', 'paid', 'failed', 'refunded', 'cancelled', 'quote_requested'] as const
const FULFILLMENT_STATUSES = ['unfulfilled', 'processing', 'shipped', 'delivered'] as const
const CARRIERS = ['USPS', 'UPS', 'FedEx', 'DHL', 'Other'] as const

function fulfillmentBadgeClass(status: string) {
  switch (status) {
    case 'shipped':
    case 'delivered':
      return 'bg-emerald-100 text-emerald-800'
    case 'processing':
      return 'bg-amber-100 text-amber-800'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

export function AdminOrders() {
  const { snapshot } = useCms()
  const currency = getCurrencyFromSettings(snapshot.siteSettings)
  const [rows, setRows] = useState<OrderRow[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<OrderRow | null>(null)
  const [lineItems, setLineItems] = useState<OrderItemRow[]>([])
  const [statusDraft, setStatusDraft] = useState('')
  const [fulfillmentDraft, setFulfillmentDraft] = useState('')
  const [carrierDraft, setCarrierDraft] = useState('')
  const [trackingDraft, setTrackingDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [shippingBusy, setShippingBusy] = useState(false)
  const pagination = useAdminTablePagination(total)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listAdminOrders({
        limit: pagination.pageSize,
        offset: pagination.start,
        search: search.trim() || undefined,
      })
      setRows(result.items)
      setTotal(result.total)
    } finally {
      setLoading(false)
    }
  }, [pagination.pageSize, pagination.start, search])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function openDetail(row: OrderRow) {
    setDetail(row)
    setStatusDraft(row.status)
    setFulfillmentDraft(row.fulfillment_status ?? 'unfulfilled')
    setCarrierDraft(row.carrier ?? '')
    setTrackingDraft(row.tracking_number ?? '')
    const sb = tryGetSupabase()
    if (!sb) return
    const { data } = await sb.from('order_items').select('*').eq('order_id', row.id)
    setLineItems(data ?? [])

    if (row.status === 'quote_requested' && !row.admin_viewed_at) {
      const viewedAt = new Date().toISOString()
      const { error } = await sb.from('orders').update({ admin_viewed_at: viewedAt }).eq('id', row.id)
      if (!error) {
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, admin_viewed_at: viewedAt } : r)))
        setDetail((prev) => (prev?.id === row.id ? { ...prev, admin_viewed_at: viewedAt } : prev))
      }
    }
  }

  async function saveOrder() {
    if (!detail) return
    const sb = tryGetSupabase()
    if (!sb) return

    const previousStatus = detail.status
    setSaving(true)

    const { error } = await sb
      .from('orders')
      .update({
        status: statusDraft,
        fulfillment_status: fulfillmentDraft,
        carrier: carrierDraft.trim() || null,
        tracking_number: trackingDraft.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', detail.id)

    setSaving(false)

    if (error) {
      toast.error(error.message)
      return
    }

    if (statusDraft === 'paid' && previousStatus !== 'paid') {
      const fulfill = await fulfillOrderInventory(detail.id)
      if (!fulfill.ok) {
        toast.warning(`Order saved but inventory not updated: ${fulfill.error}`)
      }
    }

    toast.success('Order updated')
    setDetail(null)
    void refresh()
  }

  async function handleMarkShipped(notifyCustomer: boolean) {
    if (!detail) return
    if (!carrierDraft.trim()) {
      toast.error('Carrier is required')
      return
    }
    if (!trackingDraft.trim()) {
      toast.error('Tracking number is required')
      return
    }

    setShippingBusy(true)
    const result = await markOrderShipped({
      order_id: detail.id,
      carrier: carrierDraft.trim(),
      tracking_number: trackingDraft.trim(),
      notify_customer: notifyCustomer,
    })
    setShippingBusy(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    const data = result.data
    if (data.email_sent) {
      toast.success('Order marked shipped — customer notified')
    } else if (notifyCustomer && data.email_note) {
      toast.success(`Order marked shipped (email not sent: ${data.email_note})`)
    } else {
      toast.success('Order marked shipped')
    }

    setDetail(null)
    void refresh()
  }

  if (loading) return <AdminLoadingState />

  const shippingText = detail ? formatShippingAddress(detail.shipping_address) : null

  return (
    <div className="space-y-4">
      <div className="admin-search-row">
        <input
          className={adminInput}
          placeholder="Search order # or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') pagination.setPage(1)
          }}
        />
        <button type="button" className={adminBtnSecondary} onClick={() => pagination.setPage(1)}>
          Search
        </button>
      </div>

      <div className="admin-table-frame">
        <div className="admin-table-wrap">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--admin-border)] text-xs uppercase text-[var(--admin-muted)]">
                <th className="p-3">Order</th>
                <th className="p-3">Email</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Fulfillment</th>
                <th className="p-3">Total</th>
                <th className="p-3">Date</th>
                <th className={adminTableActionsHeadClass} />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-[var(--admin-muted)]">No orders yet.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <AdminClickableTableRow key={row.id} onOpen={() => void openDetail(row)}>
                    <td className="p-3 font-medium">{row.order_number}</td>
                    <td className="p-3">{row.email}</td>
                    <td className="p-3 capitalize">{row.status.replace(/_/g, ' ')}</td>
                    <td className="p-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', fulfillmentBadgeClass(row.fulfillment_status ?? 'unfulfilled'))}>
                        {(row.fulfillment_status ?? 'unfulfilled').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3">{formatCurrency(Number(row.total), { code: row.currency, locale: currency.locale })}</td>
                    <td className="p-3 text-[var(--admin-muted)]">{new Date(row.created_at).toLocaleString()}</td>
                    <AdminTableStopCell className={adminTableActionsCellClass}>
                      <AdminRowActions
                        label={`Actions for order ${row.order_number}`}
                        actions={crudRowActions({
                          onView: () => void openDetail(row),
                          viewLabel: 'View order',
                        })}
                      />
                    </AdminTableStopCell>
                  </AdminClickableTableRow>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[var(--admin-border)] p-4">
          <AdminTablePagination
            {...pagination}
            totalItems={total}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </div>

      <AdminSheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)} title={detail?.order_number ?? 'Order'} subtitle={detail?.email} size="lg">
        {detail ? (
          <div className="space-y-6">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p><span className="text-[var(--admin-muted)]">Total:</span> {formatCurrency(Number(detail.total), { code: detail.currency, locale: currency.locale })}</p>
              <p><span className="text-[var(--admin-muted)]">Created:</span> {new Date(detail.created_at).toLocaleString()}</p>
              {detail.shipped_at ? (
                <p><span className="text-[var(--admin-muted)]">Shipped:</span> {new Date(detail.shipped_at).toLocaleString()}</p>
              ) : null}
              <p><span className="text-[var(--admin-muted)]">Stripe session:</span> {detail.stripe_session_id ?? '—'}</p>
            </div>

            {shippingText ? (
              <div className="rounded-[var(--admin-radius)] border border-[var(--admin-border)] p-3 text-sm">
                <p className={adminLabel}>Shipping address</p>
                <p className="mt-1 whitespace-pre-line text-[var(--admin-text)]">{shippingText}</p>
              </div>
            ) : null}

            <div>
              <p className={adminLabel}>Line items</p>
              <ul className="mt-2 space-y-2 text-sm">
                {lineItems.map((item) => (
                  <li key={item.id} className="flex justify-between gap-2 rounded border border-[var(--admin-border)] p-2">
                    <span>{item.product_name} × {item.quantity}</span>
                    <span>{formatCurrency(Number(item.line_total), { code: detail.currency, locale: currency.locale })}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4 rounded-[var(--admin-radius)] border border-[var(--admin-border)] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Package className="h-4 w-4" />
                Payment status
              </p>
              <div className="space-y-2">
                <label className={adminLabel}>Status</label>
                <BrandedSelect
                  value={statusDraft}
                  onValueChange={setStatusDraft}
                  options={STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
                />
              </div>
            </div>

            <div className="space-y-4 rounded-[var(--admin-radius)] border border-[var(--admin-border)] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Truck className="h-4 w-4" />
                Fulfillment
              </p>
              <div className="space-y-2">
                <label className={adminLabel}>Fulfillment status</label>
                <BrandedSelect
                  value={fulfillmentDraft}
                  onValueChange={setFulfillmentDraft}
                  options={FULFILLMENT_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className={adminLabel}>Carrier</label>
                  <BrandedSelect
                    allowEmpty
                    emptyLabel="Select carrier"
                    value={carrierDraft}
                    onValueChange={setCarrierDraft}
                    options={CARRIERS.map((c) => ({ value: c, label: c }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className={adminLabel}>Tracking number</label>
                  <input
                    className={adminInput}
                    placeholder="e.g. 1Z999AA10123456784"
                    value={trackingDraft}
                    onChange={(e) => setTrackingDraft(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className={adminBtnPrimary}
                  disabled={shippingBusy}
                  onClick={() => void handleMarkShipped(true)}
                >
                  {shippingBusy ? 'Processing…' : 'Mark shipped & notify customer'}
                </button>
                <button
                  type="button"
                  className={adminBtnSecondary}
                  disabled={shippingBusy}
                  onClick={() => void handleMarkShipped(false)}
                >
                  Mark shipped (no email)
                </button>
              </div>
            </div>

            <button type="button" className={adminBtnSecondary} disabled={saving} onClick={() => void saveOrder()}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        ) : null}
      </AdminSheet>
    </div>
  )
}
