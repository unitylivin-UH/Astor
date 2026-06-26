import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { tryGetSupabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/database.types'
import { useCms } from '@/contexts/CmsContext'
import { SLUG_REGEX, slugify } from '@/lib/utils'
import { AdminSheet } from '@/admin/components/AdminSheet'
import { AdminBulkToolbar } from '@/admin/components/AdminBulkToolbar'
import { AdminLoadingState } from '@/admin/components/AdminPageHeading'
import { AdminTabToolbar } from '@/admin/components/AdminTabToolbar'
import { AdminTablePagination } from '@/admin/components/AdminTablePagination'
import { EntityDetailSheet } from '@/admin/components/EntityDetailSheet'
import { useAdminTablePagination } from '@/admin/useAdminTablePagination'
import { useBulkSelection } from '@/admin/hooks/useBulkSelection'
import { sanitizeMarketingHtml } from '@/lib/sanitizeHtml'
import { RichTextEditor } from '@/admin/components/RichTextEditor'
import { adminBtnGhost, adminInput, adminLabel } from '@/admin/adminClassNames'
import { AdminClickableTableRow, AdminTableStopCell } from '@/admin/components/AdminClickableTableRow'
import { AdminRowActions, adminTableActionsCellClass, adminTableActionsHeadClass, crudRowActions } from '@/admin/components/AdminRowActions'
import { duplicateCopyLabel, duplicateCopySlug } from '@/admin/lib/duplicateRecord'

type PageRow = Database['public']['Tables']['marketing_pages']['Row']

type PageForm = {
  title: string
  slug: string
  body_html: string
  meta_description: string
  published: boolean
  sort_order: string
}

const emptyForm = (): PageForm => ({
  title: '',
  slug: '',
  body_html: '',
  meta_description: '',
  published: true,
  sort_order: '0',
})

export function AdminPages() {
  const { refetchCms } = useCms()
  const [rows, setRows] = useState<PageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<PageRow | null>(null)
  const [form, setForm] = useState<PageForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [detail, setDetail] = useState<PageRow | null>(null)

  const pagination = useAdminTablePagination(rows.length)
  const pageRows = rows.slice(pagination.start, pagination.end)
  const bulk = useBulkSelection(pageRows.map((r) => r.id))

  const refresh = useCallback(async () => {
    setLoading(true)
    const sb = tryGetSupabase()
    if (!sb) return
    const { data } = await sb.from('marketing_pages').select('*').order('sort_order')
    setRows(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setSheetOpen(true)
  }

  function openEdit(row: PageRow) {
    setEditing(row)
    setForm({
      title: row.title,
      slug: row.slug,
      body_html: row.body_html ?? '',
      meta_description: row.meta_description ?? '',
      published: row.published,
      sort_order: String(row.sort_order),
    })
    setSheetOpen(true)
  }

  function openDuplicate(row: PageRow) {
    setEditing(null)
    setForm({
      title: duplicateCopyLabel(row.title),
      slug: duplicateCopySlug(row.slug),
      body_html: row.body_html ?? '',
      meta_description: row.meta_description ?? '',
      published: row.published,
      sort_order: String(row.sort_order),
    })
    setSheetOpen(true)
  }

  async function save() {
    if (!form.title.trim() || !SLUG_REGEX.test(form.slug)) {
      toast.error('Title and valid slug required')
      return
    }
    const sb = tryGetSupabase()
    if (!sb) return
    setSaving(true)
    const payload = {
      id: editing?.id ?? crypto.randomUUID(),
      title: form.title.trim(),
      slug: form.slug.trim(),
      body_html: sanitizeMarketingHtml(form.body_html),
      meta_description: form.meta_description,
      published: form.published,
      sort_order: Number(form.sort_order) || 0,
      updated_at: new Date().toISOString(),
    }
    const { error } = await sb.from('marketing_pages').upsert(payload)
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Page saved')
    setSheetOpen(false)
    await refresh()
    await refetchCms()
  }

  async function bulkDelete() {
    const sb = tryGetSupabase()
    if (!sb || bulk.selectedIds.length === 0) return
    setBulkBusy(true)
    await sb.from('marketing_pages').delete().in('id', bulk.selectedIds)
    setBulkBusy(false)
    bulk.clear()
    await refresh()
    await refetchCms()
  }

  if (loading) return <AdminLoadingState />

  return (
    <div className="space-y-4">
      <AdminTabToolbar actions={<button type="button" className={adminBtnGhost} onClick={openCreate}><Plus className="h-4 w-4" /> Add page</button>} />

      <AdminBulkToolbar selectedCount={bulk.selectedIds.length} onClear={bulk.clear} onDelete={() => void bulkDelete()} busy={bulkBusy} />

      <div className="admin-table-frame">
        <div className="admin-table-wrap">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--admin-border)] text-xs uppercase text-[var(--admin-muted)]">
                <th className="p-3"><input type="checkbox" checked={bulk.allSelected} onChange={bulk.toggleAll} /></th>
                <th className="p-3">Title</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Published</th>
                <th className={adminTableActionsHeadClass} />
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-[var(--admin-muted)]">No pages yet.</td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <AdminClickableTableRow key={row.id} onOpen={() => setDetail(row)}>
                    <AdminTableStopCell className="p-3"><input type="checkbox" checked={bulk.selected.has(row.id)} onChange={() => bulk.toggle(row.id)} /></AdminTableStopCell>
                    <td className="p-3 font-medium">{row.title}</td>
                    <td className="p-3 text-[var(--admin-muted)]">/pages/{row.slug}</td>
                    <td className="p-3">{row.published ? 'Yes' : 'No'}</td>
                    <AdminTableStopCell className={adminTableActionsCellClass}>
                      <AdminRowActions
                        label={`Actions for ${row.title}`}
                        actions={crudRowActions({
                          onView: () => setDetail(row),
                          onEdit: () => openEdit(row),
                          onDuplicate: () => openDuplicate(row),
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

      <AdminSheet open={sheetOpen} onOpenChange={setSheetOpen} title={editing ? 'Edit page' : 'New page'} onSave={() => void save()} saving={saving} size="xl">
        <div className="space-y-4">
          <div><label className={adminLabel}>Title</label><input className={adminInput} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} /></div>
          <div><label className={adminLabel}>Slug</label><input className={adminInput} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
          <div><label className={adminLabel}>Meta description</label><input className={adminInput} value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} /></div>
          <RichTextEditor
            label="Body content"
            value={form.body_html}
            onChange={(body_html) => setForm({ ...form, body_html })}
            placeholder="Write your page content…"
            minHeight={280}
          />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Published</label>
        </div>
      </AdminSheet>

      <EntityDetailSheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)} title={detail?.title ?? ''} fields={detail ? [{ label: 'Slug', value: `/pages/${detail.slug}` }, { label: 'Body', value: <div dangerouslySetInnerHTML={{ __html: detail.body_html ?? '' }} /> }] : []} />
    </div>
  )
}
