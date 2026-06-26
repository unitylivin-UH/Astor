import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  buildOrderItemsHtml,
  formatMoney,
  loadEmailBrand,
  sendTemplateEmail,
} from '../_shared/emailTemplates.ts'

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

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: sessionData } = await userClient.rpc('rpc_get_admin_session')
    if (!sessionData?.ok || !sessionData.is_admin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })
    }

    const body = await req.json()
    const orderId = String(body.order_id ?? '').trim()
    const carrier = String(body.carrier ?? '').trim()
    const trackingNumber = String(body.tracking_number ?? '').trim()
    const notifyCustomer = body.notify_customer !== false

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'order_id is required' }), { status: 400, headers: corsHeaders })
    }
    if (!carrier) {
      return new Response(JSON.stringify({ error: 'carrier is required' }), { status: 400, headers: corsHeaders })
    }
    if (!trackingNumber) {
      return new Response(JSON.stringify({ error: 'tracking_number is required' }), { status: 400, headers: corsHeaders })
    }

    const shippedAt = new Date().toISOString()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({
        fulfillment_status: 'shipped',
        carrier,
        tracking_number: trackingNumber,
        shipped_at: shippedAt,
        updated_at: shippedAt,
      })
      .eq('id', orderId)
      .select('id, order_number, email, total, subtotal, currency, created_at')
      .maybeSingle()

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: orderError?.message ?? 'Order not found' }), { status: 404, headers: corsHeaders })
    }

    let emailSent = false
    let emailNote: string | undefined

    if (notifyCustomer && order.email) {
      const { data: lineItems } = await supabase
        .from('order_items')
        .select('product_name, quantity, unit_price, line_total, image_url')
        .eq('order_id', orderId)

      const brand = await loadEmailBrand(supabase)
      const currency = String(order.currency ?? 'USD')
      const itemsHtml = buildOrderItemsHtml(
        (lineItems ?? []).map((row) => ({
          name: row.product_name,
          quantity: row.quantity,
          unit_price: Number(row.unit_price),
          line_total: Number(row.line_total),
          image_url: row.image_url,
        })),
        currency,
      )

      const emailResult = await sendTemplateEmail(supabase, 'order_shipped', order.email, {
        order_number: order.order_number,
        customer_name: order.email.split('@')[0] ?? 'Customer',
        customer_email: order.email,
        order_total: formatMoney(Number(order.total), currency),
        order_subtotal: formatMoney(Number(order.subtotal), currency),
        order_date: new Date(order.created_at).toLocaleDateString('en-US', { dateStyle: 'long' }),
        order_items_html: itemsHtml,
        carrier,
        tracking_number: trackingNumber,
        shipped_date: new Date(shippedAt).toLocaleDateString('en-US', { dateStyle: 'long' }),
        account_url: `${brand.storeUrl}/account`,
        store_url: brand.storeUrl,
      })

      emailSent = emailResult.sent
      emailNote = emailResult.sent ? undefined : emailResult.reason
    }

    return new Response(
      JSON.stringify({ ok: true, email_sent: emailSent, email_note: emailNote }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders })
  }
})
