-- Branded, editable email templates for transactional mail (Resend).

-- Branding keys in site_settings
insert into public.site_settings (key, value) values
  ('email_brand_color', '#5c4a32'),
  ('email_footer_text', 'Thank you for shopping with us.'),
  ('email_from_name', 'Astor Electronics'),
  ('store_url', '')
on conflict (key) do nothing;

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text unique not null,
  name text not null,
  description text not null default '',
  subject text not null,
  body_html text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.email_templates enable row level security;

create policy "admin_all_email_templates" on public.email_templates
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Default templates (inner body only — layout wrapper applied at send time)
insert into public.email_templates (template_key, name, description, subject, body_html) values
(
  'order_confirmation',
  'Order confirmation',
  'Sent to the customer when a Stripe payment succeeds.',
  'Your order {{order_number}} is confirmed',
  '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3d3428;">Hi {{customer_name}},</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3d3428;">Thank you for your order! We have received your payment and are preparing your items.</p>
<h2 style="margin:24px 0 12px;font-size:18px;color:#3d3428;">Order summary</h2>
{{order_items_html}}
<p style="margin:16px 0 0;font-size:16px;font-weight:700;color:#3d3428;">Total: {{order_total}}</p>
<p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#6b5d4d;">Order reference: <strong>{{order_number}}</strong><br/>Placed on {{order_date}}</p>
<p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#6b5d4d;">View your order in <a href="{{account_url}}" style="color:#5c4a32;font-weight:600;">your account</a>.</p>'
),
(
  'quote_request_admin',
  'Quote request (admin)',
  'Sent to your team when a customer submits a quote request.',
  'New quote request {{order_number}} from {{customer_email}}',
  '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3d3428;">A customer has submitted a new quote request.</p>
<p style="margin:0 0 8px;font-size:14px;color:#6b5d4d;"><strong>Customer:</strong> {{customer_name}} ({{customer_email}})</p>
<p style="margin:0 0 8px;font-size:14px;color:#6b5d4d;"><strong>Reference:</strong> {{order_number}}</p>
{{notes_block}}
<h2 style="margin:24px 0 12px;font-size:18px;color:#3d3428;">Requested items</h2>
{{order_items_html}}
<p style="margin:16px 0 0;font-size:16px;font-weight:700;color:#3d3428;">Estimated total: {{order_total}}</p>
<p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#6b5d4d;">Reply to the customer to discuss pricing and availability.</p>'
),
(
  'quote_request_customer',
  'Quote request (customer)',
  'Sent to the customer confirming their quote request was received.',
  'We received your quote request {{order_number}}',
  '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3d3428;">Hi {{customer_name}},</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3d3428;">Thanks for reaching out! We have received your quote request and our team will review your cart shortly.</p>
<h2 style="margin:24px 0 12px;font-size:18px;color:#3d3428;">Your request</h2>
{{order_items_html}}
<p style="margin:16px 0 0;font-size:16px;font-weight:700;color:#3d3428;">Estimated total: {{order_total}}</p>
<p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#6b5d4d;">Reference: <strong>{{order_number}}</strong></p>
<p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#6b5d4d;">We will contact you at <strong>{{customer_email}}</strong> with pricing and availability.</p>'
)
on conflict (template_key) do nothing;

grant select, insert, update, delete on public.email_templates to authenticated;
