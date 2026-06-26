import { useCallback, useEffect, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { tryGetSupabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/database.types'
import { AdminSheet } from '@/admin/components/AdminSheet'
import { AdminErrorBanner, AdminLoadingState } from '@/admin/components/AdminPageHeading'
import { AdminTabToolbar } from '@/admin/components/AdminTabToolbar'
import { adminBtnPrimary, adminBtnSecondary, adminInput, adminLabel } from '@/admin/adminClassNames'
import { AdminRowActions, adminTableActionsCellClass, adminTableActionsHeadClass, crudRowActions } from '@/admin/components/AdminRowActions'

type CouponRow = Database['public']['Tables']['coupons']['Row']

type CouponForm = {
  code: string
  description: string
  discount_type: 'percent' | 'fixed'
  discount_value: string
  min_subtotal: string
  max_uses: string
  is_active: boolean
}

const emptyForm = (): CouponForm => ({
  code: '',
  description: '',
  discount_type: 'percent',
  discount_value: '',
  min_subtotal: '0',
  max_uses: '',
  is_active: true,
})

export function AdminCoupons() {
  const [rows, setRows] = useState<CouponRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CouponRow | null>(null)
  const [form, setForm] = useState<CouponForm>(emptyForm())
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data, error: fetchError } = await tryGetSupabase().from('coupons').select('*').order('created_at', { ascending: false })
    if (fetchError) setError(fetchError.message)
    else setRows(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  function openCreate() { setEditing(null); setForm(emptyForm()); setModalOpen(true) }
  function openEdit(row: CouponRow) {
    setEditing(row)
    setForm({
      code: row.code,
      description: row.description ?? '',
      discount_type: row.discount_type as 'percent' | 'fixed',
      discount_value: String(row.discount_value),
      min_subtotal: String(row.min_subtotal),
      max_uses: row.max_uses != null ? String(row.max_uses) : '',
      is_active: row.is_active,
    })
    setModalOpen(true)
  }

  async function save() {
    if (!form.code.trim()) return setError('Code is required')
    setSaving(true)
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_subtotal: Number(form.min_subtotal) || 0,
      max_uses: form.max_uses.trim() ? Number(form.max_uses) : null,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    }
    const supabase = tryGetSupabase()
    const result = editing
      ? await supabase.from('coupons').update(payload).eq('id', editing.id)
      : await supabase.from('coupons').insert(payload)
    setSaving(false)
    if (result.error) return setError(result.error.message)
    toast.success(editing ? 'Coupon updated' : 'Coupon created')
    setModalOpen(false)
    await refresh()
  }

  async function remove(row: CouponRow) {
    if (!window.confirm(`Delete coupon ${row.code}?`)) return
    const { error: deleteError } = await tryGetSupabase().from('coupons').delete().eq('id', row.id)
    if (deleteError) return setError(deleteError.message)
    toast.success('Coupon deleted')
    await refresh()
  }

  if (loading) return <AdminLoadingState />

  return (
    <div>
      <AdminTabToolbar actions={
        <>
          <button type="button" className={adminBtnSecondary} onClick={() => void refresh()}><RefreshCw className="h-4 w-4" />Refresh</button>
          <button type="button" className={adminBtnPrimary} onClick={openCreate}><Plus className="h-4 w-4" />Add coupon</button>
        </>
      } />
      <AdminErrorBanner message={error} />
      <div className="admin-table-frame">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[var(--admin-surface)] text-[var(--admin-muted)]">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Uses</th>
              <th className="px-4 py-3">Active</th>
              <th className={adminTableActionsHeadClass}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[var(--admin-border)]">
                <td className="px-4 py-3 font-mono font-semibold">{row.code}</td>
                <td className="px-4 py-3">{row.discount_type === 'percent' ? `${row.discount_value}%` : `$${row.discount_value}`}</td>
                <td className="px-4 py-3">{row.used_count}{row.max_uses != null ? ` / ${row.max_uses}` : ''}</td>
                <td className="px-4 py-3">{row.is_active ? 'Yes' : 'No'}</td>
                <td className={adminTableActionsCellClass}>
                  <AdminRowActions label={`Actions for ${row.code}`} actions={crudRowActions({ onEdit: () => openEdit(row), onDelete: () => void remove(row) })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminSheet open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit coupon' : 'New coupon'} onSave={() => void save()} saving={saving}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><label className={adminLabel}>Code</label><input className={adminInput} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} /></div>
          <div className="space-y-2"><label className={adminLabel}>Type</label>
            <select className={adminInput} value={form.discount_type} onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value as 'percent' | 'fixed' }))}>
              <option value="percent">Percent</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </div>
          <div className="space-y-2"><label className={adminLabel}>Value</label><input className={adminInput} value={form.discount_value} onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))} /></div>
          <div className="space-y-2"><label className={adminLabel}>Min subtotal</label><input className={adminInput} value={form.min_subtotal} onChange={(e) => setForm((f) => ({ ...f, min_subtotal: e.target.value }))} /></div>
          <div className="space-y-2"><label className={adminLabel}>Max uses</label><input className={adminInput} value={form.max_uses} onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))} placeholder="Unlimited" /></div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />Active</label>
        </div>
      </AdminSheet>
    </div>
  )
}
