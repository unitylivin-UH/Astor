import { useRef, useState, type ChangeEvent } from 'react'
import { Download, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminCatalogSync } from '@/admin/hooks/useAdminCatalogSync'
import { AdminErrorBanner } from '@/admin/components/AdminPageHeading'
import { TransferProgressPanel } from '@/admin/components/TransferProgressPanel'
import {
  DATA_BUNDLES,
  exportDataBundles,
  importDataBundle,
  summarizeExportCounts,
  type DataBundleId,
  type ExportPayload,
  type TransferProgress,
} from '@/admin/lib/dataTransfer'
import { adminBtnPrimary, adminBtnSecondary } from '@/admin/adminClassNames'
import { cn } from '@/lib/utils'

const ALL_BUNDLE_IDS = Object.keys(DATA_BUNDLES) as DataBundleId[]

export function AdminDataTransfer() {
  const syncCatalog = useAdminCatalogSync()
  const fileRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState<Set<DataBundleId>>(new Set(['cms']))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<TransferProgress | null>(null)
  const [preview, setPreview] = useState<ExportPayload | null>(null)

  function toggleBundle(id: DataBundleId) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleExport() {
    setError(null)
    setPreview(null)
    setBusy(true)
    try {
      await exportDataBundles([...selected], setProgress)
      toast.success('Export downloaded')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed'
      setError(message)
      toast.error(message)
    } finally {
      setBusy(false)
      setTimeout(() => setProgress(null), 2500)
    }
  }

  async function handleImport(file: File) {
    setError(null)
    setPreview(null)
    setBusy(true)
    try {
      const result = await importDataBundle(file, setProgress)
      const total = Object.values(result.imported).reduce((sum, n) => sum + (n ?? 0), 0)
      toast.success(`Imported ${total} record(s)`)
      await syncCatalog()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed'
      setError(message)
      toast.error(message)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
      setTimeout(() => setProgress(null), 2500)
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!window.confirm(`Import data from "${file.name}"? Existing records with the same IDs will be updated.`)) {
      event.target.value = ''
      return
    }

    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as ExportPayload
      setPreview(parsed)
    } catch {
      setPreview(null)
    }

    await handleImport(file)
  }

  return (
    <div>
      <AdminErrorBanner message={error} />
      <TransferProgressPanel progress={progress} className="mb-6" />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="admin-section space-y-4">
          <div>
            <h2 className="font-semibold">Export</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Download a JSON backup. Progress shows while records are fetched, then while the file downloads.
            </p>
          </div>

          <div className="space-y-3">
            {ALL_BUNDLE_IDS.map((id) => {
              const bundle = DATA_BUNDLES[id]
              const checked = selected.has(id)
              return (
                <label
                  key={id}
                  className={cn(
                    'flex cursor-pointer gap-3 rounded-lg border p-3 transition',
                    checked
                      ? 'border-[var(--admin-primary)] bg-[var(--admin-primary-muted)]'
                      : 'border-[var(--admin-border)] hover:border-[var(--admin-primary)]/40',
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={checked}
                    disabled={busy}
                    onChange={() => toggleBundle(id)}
                  />
                  <span>
                    <span className="block text-sm font-medium">{bundle.label}</span>
                    <span className="mt-0.5 block text-xs text-[var(--admin-muted)]">{bundle.description}</span>
                  </span>
                </label>
              )
            })}
          </div>

          <button
            type="button"
            className={adminBtnPrimary}
            disabled={busy || selected.size === 0}
            onClick={() => void handleExport()}
          >
            <Download className="h-4 w-4" />
            Export selected
          </button>
        </section>

        <section className="admin-section space-y-4">
          <div>
            <h2 className="font-semibold">Import</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Upload a JSON export from this admin. Records are merged by ID (or setting key). Admin users and Stripe
              secrets are never included.
            </p>
          </div>

          <ul className="list-inside list-disc space-y-1 text-xs text-[var(--admin-muted)]">
            <li>Import order respects foreign keys (categories before products, orders before line items).</li>
            <li>Large files show read progress, then per-table import progress.</li>
            <li>Media URLs are preserved; binary files are not bundled.</li>
          </ul>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            disabled={busy}
            onChange={(e) => void handleFileChange(e)}
          />
          <button
            type="button"
            className={adminBtnSecondary}
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Choose file to import
          </button>

          {preview ? (
            <div className="rounded-lg border border-[var(--admin-border)] p-3 text-xs text-[var(--admin-muted)]">
              <p className="font-medium text-[var(--admin-text)]">Last parsed file</p>
              <p className="mt-1">Exported: {new Date(preview.exportedAt).toLocaleString()}</p>
              <p className="mt-1">Bundles: {preview.bundles.join(', ')}</p>
              <p className="mt-1">{summarizeExportCounts(preview) || 'No records'}</p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
