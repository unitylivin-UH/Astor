import { useCallback, useEffect, useState } from 'react'
import { tryGetSupabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/database.types'
import { AdminBulkToolbar } from '@/admin/components/AdminBulkToolbar'
import { AdminLoadingState } from '@/admin/components/AdminPageHeading'
import { AdminTablePagination } from '@/admin/components/AdminTablePagination'
import { EntityDetailSheet } from '@/admin/components/EntityDetailSheet'
import { useAdminTablePagination } from '@/admin/useAdminTablePagination'
import { useBulkSelection } from '@/admin/hooks/useBulkSelection'
import { AdminClickableTableRow, AdminTableStopCell } from '@/admin/components/AdminClickableTableRow'
import { AdminRowActions, adminTableActionsCellClass, adminTableActionsHeadClass, crudRowActions } from '@/admin/components/AdminRowActions'

type SubmissionRow = Database['public']['Tables']['form_submissions']['Row']

export function AdminFormSubmissions() {
  const [rows, setRows] = useState<SubmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [detail, setDetail] = useState<SubmissionRow | null>(null)

  const pagination = useAdminTablePagination(rows.length)
  const pageRows = rows.slice(pagination.start, pagination.end)
  const bulk = useBulkSelection(pageRows.map((r) => r.id))

  const refresh = useCallback(async () => {
    setLoading(true)
    const sb = tryGetSupabase()
    if (!sb) return
    const { data } = await sb.from('form_submissions').select('*').order('created_at', { ascending: false })
    setRows(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function openDetail(row: SubmissionRow) {
    setDetail(row)
    if (row.admin_viewed_at) return
    const sb = tryGetSupabase()
    if (!sb) return
    const viewedAt = new Date().toISOString()
    const { error } = await sb.from('form_submissions').update({ admin_viewed_at: viewedAt }).eq('id', row.id)
    if (!error) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, admin_viewed_at: viewedAt } : r)))
      setDetail({ ...row, admin_viewed_at: viewedAt })
    }
  }

  async function bulkDelete() {
    const sb = tryGetSupabase()
    if (!sb) return
    setBulkBusy(true)
    await sb.from('form_submissions').delete().in('id', bulk.selectedIds)
    setBulkBusy(false)
    bulk.clear()
    await refresh()
  }

  if (loading) return <AdminLoadingState />

  return (
    <div className="space-y-4">
      <AdminBulkToolbar selectedCount={bulk.selectedIds.length} onClear={bulk.clear} onDelete={() => void bulkDelete()} busy={bulkBusy} />

      <div className="admin-table-frame">
        <div className="admin-table-wrap">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--admin-border)] text-xs uppercase text-[var(--admin-muted)]">
                <th className="p-3"><input type="checkbox" checked={bulk.allSelected} onChange={bulk.toggleAll} /></th>
                <th className="p-3">Type</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
                <th className={adminTableActionsHeadClass} />
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-[var(--admin-muted)]">No submissions yet.</td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <AdminClickableTableRow key={row.id} onOpen={() => void openDetail(row)}>
                    <AdminTableStopCell className="p-3"><input type="checkbox" checked={bulk.selected.has(row.id)} onChange={() => bulk.toggle(row.id)} /></AdminTableStopCell>
                    <td className="p-3">{row.form_type}</td>
                    <td className="p-3">{row.status}</td>
                    <td className="p-3">{new Date(row.created_at).toLocaleString()}</td>
                    <AdminTableStopCell className={adminTableActionsCellClass}>
                      <AdminRowActions
                        label="Submission actions"
                        actions={crudRowActions({
                          onView: () => void openDetail(row),
                          onDelete: async () => {
                            const sb = tryGetSupabase()
                            if (sb) {
                              await sb.from('form_submissions').delete().eq('id', row.id)
                              await refresh()
                            }
                          },
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
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </div>

      <EntityDetailSheet
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        title="Submission"
        fields={detail ? [{ label: 'Payload', value: <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(detail.payload, null, 2)}</pre> }] : []}
      />
    </div>
  )
}
