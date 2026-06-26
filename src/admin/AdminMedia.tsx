import { useCallback, useEffect, useRef, useState } from 'react'
import { Copy, ExternalLink, RefreshCw, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { tryGetSupabase } from '@/integrations/supabase/client'
import type { CmsMediaRow } from '@/admin/lib/adminRpc'
import { listCmsMedia } from '@/admin/lib/adminRpc'
import { uploadCmsMediaFile } from '@/admin/lib/uploadMedia'
import { AdminBulkToolbar } from '@/admin/components/AdminBulkToolbar'
import { AdminTablePagination } from '@/admin/components/AdminTablePagination'
import { AdminErrorBanner, AdminLoadingState } from '@/admin/components/AdminPageHeading'
import { AdminTabToolbar } from '@/admin/components/AdminTabToolbar'
import { useAdminTablePagination } from '@/admin/useAdminTablePagination'
import { useBulkSelection } from '@/admin/hooks/useBulkSelection'
import { adminBtnDanger, adminBtnGhost, adminBtnPrimary, adminBtnSecondary } from '@/admin/adminClassNames'
import { cn } from '@/lib/utils'

export function AdminMedia() {
  const [rows, setRows] = useState<CmsMediaRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pagination = useAdminTablePagination(total, 48)
  const pageRows = rows
  const bulk = useBulkSelection(pageRows.map((r) => r.id))

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listCmsMedia({
        limit: pagination.pageSize,
        offset: pagination.start,
        kind: null,
      })
      setRows(result.items)
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media')
    } finally {
      setLoading(false)
    }
  }, [pagination.start, pagination.pageSize])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function handleUpload(file: File | null) {
    if (!file) return
    setError(null)
    setUploadProgress(0)
    try {
      await uploadCmsMediaFile(file, 'uploads', setUploadProgress)
      toast.success('Media uploaded')
      await refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setError(message)
      toast.error(message)
    } finally {
      setUploadProgress(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function remove(row: CmsMediaRow) {
    if (!window.confirm(`Delete media "${row.file_name ?? row.id}"?`)) return
    const { error: deleteError } = await tryGetSupabase().from('cms_media').delete().eq('id', row.id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    toast.success('Media deleted')
    await refresh()
  }

  async function bulkDelete() {
    if (bulk.selectedIds.length === 0) return
    if (!window.confirm(`Delete ${bulk.selectedIds.length} media item(s)?`)) return
    setBulkBusy(true)
    const { error: deleteError } = await tryGetSupabase().from('cms_media').delete().in('id', bulk.selectedIds)
    setBulkBusy(false)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    toast.success(`${bulk.selectedIds.length} media item(s) deleted`)
    bulk.clear()
    await refresh()
  }

  function copyUrl(url: string) {
    void navigator.clipboard.writeText(url)
    toast.success('URL copied')
  }

  if (loading && rows.length === 0) return <AdminLoadingState />

  return (
    <div>
      <AdminTabToolbar
        actions={
          <>
            <button type="button" className={adminBtnSecondary} onClick={() => void refresh()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button type="button" className={adminBtnPrimary} disabled={uploadProgress !== null} onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Upload
            </button>
          </>
        }
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleUpload(e.target.files?.[0] ?? null)}
      />

      <div
        className={cn(
          'admin-upload-zone transition',
          uploadProgress !== null && 'admin-upload-zone-active',
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          void handleUpload(e.dataTransfer.files?.[0] ?? null)
        }}
      >
        <p className="text-sm font-semibold text-[var(--admin-text)]">Drop files here to upload</p>
        <p className="mt-1 text-xs text-[var(--admin-muted)]">or use the Upload button above</p>
        {uploadProgress !== null ? (
          <div className="mx-auto mt-4 max-w-md">
            <p className="mb-2 text-xs font-medium text-[var(--admin-primary)]">Uploading… {uploadProgress}%</p>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--admin-border)]">
              <div className="h-full rounded-full bg-[var(--admin-primary)] transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : null}
      </div>

      <AdminErrorBanner message={error} />
      <AdminBulkToolbar selectedCount={bulk.selectedIds.length} onClear={bulk.clear} onDelete={() => void bulkDelete()} busy={bulkBusy} />

      <div>
        {pageRows.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--admin-muted)]">No media uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {pageRows.map((row) => (
              <article
                key={row.id}
                className={cn(
                  'group overflow-hidden rounded-lg border border-[var(--admin-border)]',
                  bulk.selected.has(row.id) && 'ring-2 ring-[var(--admin-primary)]',
                )}
              >
                <div className="relative aspect-square bg-[var(--admin-surface-elevated)]">
                  <input
                    type="checkbox"
                    className="absolute left-2 top-2 z-10"
                    checked={bulk.selected.has(row.id)}
                    onChange={() => bulk.toggle(row.id)}
                    aria-label={`Select ${row.file_name ?? row.id}`}
                  />
                  {row.kind === 'image' ? (
                    <img src={row.public_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-[var(--admin-muted)]">File</div>
                  )}
                </div>
                <div className="space-y-2 p-2">
                  <p className="truncate text-xs font-medium text-[var(--admin-text)]">{row.file_name ?? 'Untitled'}</p>
                  <p className="truncate text-[10px] text-[var(--admin-muted)]">{row.folder ?? 'uploads'}</p>
                  <div className="flex flex-wrap gap-1">
                    <button type="button" className={adminBtnGhost} onClick={() => copyUrl(row.public_url)}>
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <a href={row.public_url} target="_blank" rel="noreferrer" className={adminBtnGhost}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button type="button" className={adminBtnDanger} onClick={() => void remove(row)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="mt-4 border-t border-[var(--admin-border)] pt-4">
          <AdminTablePagination {...pagination} totalItems={total} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
        </div>
      </div>
    </div>
  )
}
