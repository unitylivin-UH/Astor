import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  buildNotesBlock,
  buildOrderItemsHtml,
  formatMoney,
  loadEmailBrand,
  loadEmailTemplate,
  renderBrandedEmail,
  sendBrandedEmail,
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
    const templateKey = String(body.template_key ?? '').trim()
    const to = String(body.to ?? '').trim()

    if (!templateKey || !to) {
      return new Response(JSON.stringify({ error: 'template_key and to are required' }), { status: 400, headers: corsHeaders })
    }

    const brand = await loadEmailBrand(supabase)
    const template = await loadEmailTemplate(supabase, templateKey)
    if (!template) {
      return new Response(JSON.stringify({ error: 'Template not found' }), { status: 404, headers: corsHeaders })
    }

    const sampleItems = buildOrderItemsHtml(
      [
        { name: 'Corsair RM850x PSU', quantity: 1, unit_price: 129.99, line_total: 129.99 },
        { name: 'AMD Ryzen 7 7800X3D', quantity: 1, unit_price: 449.99, line_total: 449.99 },
      ],
      'USD',
    )

    const vars = {
      order_number: 'AST-TEST-001',
      customer_name: 'Sample Customer',
      customer_email: to,
      order_total: formatMoney(579.98, 'USD'),
      order_subtotal: formatMoney(579.98, 'USD'),
      order_date: new Date().toLocaleDateString('en-US', { dateStyle: 'long' }),
      order_items_html: sampleItems,
      notes_block: buildNotesBlock('Sample customer note for preview.'),
      carrier: 'UPS',
      tracking_number: '1Z999AA10123456784',
      shipped_date: new Date().toLocaleDateString('en-US', { dateStyle: 'long' }),
      account_url: `${brand.storeUrl}/account`,
      store_url: brand.storeUrl,
    }

    const rendered = renderBrandedEmail(
      brand,
      { subject: `[TEST] ${template.subject}`, bodyHtml: template.body_html },
      vars,
    )

    const result = await sendBrandedEmail({
      to,
      brand,
      subject: rendered.subject,
      html: rendered.html,
    })

    if (!result.sent) {
      return new Response(JSON.stringify({ error: result.reason ?? 'Send failed' }), { status: 500, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders })
  }
})
