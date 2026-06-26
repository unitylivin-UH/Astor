import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { tryGetSupabase } from '@/integrations/supabase/client'
import { useFormatPrice } from '@/lib/currency'
import { AdminErrorBanner, AdminLoadingState } from '@/admin/components/AdminPageHeading'
import { AdminTabToolbar } from '@/admin/components/AdminTabToolbar'
import { AdminTablePagination } from '@/admin/components/AdminTablePagination'
import { useAdminTablePagination } from '@/admin/useAdminTablePagination'
import { adminBtnSecondary, adminInput } from '@/admin/adminClassNames'

type CustomerRow = {
  email: string
  user_id: string | null
  order_count: number
  lifetime_value: number
  last_order_at: string
}

export function AdminCustomers() {
  const formatPrice = useFormatPrice()
  const [rows, setRows] = useState<CustomerRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const pagination = useAdminTablePagination(total)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: rpcError } = await tryGetSupabase().rpc('rpc_list_admin_customers', {
      p_limit: pagination.pageSize,
      p_offset: pagination.start,
      p_search: search.trim() || null,
    })
    if (rpcError) setError(rpcError.message)
    else if (data && (data as { ok: boolean }).ok) {
      const result = data as { items: CustomerRow[]; total: number }
      setRows(result.items ?? [])
      setTotal(result.total ?? 0)
    } else {
      setError((data as { error?: string })?.error ?? 'Failed to load customers')
    }
    setLoading(false)
  }, [pagination.pageSize, pagination.start, search])

  useEffect(() => { void refresh() }, [refresh])

  if (loading && rows.length === 0) return <AdminLoadingState />

  return (
    <div>
      <AdminTabToolbar actions={
        <button type="button" className={adminBtnSecondary} onClick={() => void refresh()}><RefreshCw className="h-4 w-4" />Refresh</button>
      } />
      <div className="mb-4 max-w-md">
        <input className={adminInput} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by email…" />
      </div>
      <AdminErrorBanner message={error} />
      <div className="admin-table-frame">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[var(--admin-surface)] text-[var(--admin-muted)]">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Lifetime value</th>
              <th className="px-4 py-3">Last order</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.email} className="border-t border-[var(--admin-border)]">
                <td className="px-4 py-3 font-medium">{row.email}</td>
                <td className="px-4 py-3">{row.order_count}</td>
                <td className="px-4 py-3">{formatPrice(row.lifetime_value)}</td>
                <td className="px-4 py-3">{row.last_order_at ? new Date(row.last_order_at).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-[var(--admin-border)] p-4">
          <AdminTablePagination {...pagination} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
        </div>
      </div>
    </div>
  )
}
