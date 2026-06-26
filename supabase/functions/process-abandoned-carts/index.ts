import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/checkoutGuard.ts'
import { formatMoney, loadEmailBrand, sendTemplateEmail } from '../_shared/emailTemplates.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: hoursRow } = await supabase.from('site_settings').select('value').eq('key', 'abandoned_cart_hours').maybeSingle()
    const hours = Number(hoursRow?.value ?? 24)
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    const { data: carts, error } = await supabase
      .from('storefront_carts')
      .select('id, email, items, last_activity_at')
      .is('abandoned_email_sent_at', null)
      .not('email', 'is', null)
      .lt('last_activity_at', cutoff)
      .limit(25)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
    }

    const brand = await loadEmailBrand(supabase)
    let sent = 0

    for (const cart of carts ?? []) {
      const email = String(cart.email ?? '').trim()
      const items = Array.isArray(cart.items) ? cart.items : []
      if (!email || items.length === 0) continue

      const result = await sendTemplateEmail(supabase, 'abandoned_cart', email, {
        customer_name: email.split('@')[0] ?? 'Customer',
        cart_url: `${brand.storeUrl}/cart`,
        store_url: brand.storeUrl,
        item_count: String(items.length),
      })

      if (result.sent) {
        await supabase.from('storefront_carts').update({ abandoned_email_sent_at: new Date().toISOString() }).eq('id', cart.id)
        sent += 1
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: carts?.length ?? 0, sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders })
  }
})
