import type { Database } from '@/integrations/supabase/database.types'
import { isSupabaseConfigured, tryGetSupabase } from '@/integrations/supabase/client'

export type CmsMediaRow = Database['public']['Tables']['cms_media']['Row']
export type CategoryRow = Database['public']['Tables']['categories']['Row']
export type CollectionRow = Database['public']['Tables']['collections']['Row']

type RpcOk<T> = { ok: true } & T
type RpcErr = { ok: false; error: string }

function getClient() {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured')
  const supabase = tryGetSupabase()
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

export async function fetchAdminSession() {
  const supabase = getClient()
  const { data, error } = await supabase.rpc('rpc_get_admin_session')
  if (error) throw new Error(error.message)
  const result = data as RpcOk<{ is_admin: boolean; can_edit: boolean; role: string | null }> | RpcErr
  if (!result?.ok) return { isAdmin: false, canEdit: false, role: null as string | null }
  return {
    isAdmin: Boolean(result.is_admin),
    canEdit: Boolean(result.can_edit),
    role: result.role,
  }
}

export async function fetchAdminEditContext() {
  const supabase = getClient()
  const { data, error } = await supabase.rpc('rpc_get_admin_edit_context')
  if (error) throw new Error(error.message)
  const result = data as RpcOk<{ categories: CategoryRow[]; collections: CollectionRow[] }> | RpcErr
  if (!result?.ok) throw new Error(result.error ?? 'Failed to load edit context')
  return {
    categories: result.categories ?? [],
    collections: result.collections ?? [],
  }
}

export async function fetchAdminDashboard() {
  const supabase = getClient()
  const { data, error } = await supabase.rpc('rpc_get_admin_dashboard')
  if (error) throw new Error(error.message)
  const result = data as RpcOk<{
    counts: {
      products: number
      collections: number
      unread_quotes?: number
      unread_submissions?: number
      categories?: number
      subscribers?: number
      media: number
      total_sales?: number
      users?: number
    }
    recent_newsletter: Database['public']['Tables']['newsletter_subscribers']['Row'][]
    order_chart?: {
      daily: { label: string; short_label?: string; date?: string; count: number; is_current: boolean }[]
      weekly: { label: string; short_label?: string; date?: string; count: number; is_current: boolean }[]
      monthly: { label: string; year?: number; month?: number; count: number; is_current: boolean }[]
    }
  }> | RpcErr
  if (!result?.ok) throw new Error(result.error ?? 'Failed to load dashboard')
  return {
    counts: {
      products: Number(result.counts.products ?? 0),
      collections: Number(result.counts.collections ?? 0),
      unreadQuotes: Number(result.counts.unread_quotes ?? 0),
      unreadSubmissions: Number(result.counts.unread_submissions ?? 0),
      media: Number(result.counts.media ?? 0),
      totalSales: Number(result.counts.total_sales ?? result.counts.users ?? 0),
    },
    recentNewsletter: result.recent_newsletter ?? [],
    orderChart: result.order_chart ?? { daily: [], weekly: [], monthly: [] },
  }
}

export async function listCmsMedia(options?: {
  limit?: number
  offset?: number
  kind?: string | null
  search?: string
}) {
  const supabase = getClient()
  const { data, error } = await supabase.rpc('rpc_list_cms_media', {
    p_limit: options?.limit ?? 48,
    p_offset: options?.offset ?? 0,
    p_kind: options?.kind !== undefined ? options.kind : 'image',
    p_search: options?.search ?? null,
  })
  if (error) throw new Error(error.message)
  const result = data as RpcOk<{ items: CmsMediaRow[]; total: number }> | RpcErr
  if (!result?.ok) throw new Error(result.error ?? 'Failed to load media')
  return { items: result.items ?? [], total: Number(result.total ?? 0) }
}

export async function registerCmsMedia(payload: {
  publicUrl: string
  folder: string
  kind: string
  fileName: string
}) {
  const supabase = getClient()
  const { data, error } = await supabase.rpc('rpc_register_cms_media', {
    p_public_url: payload.publicUrl,
    p_folder: payload.folder,
    p_kind: payload.kind,
    p_file_name: payload.fileName,
  })
  if (error) throw new Error(error.message)
  const result = data as RpcOk<{ media: CmsMediaRow }> | RpcErr
  if (!result?.ok) throw new Error(result.error ?? 'Failed to register media')
  return result.media
}

export async function listAdminProducts(options?: { limit?: number; offset?: number; search?: string }) {
  const supabase = getClient()
  const { data, error } = await supabase.rpc('rpc_list_admin_products', {
    p_limit: options?.limit ?? 20,
    p_offset: options?.offset ?? 0,
    p_search: options?.search ?? null,
  })
  if (error) throw new Error(error.message)
  const result = data as RpcOk<{ items: Database['public']['Tables']['products']['Row'][]; total: number }> | RpcErr
  if (!result?.ok) throw new Error(result.error ?? 'Failed to load products')
  return { items: result.items ?? [], total: Number(result.total ?? 0) }
}

export async function listAdminOrders(options?: { limit?: number; offset?: number; search?: string }) {
  const supabase = getClient()
  const { data, error } = await supabase.rpc('rpc_list_admin_orders', {
    p_limit: options?.limit ?? 20,
    p_offset: options?.offset ?? 0,
    p_search: options?.search ?? null,
  })
  if (error) throw new Error(error.message)
  const result = data as RpcOk<{ items: Database['public']['Tables']['orders']['Row'][]; total: number }> | RpcErr
  if (!result?.ok) throw new Error(result.error ?? 'Failed to load orders')
  return { items: result.items ?? [], total: Number(result.total ?? 0) }
}
