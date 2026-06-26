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
import { ImageUploadField } from '@/admin/components/ImageUploadField'
import { RichTextEditor } from '@/admin/components/RichTextEditor'
import { sanitizeMarketingHtml } from '@/lib/sanitizeHtml'
import { useAdminTablePagination } from '@/admin/useAdminTablePagination'
import { useBulkSelection } from '@/admin/hooks/useBulkSelection'
import { adminBtnPrimary, adminBtnSecondary, adminInput, adminLabel } from '@/admin/adminClassNames'
import { AdminClickableTableRow, AdminTableStopCell } from '@/admin/components/AdminClickableTableRow'
import { AdminRowActions, adminTableActionsCellClass, adminTableActionsHeadClass, crudRowActions } from '@/admin/components/AdminRowActions'
import { duplicateCopyLabel, duplicateCopySlug } from '@/admin/lib/duplicateRecord'

type Row = Database['public']['Tables']['collections']['Row']

type FormState = {
  title: string
  slug: string
  description: string
  cover_image_url: string
  type: string
  sort_order: string
  is_active: boolean
}

const emptyForm = (): FormState => ({
  title: '',
  slug: '',
  description: '',
  cover_image_url: '',
  type: 'seasonal',
  sort_order: '0',
  is_active: true,
})

export function AdminCollections() {
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
    const supabase = tryGetSupabase()
    const { data, error: fetchError } = await supabase.from('collections').select('*').order('sort_order')
    if (fetchError) setError(fetchError.message)
    else setRows(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  function openCreate() { setEditing(null); setForm(emptyForm()); setModalOpen(true) }
  function openEdit(row: Row) {
    setEditing(row)
    setForm({
      title: row.title,
      slug: row.slug,
      description: row.description ?? '',
      cover_image_url: row.cover_image_url ?? '',
      type: row.type ?? 'seasonal',
      sort_order: String(row.sort_order),
      is_active: row.is_active,
    })
    setModalOpen(true)
  }

  function openDuplicate(row: Row) {
    setEditing(null)
    setForm({
      title: duplicateCopyLabel(row.title),
      slug: duplicateCopySlug(row.slug),
      description: row.description ?? '',
      cover_image_url: row.cover_image_url ?? '',
      type: row.type ?? 'seasonal',
      sort_order: String(row.sort_order),
      is_active: row.is_active,
    })
    setModalOpen(true)
  }

  async function save() {
    if (!form.title.trim()) return setError('Title is required.')
    if (!SLUG_REGEX.test(form.slug)) return setError('Valid slug is required.')
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: sanitizeMarketingHtml(form.description) || null,
      cover_image_url: form.cover_image_url.trim() || null,
      type: form.type,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    }
    const supabase = tryGetSupabase()
    const result = editing
      ? await supabase.from('collections').update(payload).eq('id', editing.id)
      : await supabase.from('collections').insert(payload)
    setSaving(false)
    if (result.error) return setError(result.error.message)
    toast.success(editing ? 'Collection updated' : 'Collection created')
    setModalOpen(false)
    await refresh()
    await syncCatalog()
  }

  async function remove(row: Row) {
    if (!window.confirm(`Delete "${row.title}"?`)) return
    const { error: deleteError } = await tryGetSupabase().from('collections').delete().eq('id', row.id)
    if (deleteError) return setError(deleteError.message)
    toast.success('Collection deleted')
    await refresh()
    await syncCatalog()
  }

  async function bulkDelete() {
    if (bulk.selectedIds.length === 0) return
    if (!window.confirm(`Delete ${bulk.selectedIds.length} collection(s)?`)) return
    setBulkBusy(true)
    const { error: deleteError } = await tryGetSupabase().from('collections').delete().in('id', bulk.selectedIds)
    setBulkBusy(false)
    if (deleteError) return setError(deleteError.message)
    toast.success(`${bulk.selectedIds.length} collection(s) deleted`)
    bulk.clear()
    await refresh()
    await syncCatalog()
  }

  async function bulkSetActive(is_active: boolean) {
    if (bulk.selectedIds.length === 0) return
    setBulkBusy(true)
    const { error: updateError } = await tryGetSupabase()
      .from('collections')
      .update({ is_active, updated_at: new Date().toISOString() })
      .in('id', bulk.selectedIds)
    setBulkBusy(false)
    if (updateError) return setError(updateError.message)
    toast.success(is_active ? 'Collections activated' : 'Collections deactivated')
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
          <button type="button" className={adminBtnPrimary} onClick={openCreate}><Plus className="h-4 w-4" />Add collection</button>
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
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[var(--admin-surface)] text-[var(--admin-muted)]">
              <tr>
                <th className="w-10 px-4 py-3"><input type="checkbox" checked={bulk.allSelected} onChange={bulk.toggleAll} aria-label="Select all on page" /></th>
                <th className="px-4 py-3">Title</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Active</th><th className={adminTableActionsHeadClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <AdminClickableTableRow key={row.id} onOpen={() => setDetail(row)}>
                  <AdminTableStopCell className="w-10 px-4 py-3"><input type="checkbox" checked={bulk.selected.has(row.id)} onChange={() => bulk.toggle(row.id)} aria-label={`Select ${row.title}`} /></AdminTableStopCell>
                  <td className="px-4 py-3 font-medium">{row.title}</td>
                  <td className="px-4 py-3">{row.type}</td>
                  <td className="px-4 py-3">{row.is_active ? 'Yes' : 'No'}</td>
                  <AdminTableStopCell className={adminTableActionsCellClass}>
                    <AdminRowActions
                      label={`Actions for ${row.title}`}
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
      <AdminSheet open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit collection' : 'New collection'} onSave={() => void save()} saving={saving}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2"><label className={adminLabel}>Title</label><input className={adminInput} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: f.slug || slugify(e.target.value) }))} /></div>
          <div className="space-y-2"><label className={adminLabel}>Slug</label><input className={adminInput} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))} /></div>
          <div className="space-y-2"><label className={adminLabel}>Type</label><input className={adminInput} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} /></div>
          <div className="sm:col-span-2">
            <RichTextEditor
              label="Description"
              value={form.description}
              onChange={(description) => setForm((f) => ({ ...f, description }))}
              placeholder="Describe this collection…"
              minHeight={140}
            />
          </div>
          <div className="sm:col-span-2"><ImageUploadField label="Cover image" value={form.cover_image_url} onChange={(url) => setForm((f) => ({ ...f, cover_image_url: url }))} folder="collections" /></div>
          <div className="space-y-2"><label className={adminLabel}>Sort order</label><input className={adminInput} type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />Active</label>
        </div>
      </AdminSheet>
      <EntityDetailSheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)} title={detail?.title ?? ''} subtitle={detail?.slug} fields={detail ? [{ label: 'Description', value: detail.description }, { label: 'Type', value: detail.type }] : []} />
    </div>
  )
}
