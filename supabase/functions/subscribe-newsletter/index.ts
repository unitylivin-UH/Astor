import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { clientIp, corsHeaders, enforceRateLimit } from '../_shared/checkoutGuard.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const body = await req.json()
    const email = String(body.email ?? '').trim()
    const source = String(body.source ?? 'homepage_footer').trim()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), { status: 400, headers: corsHeaders })
    }

    const ipRate = await enforceRateLimit(supabase, 'newsletter_subscribe_ip', clientIp(req), 10, 3600)
    if (!ipRate.ok) {
      return new Response(JSON.stringify({ error: ipRate.error }), { status: 429, headers: corsHeaders })
    }

    const { data, error } = await supabase.rpc('rpc_subscribe_newsletter', {
      p_email: email,
      p_source: source,
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
    }

    const result = data as { ok?: boolean; error?: string }
    if (!result?.ok) {
      return new Response(JSON.stringify({ error: result?.error ?? 'Subscription failed' }), { status: 400, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders })
  }
})
