/** Read-only checkout status for success page. Fulfillment is handled by stripe-webhook only. */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno'

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

    const { session_id } = await req.json()
    if (!session_id || typeof session_id !== 'string') {
      return new Response(JSON.stringify({ ok: false, error: 'session_id required' }), { status: 400, headers: corsHeaders })
    }

    const { data: secretRow } = await supabase.from('private_settings').select('value').eq('key', 'stripe_secret_key').maybeSingle()
    if (!secretRow?.value) {
      return new Response(JSON.stringify({ ok: false, error: 'Stripe not configured' }), { status: 400, headers: corsHeaders })
    }

    const stripe = new Stripe(secretRow.value, { apiVersion: '2024-11-20.acacia' })
    const session = await stripe.checkout.sessions.retrieve(session_id)

    const orderId = session.metadata?.order_id
    if (!orderId) {
      return new Response(JSON.stringify({ ok: false, error: 'Order not found for session' }), { status: 404, headers: corsHeaders })
    }

    const { data: order } = await supabase
      .from('orders')
      .select('id, order_number, status, total, currency, email')
      .eq('id', orderId)
      .maybeSingle()

    const paid = session.payment_status === 'paid' || order?.status === 'paid'

    return new Response(
      JSON.stringify({
        ok: paid,
        payment_status: session.payment_status,
        order,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: corsHeaders })
  }
})
