import { useCallback, useEffect, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { tryGetSupabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/database.types'
import { useAdminCatalogSync } from '@/admin/hooks/useAdminCatalogSync'
import { SLUG_REGEX, slugify } from '@/lib/utils'
import { AdminSheet } from '@/admin/components/AdminSheet'
import { AdminBulkToolbar } from '@/admin/components/AdminBulkToolbar'
import { EntityDetailSheet } from '@/admin/components/EntityDetailSheet'
import { AdminTablePagination } from '@/admin/components/AdminTablePagination'
import { AdminErrorBanner, AdminLoadingState } from '@/admin/components/AdminPageHeading'
import { AdminTabToolbar } from '@/admin/components/AdminTabToolbar'
import { useAdminTablePagination } from '@/admin/useAdminTablePagination'
import { useBulkSelection } from '@/admin/hooks/useBulkSelection'
import { BrandedSelect } from '@/components/ui/BrandedSelect'
import { adminBtnPrimary, adminBtnSecondary, adminInput, adminLabel } from '@/admin/adminClassNames'
import { AdminClickableTableRow, AdminTableStopCell } from '@/admin/components/AdminClickableTableRow'
import { AdminRowActions, adminTableActionsCellClass, adminTableActionsHeadClass, crudRowActions } from '@/admin/components/AdminRowActions'
import { duplicateCopyLabel, duplicateCopySlug } from '@/admin/lib/duplicateRecord'

type Row = Database['public']['Tables']['categories']['Row']

type FormState = { name: string; slug: string; parent_id: string; sort_order: string; is_active: boolean }

const emptyForm = (): FormState => ({ name: '', slug: '', parent_id: '', sort_order: '0', is_active: true })

export function AdminCategories() {
  const syncCatalog = useAdminCatalogSync()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState<Row | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const pagination = useAdminTablePagination(rows.length)
  const pageRows = rows.slice(pagination.start, pagination.end)
  const bulk = useBulkSelection(pageRows.map((r) => r.id))

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data, error: fetchError } = await tryGetSupabase().from('categories').select('*').order('sort_order')
    if (fetchError) setError(fetchError.message)
    else setRows(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  function openCreate() { setEditing(null); setForm(emptyForm()); setModalOpen(true) }
  function openEdit(row: Row) {
    setEditing(row)
    setForm({ name: row.name, slug: row.slug, parent_id: row.parent_id ?? '', sort_order: String(row.sort_order), is_active: row.is_active })
    setModalOpen(true)
  }

  function openDuplicate(row: Row) {
    setEditing(null)
    setForm({
      name: duplicateCopyLabel(row.name),
      slug: duplicateCopySlug(row.slug),
      parent_id: row.parent_id ?? '',
      sort_order: String(row.sort_order),
      is_active: row.is_active,
    })
    setModalOpen(true)
  }

  async function save() {
    if (!form.name.trim()) return setError('Name is required.')
    if (!SLUG_REGEX.test(form.slug)) return setError('Valid slug is required.')
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      parent_id: form.parent_id || null,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    }
    const result = editing
      ? await tryGetSupabase().from('categories').update(payload).eq('id', editing.id)
      : await tryGetSupabase().from('categories').insert(payload)
    setSaving(false)
    if (result.error) return setError(result.error.message)
    toast.success(editing ? 'Category updated' : 'Category created')
    setModalOpen(false)
    await refresh()
    await syncCatalog()
  }

  async function remove(row: Row) {
    if (!window.confirm(`Delete "${row.name}"?`)) return
    const { error: deleteError } = await tryGetSupabase().from('categories').delete().eq('id', row.id)
    if (deleteError) return setError(deleteError.message)
    toast.success('Category deleted')
    await refresh()
    await syncCatalog()
  }

  async function bulkDelete() {
    if (bulk.selectedIds.length === 0) return
    if (!window.confirm(`Delete ${bulk.selectedIds.length} categor${bulk.selectedIds.length === 1 ? 'y' : 'ies'}?`)) return
    setBulkBusy(true)
    const { error: deleteError } = await tryGetSupabase().from('categories').delete().in('id', bulk.selectedIds)
    setBulkBusy(false)
    if (deleteError) return setError(deleteError.message)
    toast.success(`${bulk.selectedIds.length} categor${bulk.selectedIds.length === 1 ? 'y' : 'ies'} deleted`)
    bulk.clear()
    await refresh()
    await syncCatalog()
  }

  async function bulkSetActive(is_active: boolean) {
    if (bulk.selectedIds.length === 0) return
    setBulkBusy(true)
    const { error: updateError } = await tryGetSupabase()
      .from('categories')
      .update({ is_active, updated_at: new Date().toISOString() })
      .in('id', bulk.selectedIds)
    setBulkBusy(false)
    if (updateError) return setError(updateError.message)
    toast.success(is_active ? 'Categories activated' : 'Categories deactivated')
    bulk.clear()
    await refresh()
    await syncCatalog()
  }

  if (loading) return <AdminLoadingState />

  return (
    <div>
      <AdminTabToolbar actions={
        <>
          <button type="button" className={adminBtnSecondary} onClick={() => void refresh()}><RefreshCw className="h-4 w-4" />Refresh</button>
          <button type="button" className={adminBtnPrimary} onClick={openCreate}><Plus className="h-4 w-4" />Add category</button>
        </>
      } />
      <AdminErrorBanner message={error} />
      <AdminBulkToolbar
        selectedCount={bulk.selectedIds.length}
        onClear={bulk.clear}
        onDelete={() => void bulkDelete()}
        onPublish={() => void bulkSetActive(true)}
        onUnpublish={() => void bulkSetActive(false)}
        busy={bulkBusy}
      />
      <div className="admin-table-frame">
        <div className="admin-table-wrap">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-[var(--admin-surface)] text-[var(--admin-muted)]">
              <tr>
                <th className="w-10 px-4 py-3"><input type="checkbox" checked={bulk.allSelected} onChange={bulk.toggleAll} aria-label="Select all on page" /></th>
                <th className="px-4 py-3">Name</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Parent</th><th className="px-4 py-3">Active</th><th className={adminTableActionsHeadClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <AdminClickableTableRow key={row.id} onOpen={() => setDetail(row)}>
                  <AdminTableStopCell className="w-10 px-4 py-3"><input type="checkbox" checked={bulk.selected.has(row.id)} onChange={() => bulk.toggle(row.id)} aria-label={`Select ${row.name}`} /></AdminTableStopCell>
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{row.slug}</td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{rows.find((r) => r.id === row.parent_id)?.name ?? '—'}</td>
                  <td className="px-4 py-3">{row.is_active ? 'Yes' : 'No'}</td>
                  <AdminTableStopCell className={adminTableActionsCellClass}>
                    <AdminRowActions
                      label={`Actions for ${row.name}`}
                      actions={crudRowActions({
                        onView: () => setDetail(row),
                        onEdit: () => openEdit(row),
                        onDuplicate: () => openDuplicate(row),
                        onDelete: () => void remove(row),
                      })}
                    />
                  </AdminTableStopCell>
                </AdminClickableTableRow>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[var(--admin-border)] p-4"><AdminTablePagination {...pagination} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} /></div>
      </div>
      <AdminSheet open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit category' : 'New category'} onSave={() => void save()} saving={saving}>
        <div className="grid gap-4">
          <div className="space-y-2"><label className={adminLabel}>Name</label><input className={adminInput} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))} /></div>
          <div className="space-y-2"><label className={adminLabel}>Slug</label><input className={adminInput} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))} /></div>
          <div className="space-y-2">
            <label className={adminLabel}>Parent category</label>
            <BrandedSelect
              allowEmpty
              emptyLabel="None (top-level)"
              value={form.parent_id}
              onValueChange={(parent_id) => setForm((f) => ({ ...f, parent_id }))}
              options={rows.filter((r) => r.id !== editing?.id).map((r) => ({ value: r.id, label: r.name }))}
            />
          </div>
          <div className="space-y-2"><label className={adminLabel}>Sort order</label><input className={adminInput} type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />Active</label>
        </div>
      </AdminSheet>
      <EntityDetailSheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)} title={detail?.name ?? ''} subtitle={detail?.slug} fields={detail ? [{ label: 'Sort order', value: detail.sort_order }] : []} />
    </div>
  )
}
