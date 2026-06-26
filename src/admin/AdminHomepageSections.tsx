import { useCallback, useEffect, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { tryGetSupabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/database.types'
import { useCms } from '@/contexts/CmsContext'
import { SECTION_KEY_REGEX, sectionKeyify } from '@/lib/utils'
import { AdminSheet } from '@/admin/components/AdminSheet'
import { AdminBulkToolbar } from '@/admin/components/AdminBulkToolbar'
import { EntityDetailSheet } from '@/admin/components/EntityDetailSheet'
import { AdminTablePagination } from '@/admin/components/AdminTablePagination'
import { AdminErrorBanner, AdminLoadingState } from '@/admin/components/AdminPageHeading'
import { AdminTabToolbar } from '@/admin/components/AdminTabToolbar'
import { ImageUploadField } from '@/admin/components/ImageUploadField'
import { useAdminTablePagination } from '@/admin/useAdminTablePagination'
import { useBulkSelection } from '@/admin/hooks/useBulkSelection'
import { adminBtnPrimary, adminBtnSecondary, adminInput, adminLabel } from '@/admin/adminClassNames'
import { AdminClickableTableRow, AdminTableStopCell } from '@/admin/components/AdminClickableTableRow'
import { AdminRowActions, adminTableActionsCellClass, adminTableActionsHeadClass, crudRowActions } from '@/admin/components/AdminRowActions'
import { duplicateCopyLabel, duplicateCopySectionKey } from '@/admin/lib/duplicateRecord'

type Row = Database['public']['Tables']['homepage_sections']['Row']

type FormState = {
  section_key: string
  title: string
  subtitle: string
  image_url: string
  cta_label: string
  cta_url: string
  sort_order: string
  is_active: boolean
}

const emptyForm = (): FormState => ({
  section_key: '',
  title: '',
  subtitle: '',
  image_url: '',
  cta_label: '',
  cta_url: '',
  sort_order: '0',
  is_active: true,
})

export function AdminHomepageSections() {
  const { refetchCms } = useCms()
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
    const { data, error: fetchError } = await tryGetSupabase().from('homepage_sections').select('*').order('sort_order')
    if (fetchError) setError(fetchError.message)
    else setRows(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  function openCreate() { setEditing(null); setForm(emptyForm()); setModalOpen(true) }
  function openEdit(row: Row) {
    setEditing(row)
    setForm({
      section_key: row.section_key,
      title: row.title ?? '',
      subtitle: row.subtitle ?? '',
      image_url: row.image_url ?? '',
      cta_label: row.cta_label ?? '',
      cta_url: row.cta_url ?? '',
      sort_order: String(row.sort_order),
      is_active: row.is_active,
    })
    setModalOpen(true)
  }

  function openDuplicate(row: Row) {
    setEditing(null)
    setForm({
      section_key: duplicateCopySectionKey(row.section_key),
      title: row.title ? duplicateCopyLabel(row.title) : '',
      subtitle: row.subtitle ?? '',
      image_url: row.image_url ?? '',
      cta_label: row.cta_label ?? '',
      cta_url: row.cta_url ?? '',
      sort_order: String(row.sort_order),
      is_active: row.is_active,
    })
    setModalOpen(true)
  }

  async function save() {
    setError(null)
    if (!form.section_key.trim() || !SECTION_KEY_REGEX.test(form.section_key)) {
      return setError('Valid section key is required (lowercase letters, numbers, hyphens, or underscores).')
    }
    setSaving(true)
    const payload = {
      section_key: form.section_key.trim(),
      title: form.title.trim() || null,
      subtitle: form.subtitle.trim() || null,
      image_url: form.image_url.trim() || null,
      cta_label: form.cta_label.trim() || null,
      cta_url: form.cta_url.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    }
    const result = editing
      ? await tryGetSupabase().from('homepage_sections').update(payload).eq('id', editing.id)
      : await tryGetSupabase().from('homepage_sections').insert(payload)
    setSaving(false)
    if (result.error) return setError(result.error.message)
    toast.success(editing ? 'Section updated' : 'Section created')
    setModalOpen(false)
    await refresh()
    await refetchCms()
  }

  async function remove(row: Row) {
    if (!window.confirm(`Delete section "${row.section_key}"?`)) return
    const { error: deleteError } = await tryGetSupabase().from('homepage_sections').delete().eq('id', row.id)
    if (deleteError) return setError(deleteError.message)
    toast.success('Section deleted')
    await refresh()
    await refetchCms()
  }

  async function bulkDelete() {
    if (bulk.selectedIds.length === 0) return
    if (!window.confirm(`Delete ${bulk.selectedIds.length} section(s)?`)) return
    setBulkBusy(true)
    const { error: deleteError } = await tryGetSupabase().from('homepage_sections').delete().in('id', bulk.selectedIds)
    setBulkBusy(false)
    if (deleteError) return setError(deleteError.message)
    toast.success(`${bulk.selectedIds.length} section(s) deleted`)
    bulk.clear()
    await refresh()
    await refetchCms()
  }

  async function bulkSetActive(is_active: boolean) {
    if (bulk.selectedIds.length === 0) return
    setBulkBusy(true)
    const { error: updateError } = await tryGetSupabase()
      .from('homepage_sections')
      .update({ is_active, updated_at: new Date().toISOString() })
      .in('id', bulk.selectedIds)
    setBulkBusy(false)
    if (updateError) return setError(updateError.message)
    toast.success(is_active ? 'Sections activated' : 'Sections deactivated')
    bulk.clear()
    await refresh()
    await refetchCms()
  }

  if (loading) return <AdminLoadingState />

  return (
    <div>
      <AdminTabToolbar actions={<><button type="button" className={adminBtnSecondary} onClick={() => void refresh()}><RefreshCw className="h-4 w-4" />Refresh</button><button type="button" className={adminBtnPrimary} onClick={openCreate}><Plus className="h-4 w-4" />Add section</button></>} />
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
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-[var(--admin-surface)] text-[var(--admin-muted)]">
              <tr>
                <th className="w-10 px-4 py-3"><input type="checkbox" checked={bulk.allSelected} onChange={bulk.toggleAll} aria-label="Select all on page" /></th>
                <th className="px-4 py-3">Key</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">Active</th><th className={adminTableActionsHeadClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <AdminClickableTableRow key={row.id} onOpen={() => setDetail(row)}>
                  <AdminTableStopCell className="w-10 px-4 py-3"><input type="checkbox" checked={bulk.selected.has(row.id)} onChange={() => bulk.toggle(row.id)} aria-label={`Select ${row.section_key}`} /></AdminTableStopCell>
                  <td className="px-4 py-3 font-mono text-xs">{row.section_key}</td>
                  <td className="px-4 py-3">{row.title}</td>
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
      <AdminSheet open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit section' : 'New section'} onSave={() => void save()} saving={saving} size="lg">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><label className={adminLabel}>Section key</label><input className={adminInput} value={form.section_key} onChange={(e) => setForm((f) => ({ ...f, section_key: sectionKeyify(e.target.value) }))} disabled={!!editing} placeholder="e.g. newly_dropped" /></div>
          <div className="space-y-2"><label className={adminLabel}>Sort order</label><input className={adminInput} type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} /></div>
          <div className="space-y-2 sm:col-span-2"><label className={adminLabel}>Title</label><input className={adminInput} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
          <div className="space-y-2 sm:col-span-2"><label className={adminLabel}>Subtitle</label><textarea className={`${adminInput} min-h-20 py-2`} value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} /></div>
          <div className="sm:col-span-2"><ImageUploadField label="Image" value={form.image_url} onChange={(url) => setForm((f) => ({ ...f, image_url: url }))} folder="sections" /></div>
          <div className="space-y-2"><label className={adminLabel}>CTA label</label><input className={adminInput} value={form.cta_label} onChange={(e) => setForm((f) => ({ ...f, cta_label: e.target.value }))} /></div>
          <div className="space-y-2"><label className={adminLabel}>CTA URL</label><input className={adminInput} value={form.cta_url} onChange={(e) => setForm((f) => ({ ...f, cta_url: e.target.value }))} /></div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />Active</label>
        </div>
      </AdminSheet>
      <EntityDetailSheet
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        title={detail?.title ?? detail?.section_key ?? ''}
        fields={detail ? [{ label: 'Key', value: detail.section_key }, { label: 'Subtitle', value: detail.subtitle ?? '—' }] : []}
      />
    </div>
  )
}
