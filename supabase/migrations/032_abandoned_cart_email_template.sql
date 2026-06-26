insert into public.email_templates (template_key, name, description, subject, body_html, enabled)
values (
  'abandoned_cart',
  'Abandoned cart reminder',
  'Sent when a shopper leaves items in their cart',
  'You left something behind at {{store_name}}',
  '<p>Hi {{customer_name}},</p><p>You still have {{item_count}} item(s) in your cart. <a href="{{cart_url}}">Complete your order</a> before they sell out.</p><p><a href="{{store_url}}">{{store_url}}</a></p>',
  true
)
on conflict (template_key) do update set
  name = excluded.name,
  description = excluded.description,
  subject = excluded.subject,
  body_html = excluded.body_html,
  enabled = excluded.enabled,
  updated_at = now();
