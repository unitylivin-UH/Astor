import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, ImagePlus, Loader2, Search, Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { listCmsMedia, type CmsMediaRow } from '@/admin/lib/adminRpc'
import { uploadCmsMediaFile } from '@/admin/lib/uploadMedia'
import { adminBtnPrimary, adminBtnSecondary, adminInput, adminLabel } from '@/admin/adminClassNames'
import { cn } from '@/lib/utils'

type Tab = 'library' | 'upload'

type MediaPickerModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (url: string) => void
  folder?: string
  title?: string
}

const PAGE_SIZE = 24

export function MediaPickerModal({
  open,
  onOpenChange,
  onSelect,
  folder = 'uploads',
  title = 'Choose media',
}: MediaPickerModalProps) {
  const [tab, setTab] = useState<Tab>('library')
  const [items, setItems] = useState<CmsMediaRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadLibrary = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listCmsMedia({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        kind: 'image',
        search: search.trim() || undefined,
      })
      setItems(result.items)
      setTotal(result.total)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to load media')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    if (!open) return
    setSelectedUrl(null)
    setUploadError(null)
    setUploadProgress(null)
    if (tab === 'library') void loadLibrary()
  }, [open, tab, loadLibrary])

  useEffect(() => {
    if (!open || tab !== 'library') return
    const timer = window.setTimeout(() => setPage(0), 300)
    return () => window.clearTimeout(timer)
  }, [search, open, tab])

  async function handleUpload(file: File | null) {
    if (!file) return
    setUploadError(null)
    setUploadProgress(0)
    try {
      const result = await uploadCmsMediaFile(file, folder, setUploadProgress)
      setSelectedUrl(result.publicUrl)
      setTab('library')
      setPage(0)
      await loadLibrary()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadProgress(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function confirmSelection() {
    if (!selectedUrl) return
    onSelect(selectedUrl)
    onOpenChange(false)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[min(960px,calc(100vw-1.5rem))] max-w-none flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="border-b border-[var(--admin-border)] px-5 py-4 pr-12">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex border-b border-[var(--admin-border)] px-5">
          <button
            type="button"
            className={cn(
              'border-b-2 px-4 py-3 text-sm font-semibold transition',
              tab === 'library'
                ? 'border-[var(--admin-primary)] text-[var(--admin-primary)]'
                : 'border-transparent text-[var(--admin-muted)] hover:text-[var(--admin-text)]',
            )}
            onClick={() => setTab('library')}
          >
            Media library
          </button>
          <button
            type="button"
            className={cn(
              'border-b-2 px-4 py-3 text-sm font-semibold transition',
              tab === 'upload'
                ? 'border-[var(--admin-primary)] text-[var(--admin-primary)]'
                : 'border-transparent text-[var(--admin-muted)] hover:text-[var(--admin-text)]',
            )}
            onClick={() => setTab('upload')}
          >
            Upload new
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {tab === 'library' ? (
            <div className="space-y-4">
              <div className="relative max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
                <input
                  className={cn(adminInput, 'pl-9')}
                  placeholder="Search files…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16 text-[var(--admin-muted)]">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading media…
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[var(--admin-border)] py-16 text-center">
                  <p className="text-sm text-[var(--admin-muted)]">No images found.</p>
                  <button type="button" className={cn(adminBtnSecondary, 'mt-4')} onClick={() => setTab('upload')}>
                    Upload your first image
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {items.map((item) => {
                    const active = selectedUrl === item.public_url
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={cn(
                          'group relative aspect-square overflow-hidden rounded-lg border-2 bg-[var(--admin-surface)] transition',
                          active ? 'border-[var(--admin-primary)] ring-2 ring-[var(--admin-primary)]/20' : 'border-[var(--admin-border)] hover:border-[var(--admin-primary)]/50',
                        )}
                        onClick={() => setSelectedUrl(item.public_url)}
                      >
                        <img src={item.public_url} alt={item.file_name ?? ''} className="h-full w-full object-cover" />
                        {active ? (
                          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--admin-primary)] text-white">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        ) : null}
                        <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-2 py-1 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                          {item.file_name ?? 'Untitled'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {totalPages > 1 ? (
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    className={adminBtnSecondary}
                    disabled={page === 0 || loading}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Previous
                  </button>
                  <p className="text-xs text-[var(--admin-muted)]">
                    Page {page + 1} of {totalPages}
                  </p>
                  <button
                    type="button"
                    className={adminBtnSecondary}
                    disabled={page >= totalPages - 1 || loading}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void handleUpload(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-14 transition hover:border-[var(--admin-primary)] hover:bg-[var(--admin-primary-muted)]"
                disabled={uploadProgress !== null}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  void handleUpload(e.dataTransfer.files?.[0] ?? null)
                }}
              >
                {uploadProgress !== null ? (
                  <>
                    <Loader2 className="mb-3 h-8 w-8 animate-spin text-[var(--admin-primary)]" />
                    <p className="text-sm font-semibold text-[var(--admin-text)]">Uploading… {uploadProgress}%</p>
                    <div className="mt-4 h-2 w-full max-w-xs overflow-hidden rounded-full bg-[var(--admin-border)]">
                      <div
                        className="h-full rounded-full bg-[var(--admin-primary)] transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="mb-3 h-8 w-8 text-[var(--admin-primary)]" />
                    <p className="text-sm font-semibold text-[var(--admin-text)]">Drop an image here or click to browse</p>
                    <p className="mt-1 text-xs text-[var(--admin-muted)]">PNG, JPG, WEBP, GIF</p>
                  </>
                )}
              </button>
              {uploadError ? <p className="text-xs text-[var(--admin-danger)]">{uploadError}</p> : null}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--admin-border)] px-5 py-4 sm:flex-row sm:justify-end">
          <button type="button" className={adminBtnSecondary} onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button type="button" className={adminBtnPrimary} disabled={!selectedUrl} onClick={confirmSelection}>
            <ImagePlus className="h-4 w-4" />
            Use selected image
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
