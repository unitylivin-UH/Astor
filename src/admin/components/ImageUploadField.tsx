import { useRef, useState } from 'react'
import { FolderOpen, ImagePlus, Loader2, Link2, Trash2, Upload } from 'lucide-react'
import { MediaPickerModal } from '@/admin/components/MediaPickerModal'
import { uploadCmsMediaFile } from '@/admin/lib/uploadMedia'
import { adminBtnSecondary, adminInput, adminLabel } from '@/admin/adminClassNames'
import { cn } from '@/lib/utils'

type ImageUploadFieldProps = {
  label: string
  value: string
  onChange: (url: string) => void
  folder?: string
  className?: string
  /** Compact mode hides the large dropzone (for inline contexts). */
  compact?: boolean
}

export function ImageUploadField({
  label,
  value,
  onChange,
  folder = 'uploads',
  className,
  compact = false,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  async function handleFileChange(file: File | null) {
    if (!file || !file.type.startsWith('image/')) {
      if (file) setError('Please choose an image file')
      return
    }
    setError(null)
    setUploading(true)
    setUploadProgress(0)

    try {
      const result = await uploadCmsMediaFile(file, folder, setUploadProgress)
      onChange(result.publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    void handleFileChange(file ?? null)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <label className={adminLabel}>{label}</label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
      />

      {value && !compact ? (
        <div className="relative overflow-hidden rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)]">
          <img src={value} alt="" className="aspect-[16/9] w-full object-cover" />
          {uploading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="mt-2 text-sm font-medium">{uploadProgress}%</span>
            </div>
          ) : (
            <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
              <button
                type="button"
                className={cn(adminBtnSecondary, 'border-white/20 bg-white/90 text-xs')}
                onClick={() => inputRef.current?.click()}
              >
                <ImagePlus className="h-3.5 w-3.5" />
                Replace
              </button>
              <button
                type="button"
                className={cn(adminBtnSecondary, 'border-white/20 bg-white/90 text-xs')}
                onClick={() => setPickerOpen(true)}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Library
              </button>
              <button
                type="button"
                className={cn(adminBtnSecondary, 'ml-auto border-red-200 bg-red-50 text-xs text-red-700')}
                onClick={() => onChange('')}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={cn(
            'relative flex cursor-pointer flex-col items-center justify-center rounded-[var(--admin-radius)] border-2 border-dashed px-4 py-8 transition-colors',
            dragOver
              ? 'border-[var(--admin-primary)] bg-[var(--admin-primary-muted)]'
              : 'border-[var(--admin-border)] bg-[var(--admin-surface)] hover:border-[var(--admin-primary)] hover:bg-[var(--admin-primary-muted)]/40',
            compact && 'py-5',
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-[var(--admin-primary)]" />
              <p className="mt-2 text-sm font-medium text-[var(--admin-muted)]">Uploading {uploadProgress}%</p>
              <div className="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[var(--admin-border)]">
                <div
                  className="h-full rounded-full bg-[var(--admin-primary)] transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-primary-muted)]">
                <Upload className="h-5 w-5 text-[var(--admin-primary)]" />
              </div>
              <p className="mt-3 text-sm font-medium text-[var(--admin-text)]">
                {compact ? 'Drop image or click to upload' : 'Drop image here or click to browse'}
              </p>
              <p className="mt-1 text-xs text-[var(--admin-muted)]">JPEG, PNG, WebP or GIF · max 5 MB</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button type="button" className={adminBtnSecondary} onClick={() => setPickerOpen(true)}>
                  <FolderOpen className="h-4 w-4" />
                  Media library
                </button>
                <button
                  type="button"
                  className={adminBtnSecondary}
                  onClick={() => setShowUrlInput((v) => !v)}
                >
                  <Link2 className="h-4 w-4" />
                  {showUrlInput ? 'Hide URL' : 'Paste URL'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {showUrlInput && !value ? (
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 shrink-0 text-[var(--admin-muted)]" />
          <input
            type="url"
            className={adminInput}
            placeholder="https://…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      ) : null}

      {compact && value ? (
        <div className="flex items-center gap-2">
          <img src={value} alt="" className="h-12 w-12 rounded-[var(--admin-radius)] border border-[var(--admin-border)] object-cover" />
          <button type="button" className={adminBtnSecondary} onClick={() => onChange('')}>
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        </div>
      ) : null}

      {error ? <p className="text-xs text-[var(--admin-danger)]">{error}</p> : null}

      <MediaPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        folder={folder}
        title={`Choose ${label.toLowerCase()}`}
        onSelect={onChange}
      />
    </div>
  )
}
