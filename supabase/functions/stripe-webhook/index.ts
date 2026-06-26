import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno'
import {
  buildOrderItemsHtml,
  formatMoney,
  loadEmailBrand,
  sendTemplateEmail,
} from '../_shared/emailTemplates.ts'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: secretRow } = await supabase.from('private_settings').select('value').eq('key', 'stripe_secret_key').maybeSingle()
    const { data: webhookRow } = await supabase.from('private_settings').select('value').eq('key', 'stripe_webhook_secret').maybeSingle()

    if (!secretRow?.value || !webhookRow?.value) {
      return new Response('Stripe not configured', { status: 400 })
    }

    const stripe = new Stripe(secretRow.value, { apiVersion: '2024-11-20.acacia' })
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response('Missing signature', { status: 400 })
    }

    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookRow.value)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const orderId = session.metadata?.order_id

      if (orderId) {
        await supabase
          .from('orders')
          .update({
            status: 'paid',
            stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)

        await supabase.rpc('rpc_fulfill_order_inventory', { p_order_id: orderId })
        await supabase.rpc('rpc_release_inventory_for_order', { p_order_id: orderId })
        await supabase.rpc('rpc_redeem_coupon_for_order', { p_order_id: orderId })
        await supabase.rpc('rpc_notify_stock_alerts')

        const { data: order } = await supabase
          .from('orders')
          .select('id, order_number, email, total, subtotal, currency, created_at')
          .eq('id', orderId)
          .maybeSingle()

        if (order?.email) {
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

          await sendTemplateEmail(supabase, 'order_confirmation', order.email, {
            order_number: order.order_number,
            customer_name: order.email.split('@')[0] ?? 'Customer',
            customer_email: order.email,
            order_total: formatMoney(Number(order.total), currency),
            order_subtotal: formatMoney(Number(order.subtotal), currency),
            order_date: new Date(order.created_at).toLocaleDateString('en-US', { dateStyle: 'long' }),
            order_items_html: itemsHtml,
            account_url: `${brand.storeUrl}/account`,
            store_url: brand.storeUrl,
          })
        }
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session
      const orderId = session.metadata?.order_id
      if (orderId) {
        await supabase.rpc('rpc_release_inventory_for_order', { p_order_id: orderId })
        await supabase
          .from('orders')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', orderId)
          .eq('status', 'pending')
      }
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge
      const paymentIntent = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
      if (paymentIntent) {
        await supabase
          .from('orders')
          .update({ status: 'refunded', updated_at: new Date().toISOString() })
          .eq('stripe_payment_intent_id', paymentIntent)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: String(e) }), { status: 400 })
  }
})
