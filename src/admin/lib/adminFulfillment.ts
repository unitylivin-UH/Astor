import { tryGetSupabase } from '@/integrations/supabase/client'

async function getAuthToken(): Promise<string | null> {
  const supabase = tryGetSupabase()
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}
export async function invokeAdminFunction<T>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const token = await getAuthToken()
  if (!token) return { ok: false, error: 'You must be signed in' }

  const baseUrl = import.meta.env.VITE_SUPABASE_URL
  if (!baseUrl) return { ok: false, error: 'Supabase is not configured' }

  const res = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = (await res.json()) as T & { error?: string }
  if (!res.ok) {
    return { ok: false, error: data.error ?? `Request failed (${res.status})` }
  }
  return { ok: true, data }
}

export async function fulfillOrderInventory(orderId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = tryGetSupabase()
  if (!supabase) return { ok: false, error: 'Supabase is not configured' }

  const { data, error } = await supabase.rpc('rpc_admin_fulfill_order_inventory', { p_order_id: orderId })
  if (error) return { ok: false, error: error.message }
  const result = data as { ok?: boolean; error?: string; skipped?: boolean }
  if (!result?.ok) return { ok: false, error: result.error ?? 'Inventory fulfillment failed' }
  return { ok: true }
}

export type MarkOrderShippedPayload = {
  order_id: string
  carrier: string
  tracking_number: string
  notify_customer?: boolean
}

export type MarkOrderShippedResult = {
  ok: boolean
  email_sent?: boolean
  email_note?: string
}

export async function markOrderShipped(payload: MarkOrderShippedPayload) {
  return invokeAdminFunction<MarkOrderShippedResult>('mark-order-shipped', payload)
}
