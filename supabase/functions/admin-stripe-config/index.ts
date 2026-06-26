import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const jwt = authHeader.replace('Bearer ', '')
    const { data: userData, error: userError } = await supabase.auth.getUser(jwt)
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: corsHeaders })
    }

    const { data: admin } = await supabase
      .from('admin_users')
      .select('role, is_active')
      .eq('auth_user_id', userData.user.id)
      .maybeSingle()

    if (!admin?.is_active || !['owner', 'admin'].includes(admin.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })
    }

    const { secret_key, webhook_secret } = await req.json()
    if (secret_key) {
      if (!secret_key.startsWith('sk_')) {
        return new Response(JSON.stringify({ error: 'Invalid secret key format' }), { status: 400, headers: corsHeaders })
      }
      await supabase.from('private_settings').upsert({
        key: 'stripe_secret_key',
        value: secret_key,
        updated_at: new Date().toISOString(),
      })
    }

    if (webhook_secret) {
      if (!webhook_secret.startsWith('whsec_')) {
        return new Response(JSON.stringify({ error: 'Invalid webhook secret format' }), { status: 400, headers: corsHeaders })
      }
      await supabase.from('private_settings').upsert({
        key: 'stripe_webhook_secret',
        value: webhook_secret,
        updated_at: new Date().toISOString(),
      })
    }

    if (!secret_key && !webhook_secret) {
      return new Response(JSON.stringify({ error: 'Nothing to save' }), { status: 400, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders })
  }
})
