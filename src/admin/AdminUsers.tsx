import { useCallback, useEffect, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { tryGetSupabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/database.types'
import { AdminModal } from '@/admin/components/AdminModal'
import { EntityDetailSheet } from '@/admin/components/EntityDetailSheet'
import { AdminTablePagination } from '@/admin/components/AdminTablePagination'
import { AdminErrorBanner, AdminLoadingState } from '@/admin/components/AdminPageHeading'
import { AdminTabToolbar } from '@/admin/components/AdminTabToolbar'
import { useAdminTablePagination } from '@/admin/useAdminTablePagination'
import { BrandedSelect } from '@/components/ui/BrandedSelect'
import { adminBtnPrimary, adminBtnSecondary, adminInput, adminLabel } from '@/admin/adminClassNames'
import { AdminClickableTableRow, AdminTableStopCell } from '@/admin/components/AdminClickableTableRow'
import { AdminRowActions, adminTableActionsCellClass, adminTableActionsHeadClass, crudRowActions } from '@/admin/components/AdminRowActions'

type Row = Database['public']['Tables']['admin_users']['Row']
type Role = Row['role']

type FormState = {
  email: string
  role: Role
  is_active: boolean
  auth_user_id: string
}

const ROLES: Role[] = ['owner', 'admin', 'editor', 'viewer']

const emptyForm = (): FormState => ({
  email: '',
  role: 'editor',
  is_active: true,
  auth_user_id: '',
})

export function AdminUsers() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState<Row | null>(null)
  const pagination = useAdminTablePagination(rows.length)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data, error: fetchError } = await tryGetSupabase().from('admin_users').select('*').order('created_at', { ascending: false })
    if (fetchError) setError(fetchError.message)
    else setRows(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  function openEdit(row: Row) {
    setEditing(row)
    setForm({
      email: row.email,
      role: row.role,
      is_active: row.is_active,
      auth_user_id: row.auth_user_id ?? '',
    })
    setModalOpen(true)
  }

  async function save() {
    if (!form.email.trim()) return setError('Email is required.')
    setSaving(true)
    const payload = {
      email: form.email.trim().toLowerCase(),
      role: form.role,
      is_active: form.is_active,
      auth_user_id: form.auth_user_id.trim() || null,
      updated_at: new Date().toISOString(),
    }
    const result = editing
      ? await tryGetSupabase().from('admin_users').update(payload).eq('id', editing.id)
      : await tryGetSupabase().from('admin_users').insert(payload)
    setSaving(false)
    if (result.error) return setError(result.error.message)
    toast.success(editing ? 'Admin user updated' : 'Admin user created')
    setModalOpen(false)
    await refresh()
  }

  async function remove(row: Row) {
    if (!window.confirm(`Delete admin user ${row.email}?`)) return
    const { error: deleteError } = await tryGetSupabase().from('admin_users').delete().eq('id', row.id)
    if (deleteError) return setError(deleteError.message)
    toast.success('Admin user deleted')
    await refresh()
  }

  if (loading) return <AdminLoadingState />

  return (
    <div>
      <AdminTabToolbar
        actions={
          <>
            <button type="button" className={adminBtnSecondary} onClick={() => void refresh()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button type="button" className={adminBtnPrimary} onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add user
            </button>
          </>
        }
      />
      <AdminErrorBanner message={error} />
      <div className="admin-table-frame">
        <div className="admin-table-wrap">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[var(--admin-surface)] text-[var(--admin-muted)]">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Active</th>
                <th className={adminTableActionsHeadClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginate(rows).map((row) => (
                <AdminClickableTableRow key={row.id} onOpen={() => setDetail(row)}>
                  <td className="px-4 py-3">{row.email}</td>
                  <td className="px-4 py-3">{row.role}</td>
                  <td className="px-4 py-3">{row.is_active ? 'Yes' : 'No'}</td>
                  <AdminTableStopCell className={adminTableActionsCellClass}>
                    <AdminRowActions
                      label={`Actions for ${row.email}`}
                      actions={crudRowActions({
                        onView: () => setDetail(row),
                        onEdit: () => openEdit(row),
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

      <AdminModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit admin user' : 'New admin user'}
        onSave={() => void save()}
        saving={saving}
      >
        <div className="grid gap-4">
          <div className="space-y-2">
            <label className={adminLabel}>Email</label>
            <input
              type="email"
              className={adminInput}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className={adminLabel}>Auth user ID (UUID)</label>
            <input
              className={adminInput}
              placeholder="Optional — from Supabase Auth"
              value={form.auth_user_id}
              onChange={(e) => setForm((f) => ({ ...f, auth_user_id: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className={adminLabel}>Role</label>
            <BrandedSelect
              value={form.role}
              onValueChange={(role) => setForm((f) => ({ ...f, role: role as Role }))}
              options={ROLES.map((role) => ({ value: role, label: role }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
            Active
          </label>
        </div>
      </AdminModal>

      <EntityDetailSheet
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        title={detail?.email ?? ''}
        fields={
          detail
            ? [
                { label: 'Role', value: detail.role },
                { label: 'Auth user ID', value: detail.auth_user_id },
                { label: 'Active', value: detail.is_active ? 'Yes' : 'No' },
                { label: 'Created', value: detail.created_at ? new Date(detail.created_at).toLocaleString() : '—' },
              ]
            : []
        }
      />
    </div>
  )
}
