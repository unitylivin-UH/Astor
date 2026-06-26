import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { tryGetSupabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/database.types'
import { AdminBulkToolbar } from '@/admin/components/AdminBulkToolbar'
import { AdminTablePagination } from '@/admin/components/AdminTablePagination'
import { AdminErrorBanner, AdminLoadingState } from '@/admin/components/AdminPageHeading'
import { AdminTabToolbar } from '@/admin/components/AdminTabToolbar'
import { EntityDetailSheet } from '@/admin/components/EntityDetailSheet'
import { AdminClickableTableRow, AdminTableStopCell } from '@/admin/components/AdminClickableTableRow'
import { useAdminTablePagination } from '@/admin/useAdminTablePagination'
import { useBulkSelection } from '@/admin/hooks/useBulkSelection'
import { adminBtnSecondary } from '@/admin/adminClassNames'
import { AdminRowActions, adminTableActionsCellClass, adminTableActionsHeadClass, crudRowActions } from '@/admin/components/AdminRowActions'

type Row = Database['public']['Tables']['newsletter_subscribers']['Row']

export function AdminNewsletter() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [detail, setDetail] = useState<Row | null>(null)
  const pagination = useAdminTablePagination(rows.length)
  const pageRows = rows.slice(pagination.start, pagination.end)
  const bulk = useBulkSelection(pageRows.map((r) => r.id))

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data, error: fetchError } = await tryGetSupabase()
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false })
    if (fetchError) setError(fetchError.message)
    else setRows(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function remove(row: Row) {
    if (!window.confirm(`Remove subscriber ${row.email}?`)) return
    const { error: deleteError } = await tryGetSupabase().from('newsletter_subscribers').delete().eq('id', row.id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    toast.success('Subscriber removed')
    await refresh()
  }

  async function bulkDelete() {
    if (bulk.selectedIds.length === 0) return
    if (!window.confirm(`Remove ${bulk.selectedIds.length} subscriber(s)?`)) return
    setBulkBusy(true)
    const { error: deleteError } = await tryGetSupabase().from('newsletter_subscribers').delete().in('id', bulk.selectedIds)
    setBulkBusy(false)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    toast.success(`${bulk.selectedIds.length} subscriber(s) removed`)
    bulk.clear()
    await refresh()
  }

  if (loading) return <AdminLoadingState />

  return (
    <div>
      <AdminTabToolbar
        actions={
          <button type="button" className={adminBtnSecondary} onClick={() => void refresh()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />
      <AdminErrorBanner message={error} />
      <AdminBulkToolbar
        selectedCount={bulk.selectedIds.length}
        onClear={bulk.clear}
        onDelete={() => void bulkDelete()}
        busy={bulkBusy}
      />
      <div className="admin-table-frame">
        <div className="admin-table-wrap">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={bulk.allSelected} onChange={bulk.toggleAll} aria-label="Select all on page" />
                </th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className={adminTableActionsHeadClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <AdminClickableTableRow key={row.id} onOpen={() => setDetail(row)}>
                  <AdminTableStopCell className="w-10 px-4 py-3">
                    <input type="checkbox" checked={bulk.selected.has(row.id)} onChange={() => bulk.toggle(row.id)} aria-label={`Select ${row.email}`} />
                  </AdminTableStopCell>
                  <td className="px-4 py-3">{row.email}</td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{row.source ?? '—'}</td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">
                    {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                  </td>
                  <AdminTableStopCell className={adminTableActionsCellClass}>
                    <AdminRowActions
                      label={`Actions for ${row.email}`}
                      actions={crudRowActions({
                        onView: () => setDetail(row),
                        onDelete: () => void remove(row),
                      })}
                    />
                  </AdminTableStopCell>
                </AdminClickableTableRow>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[var(--admin-border)] p-4">
          <AdminTablePagination {...pagination} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
        </div>
      </div>

      <EntityDetailSheet
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        title={detail?.email ?? 'Subscriber'}
        fields={
          detail
            ? [
                { label: 'Email', value: detail.email },
                { label: 'Source', value: detail.source ?? '—' },
                { label: 'Joined', value: detail.created_at ? new Date(detail.created_at).toLocaleString() : '—' },
              ]
            : []
        }
      />
    </div>
  )
}
