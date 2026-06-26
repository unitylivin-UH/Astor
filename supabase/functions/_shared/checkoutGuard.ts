const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type SupabaseClient = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
}

export function clientIp(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('cf-connecting-ip')
    ?? 'unknown'
}

export async function enforceRateLimit(
  supabase: SupabaseClient,
  action: string,
  identifier: string,
  maxRequests = 8,
  windowSeconds = 3600,
) {
  const { data, error } = await supabase.rpc('rpc_check_rate_limit', {
    p_action: action,
    p_identifier: identifier,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  })
  if (error) return { ok: false, error: error.message }
  const result = data as { ok?: boolean; error?: string }
  if (!result?.ok) return { ok: false, error: result.error ?? 'Rate limit exceeded' }
  return { ok: true }
}

export function validateCheckoutPayload(body: Record<string, unknown>) {
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const items = Array.isArray(body.items) ? body.items : []
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false as const, error: 'Valid email is required' }
  }
  if (items.length === 0 || items.length > 50) {
    return { ok: false as const, error: 'Cart must contain 1–50 items' }
  }
  return { ok: true as const, email, items }
}

export type ShippingAddress = {
  line1: string
  line2?: string
  city: string
  state?: string
  postal_code: string
  country: string
}

export function parseShippingAddress(body: Record<string, unknown>, required = false) {
  const raw = body.shipping_address
  if (raw == null || raw === '') {
    if (required) return { ok: false as const, error: 'Shipping address is required' }
    return { ok: true as const, shipping_address: null as ShippingAddress | null }
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false as const, error: 'Invalid shipping address' }
  }
  const record = raw as Record<string, unknown>
  const line1 = String(record.line1 ?? '').trim()
  const city = String(record.city ?? '').trim()
  const postal_code = String(record.postal_code ?? '').trim()
  const country = String(record.country ?? '').trim()
  if (!line1 || !city || !postal_code || !country) {
    return { ok: false as const, error: 'Shipping address requires street, city, postal code, and country' }
  }
  return {
    ok: true as const,
    shipping_address: {
      line1,
      line2: String(record.line2 ?? '').trim() || undefined,
      city,
      state: String(record.state ?? '').trim() || undefined,
      postal_code,
      country,
    } satisfies ShippingAddress,
  }
}

export async function resolveUserIdFromRequest(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export { corsHeaders }
