import { isSupabaseConfigured, tryGetSupabase } from '@/integrations/supabase/client'
import { registerCmsMedia } from '@/admin/lib/adminRpc'

const BUCKET = 'cms-media'

export type UploadMediaResult = {
  publicUrl: string
  fileName: string
  kind: string
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function uploadCmsMediaFile(
  file: File,
  folder: string,
  onProgress?: (percent: number) => void,
): Promise<UploadMediaResult> {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured')
  const supabase = tryGetSupabase()
  if (!supabase) throw new Error('Supabase is not configured')

  const safeName = sanitizeFileName(file.name)
  const path = `${folder}/${Date.now()}-${safeName}`
  const kind = file.type.startsWith('image/') ? 'image' : 'file'

  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) throw new Error('You must be signed in to upload media')

  const baseUrl = import.meta.env.VITE_SUPABASE_URL
  const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!baseUrl || !apiKey) throw new Error('Supabase environment variables are missing')

  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  const uploadUrl = `${baseUrl}/storage/v1/object/${BUCKET}/${encodedPath}`

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`))
    })
    xhr.addEventListener('error', () => reject(new Error('Upload failed')))
    xhr.open('POST', uploadUrl)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('apikey', apiKey)
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.send(file)
  })

  onProgress?.(100)

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const publicUrl = publicData.publicUrl

  await registerCmsMedia({
    publicUrl,
    folder,
    kind,
    fileName: file.name,
  })

  return { publicUrl, fileName: file.name, kind }
}
