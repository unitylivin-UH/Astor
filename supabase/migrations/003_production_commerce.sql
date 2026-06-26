-- Production commerce: orders, marketing pages, private integration settings

create table if not exists public.marketing_pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  body_html text,
  meta_description text,
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  currency text not null default 'USD',
  subtotal numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  stripe_session_id text,
  stripe_payment_intent_id text,
  shipping_address jsonb default '{}'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_slug text,
  image_url text,
  unit_price numeric(10,2) not null,
  quantity int not null default 1,
  line_total numeric(10,2) not null,
  created_at timestamptz not null default now()
);

-- Server-only secrets (no RLS policies = denied to anon/authenticated via API)
create table if not exists public.private_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

revoke all on public.private_settings from anon, authenticated;

alter table public.marketing_pages enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "public_read_marketing_pages" on public.marketing_pages
  for select to anon, authenticated using (published = true);

create policy "admin_all_marketing_pages" on public.marketing_pages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin_read_orders" on public.orders
  for select to authenticated using (public.is_admin());

create policy "admin_update_orders" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin_read_order_items" on public.order_items
  for select to authenticated using (public.is_admin());

-- Cart totals RPC (currency from site_settings)
create or replace function public.rpc_get_cart_totals(p_items jsonb, p_currency text default null)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_currency text;
  v_subtotal numeric(10,2) := 0;
  v_item jsonb;
  v_product record;
  v_qty int;
  v_line numeric(10,2);
  v_items_out jsonb := '[]'::jsonb;
begin
  select coalesce(p_currency, (select value from public.site_settings where key = 'currency_code' limit 1), 'USD')
  into v_currency;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    v_qty := greatest(1, (v_item->>'quantity')::int);
    select * into v_product from public.products p
    where p.id = (v_item->>'product_id')::uuid and p.published = true;

    if v_product.id is null then
      return jsonb_build_object('ok', false, 'error', 'Product unavailable: ' || coalesce(v_item->>'product_id', ''));
    end if;

    if v_product.inventory_count < v_qty then
      return jsonb_build_object('ok', false, 'error', v_product.name || ' has only ' || v_product.inventory_count || ' in stock');
    end if;

    v_line := v_product.price * v_qty;
    v_subtotal := v_subtotal + v_line;
    v_items_out := v_items_out || jsonb_build_object(
      'product_id', v_product.id,
      'name', v_product.name,
      'slug', v_product.slug,
      'image_url', v_product.image_url,
      'unit_price', v_product.price,
      'quantity', v_qty,
      'line_total', v_line
    );
  end loop;

  return jsonb_build_object(
    'ok', true,
    'currency', v_currency,
    'subtotal', v_subtotal,
    'total', v_subtotal,
    'items', v_items_out
  );
end;
$$;

grant execute on function public.rpc_get_cart_totals(jsonb, text) to anon, authenticated;

-- Default site settings for commerce
insert into public.site_settings (key, value) values
  ('currency_code', 'USD'),
  ('currency_locale', 'en-US'),
  ('stripe_enabled', 'false'),
  ('stripe_publishable_key', ''),
  ('stripe_mode', 'test'),
  ('store_name', 'Astor')
on conflict (key) do nothing;

-- Default marketing pages for footer links
insert into public.marketing_pages (title, slug, body_html, published, sort_order) values
  ('Privacy Policy', 'privacy', '<p>Your privacy matters. We collect only what is needed to fulfill orders and improve your experience.</p>', true, 0),
  ('Terms of Service', 'terms', '<p>By shopping with Astor you agree to our standard terms of sale and returns policy.</p>', true, 1),
  ('Contact Us', 'contact', '<p>Email us at hello@astor.example for order support and sizing help.</p>', true, 2),
  ('Shipping Information', 'shipping', '<p>Standard shipping 3–5 business days. Express options at checkout where available.</p>', true, 3)
on conflict (slug) do nothing;
