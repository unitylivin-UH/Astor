import { useRef, useState } from 'react'
import { FolderOpen, GripVertical, ImagePlus, Loader2, Trash2, Upload } from 'lucide-react'
import { MediaPickerModal } from '@/admin/components/MediaPickerModal'
import { uploadCmsMediaFile } from '@/admin/lib/uploadMedia'
import { adminBtnSecondary, adminLabel } from '@/admin/adminClassNames'
import { cn } from '@/lib/utils'

type GalleryUploadFieldProps = {
  label?: string
  value: string[]
  onChange: (urls: string[]) => void
  folder?: string
  className?: string
  maxImages?: number
}

export function GalleryUploadField({
  label = 'Additional images',
  value,
  onChange,
  folder = 'products',
  className,
  maxImages = 12,
}: GalleryUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  async function uploadFiles(files: FileList | File[]) {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      setError('Please choose image files')
      return
    }

    const remaining = maxImages - value.length
    if (remaining <= 0) {
      setError(`Maximum ${maxImages} gallery images`)
      return
    }

    const toUpload = imageFiles.slice(0, remaining)
    setError(null)
    setUploading(true)
    setUploadProgress(0)

    const newUrls: string[] = []
    try {
      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i]
        const baseProgress = Math.round((i / toUpload.length) * 100)
        const result = await uploadCmsMediaFile(file, folder, (pct) => {
          setUploadProgress(baseProgress + Math.round(pct / toUpload.length))
        })
        newUrls.push(result.publicUrl)
      }
      onChange([...value, ...newUrls])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      if (newUrls.length > 0) onChange([...value, ...newUrls])
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function moveItem(from: number, to: number) {
    if (from === to || to < 0 || to >= value.length) return
    const next = [...value]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  function handleLibrarySelect(url: string) {
    if (value.includes(url)) return
    if (value.length >= maxImages) {
      setError(`Maximum ${maxImages} gallery images`)
      return
    }
    onChange([...value, url])
    setError(null)
  }

  const canAddMore = value.length < maxImages

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <label className={adminLabel}>{label}</label>
        <span className="text-xs text-[var(--admin-muted)]">
          {value.length}/{maxImages}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void uploadFiles(e.target.files ?? [])}
      />

      {value.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) moveItem(dragIndex, index)
                setDragIndex(null)
              }}
              onDragEnd={() => setDragIndex(null)}
              className={cn(
                'group relative aspect-square overflow-hidden rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)]',
                dragIndex === index && 'opacity-50',
              )}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <GripVertical className="h-4 w-4 cursor-grab text-white" />
                <button
                  type="button"
                  className="rounded p-1 text-white hover:bg-red-500/80"
                  onClick={() => removeAt(index)}
                  aria-label="Remove image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {canAddMore ? (
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
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            void uploadFiles(e.dataTransfer.files)
          }}
          onClick={() => !uploading && inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-[var(--admin-radius)] border-2 border-dashed px-4 py-6 transition-colors',
            dragOver
              ? 'border-[var(--admin-primary)] bg-[var(--admin-primary-muted)]'
              : 'border-[var(--admin-border)] bg-[var(--admin-surface)] hover:border-[var(--admin-primary)] hover:bg-[var(--admin-primary-muted)]/40',
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-7 w-7 animate-spin text-[var(--admin-primary)]" />
              <p className="mt-2 text-sm text-[var(--admin-muted)]">Uploading {uploadProgress}%</p>
            </>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--admin-primary-muted)]">
                <Upload className="h-4 w-4 text-[var(--admin-primary)]" />
              </div>
              <p className="mt-2 text-sm font-medium">Drop images or click to upload multiple</p>
              <p className="mt-1 text-xs text-[var(--admin-muted)]">Drag thumbnails to reorder</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button type="button" className={adminBtnSecondary} onClick={() => setPickerOpen(true)}>
                  <FolderOpen className="h-4 w-4" />
                  Add from library
                </button>
                <button type="button" className={adminBtnSecondary} onClick={() => inputRef.current?.click()}>
                  <ImagePlus className="h-4 w-4" />
                  Browse files
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {error ? <p className="text-xs text-[var(--admin-danger)]">{error}</p> : null}

      <MediaPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        folder={folder}
        title="Add gallery image"
        onSelect={handleLibrarySelect}
      />
    </div>
  )
}
