-- Product catalog extensions (SKU, weight, sale price, specs) + order fulfillment workflow

-- ── Products ────────────────────────────────────────────────────────────────
alter table public.products
  add column if not exists sku text,
  add column if not exists weight_kg numeric(10,3),
  add column if not exists compare_at_price numeric(10,2),
  add column if not exists specs jsonb not null default '[]'::jsonb;

create unique index if not exists products_sku_unique_idx
  on public.products (lower(trim(sku)))
  where sku is not null and btrim(sku) <> '';

comment on column public.products.sku is 'Stock keeping unit for warehouse and supplier reference';
comment on column public.products.weight_kg is 'Product weight in kilograms for shipping rate calculation';
comment on column public.products.compare_at_price is 'Original/list price shown as strikethrough when on sale';
comment on column public.products.specs is 'Array of {key, value} specification pairs';

-- ── Orders fulfillment ───────────────────────────────────────────────────────
alter table public.orders
  add column if not exists fulfillment_status text not null default 'unfulfilled',
  add column if not exists tracking_number text,
  add column if not exists carrier text,
  add column if not exists shipped_at timestamptz;

comment on column public.orders.fulfillment_status is 'unfulfilled | processing | shipped | delivered';
comment on column public.orders.tracking_number is 'Carrier tracking number';
comment on column public.orders.carrier is 'Shipping carrier name (USPS, UPS, FedEx, etc.)';
comment on column public.orders.shipped_at is 'Timestamp when order was marked shipped';

-- ── Admin inventory fulfillment (quote → paid conversion) ───────────────────
create or replace function public.rpc_admin_fulfill_order_inventory(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'Forbidden');
  end if;
  return public.rpc_fulfill_order_inventory(p_order_id);
end;
$$;

revoke all on function public.rpc_admin_fulfill_order_inventory(uuid) from public;
grant execute on function public.rpc_admin_fulfill_order_inventory(uuid) to authenticated;

-- ── Shipped notification email template ───────────────────────────────────────
insert into public.email_templates (template_key, name, description, subject, body_html) values
(
  'order_shipped',
  'Order shipped',
  'Sent to the customer when an order is marked as shipped with tracking info.',
  'Your order {{order_number}} has shipped!',
  '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3d3428;">Hi {{customer_name}},</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3d3428;">Great news — your order is on its way!</p>
<h2 style="margin:24px 0 12px;font-size:18px;color:#3d3428;">Shipping details</h2>
<p style="margin:0 0 8px;font-size:14px;color:#6b5d4d;"><strong>Carrier:</strong> {{carrier}}</p>
<p style="margin:0 0 8px;font-size:14px;color:#6b5d4d;"><strong>Tracking number:</strong> {{tracking_number}}</p>
<p style="margin:0 0 8px;font-size:14px;color:#6b5d4d;"><strong>Shipped on:</strong> {{shipped_date}}</p>
<h2 style="margin:24px 0 12px;font-size:18px;color:#3d3428;">Order summary</h2>
{{order_items_html}}
<p style="margin:16px 0 0;font-size:16px;font-weight:700;color:#3d3428;">Total: {{order_total}}</p>
<p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#6b5d4d;">Order reference: <strong>{{order_number}}</strong></p>
<p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#6b5d4d;">Track your order or view details in <a href="{{account_url}}" style="color:#5c4a32;font-weight:600;">your account</a>.</p>'
)
on conflict (template_key) do nothing;
