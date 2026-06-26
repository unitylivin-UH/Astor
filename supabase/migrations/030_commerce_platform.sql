-- Commerce platform: shipping, tax, coupons, inventory reservations, server carts, stock alerts

-- Shipping zones
create table if not exists public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  countries jsonb not null default '[]'::jsonb,
  flat_rate numeric(10,2) not null default 0 check (flat_rate >= 0),
  free_shipping_threshold numeric(10,2),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shipping_zones enable row level security;
drop policy if exists "public_read_shipping_zones" on public.shipping_zones;
create policy "public_read_shipping_zones" on public.shipping_zones
  for select to anon, authenticated using (is_active = true);
drop policy if exists "admin_all_shipping_zones" on public.shipping_zones;
create policy "admin_all_shipping_zones" on public.shipping_zones
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.shipping_zones to anon, authenticated;
grant all on public.shipping_zones to authenticated;

-- Coupons
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  description text,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric(10,2) not null check (discount_value >= 0),
  min_subtotal numeric(10,2) not null default 0,
  max_uses int,
  used_count int not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  order_id uuid references public.orders(id) on delete set null,
  email text,
  redeemed_at timestamptz not null default now()
);

alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
drop policy if exists "admin_all_coupons" on public.coupons;
create policy "admin_all_coupons" on public.coupons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin_read_coupon_redemptions" on public.coupon_redemptions;
create policy "admin_read_coupon_redemptions" on public.coupon_redemptions
  for select to authenticated using (public.is_admin());
grant all on public.coupons to authenticated;
grant select on public.coupon_redemptions to authenticated;

-- Inventory reservations (hold stock during pending checkout)
create table if not exists public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  quantity int not null check (quantity > 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists inventory_reservations_order_id_idx on public.inventory_reservations(order_id);
create index if not exists inventory_reservations_product_variant_idx on public.inventory_reservations(product_id, variant_id);
create index if not exists inventory_reservations_expires_at_idx on public.inventory_reservations(expires_at);

alter table public.inventory_reservations enable row level security;
drop policy if exists "service_inventory_reservations" on public.inventory_reservations;
create policy "service_inventory_reservations" on public.inventory_reservations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Server-side carts (abandoned cart recovery)
create table if not exists public.storefront_carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id text,
  email text,
  items jsonb not null default '[]'::jsonb,
  coupon_code text,
  last_activity_at timestamptz not null default now(),
  abandoned_email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint storefront_carts_owner_chk check (user_id is not null or session_id is not null)
);

create unique index if not exists storefront_carts_user_id_uidx on public.storefront_carts(user_id) where user_id is not null;
create unique index if not exists storefront_carts_session_id_uidx on public.storefront_carts(session_id) where session_id is not null;
create index if not exists storefront_carts_abandoned_idx on public.storefront_carts(last_activity_at) where abandoned_email_sent_at is null;

alter table public.storefront_carts enable row level security;
drop policy if exists "owner_storefront_carts" on public.storefront_carts;
create policy "owner_storefront_carts" on public.storefront_carts
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
drop policy if exists "anon_session_storefront_carts" on public.storefront_carts;
create policy "anon_session_storefront_carts" on public.storefront_carts
  for all to anon
  using (session_id is not null and user_id is null)
  with check (session_id is not null and user_id is null);

grant select, insert, update, delete on public.storefront_carts to anon, authenticated;

-- Back-in-stock alerts
create table if not exists public.stock_alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(email, product_id, variant_id)
);

alter table public.stock_alert_subscriptions enable row level security;
drop policy if exists "public_insert_stock_alerts" on public.stock_alert_subscriptions;
create policy "public_insert_stock_alerts" on public.stock_alert_subscriptions
  for insert to anon, authenticated with check (true);
drop policy if exists "admin_all_stock_alerts" on public.stock_alert_subscriptions;
create policy "admin_all_stock_alerts" on public.stock_alert_subscriptions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant insert, select on public.stock_alert_subscriptions to anon, authenticated;
grant all on public.stock_alert_subscriptions to authenticated;

-- Orders: shipping + tax + coupon metadata
alter table public.orders
  add column if not exists shipping_total numeric(10,2) not null default 0,
  add column if not exists tax_total numeric(10,2) not null default 0,
  add column if not exists discount_total numeric(10,2) not null default 0,
  add column if not exists coupon_code text;

-- Site settings defaults
insert into public.site_settings (key, value) values
  ('tax_rate_percent', '0'),
  ('default_flat_shipping_rate', '9.99'),
  ('free_shipping_threshold', '150'),
  ('gtm_container_id', ''),
  ('low_stock_threshold', '5'),
  ('abandoned_cart_hours', '24')
on conflict (key) do nothing;

-- Default shipping zone
insert into public.shipping_zones (id, name, countries, flat_rate, free_shipping_threshold, is_active, sort_order)
values (
  'dddddddd-dddd-dddd-dddd-dddddddddd99',
  'Standard Shipping',
  '[]'::jsonb,
  9.99,
  150,
  true,
  0
) on conflict (id) do nothing;

-- Reserved quantity helper (active, non-expired)
create or replace function public.reserved_inventory_quantity(
  p_product_id uuid,
  p_variant_id uuid default null,
  p_exclude_order_id uuid default null
)
returns int
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(sum(r.quantity), 0)::int
  from public.inventory_reservations r
  where r.expires_at > now()
    and (p_exclude_order_id is null or r.order_id <> p_exclude_order_id)
    and r.product_id = p_product_id
    and (
      (p_variant_id is null and r.variant_id is null)
      or r.variant_id = p_variant_id
    );
$$;

grant execute on function public.reserved_inventory_quantity(uuid, uuid, uuid) to anon, authenticated;

-- Resolve shipping for country
create or replace function public.resolve_shipping_rate(
  p_country text,
  p_subtotal numeric
)
returns numeric
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_zone record;
  v_country text := upper(coalesce(nullif(trim(p_country), ''), 'DEFAULT'));
  v_default_rate numeric;
  v_free_threshold numeric;
begin
  select coalesce((select value::numeric from public.site_settings where key = 'default_flat_shipping_rate' limit 1), 9.99)
  into v_default_rate;
  select nullif((select value from public.site_settings where key = 'free_shipping_threshold' limit 1), '')::numeric
  into v_free_threshold;

  for v_zone in
    select * from public.shipping_zones where is_active = true order by sort_order, name
  loop
    if jsonb_array_length(v_zone.countries) = 0 then
      if coalesce(v_zone.free_shipping_threshold, v_free_threshold) is not null
         and p_subtotal >= coalesce(v_zone.free_shipping_threshold, v_free_threshold) then
        return 0;
      end if;
      return v_zone.flat_rate;
    end if;
    if exists (
      select 1 from jsonb_array_elements_text(v_zone.countries) c
      where upper(c.value) = v_country
    ) then
      if v_zone.free_shipping_threshold is not null and p_subtotal >= v_zone.free_shipping_threshold then
        return 0;
      end if;
      return v_zone.flat_rate;
    end if;
  end loop;

  if v_free_threshold is not null and p_subtotal >= v_free_threshold then
    return 0;
  end if;
  return v_default_rate;
end;
$$;

grant execute on function public.resolve_shipping_rate(text, numeric) to anon, authenticated;

-- Validate coupon
create or replace function public.resolve_coupon_discount(
  p_code text,
  p_subtotal numeric
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_coupon record;
  v_discount numeric(10,2);
begin
  if nullif(trim(p_code), '') is null then
    return jsonb_build_object('ok', true, 'discount', 0, 'code', null);
  end if;

  select * into v_coupon from public.coupons
  where upper(code) = upper(trim(p_code)) and is_active = true;

  if v_coupon.id is null then
    return jsonb_build_object('ok', false, 'error', 'Invalid coupon code');
  end if;
  if v_coupon.starts_at is not null and v_coupon.starts_at > now() then
    return jsonb_build_object('ok', false, 'error', 'Coupon is not active yet');
  end if;
  if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
    return jsonb_build_object('ok', false, 'error', 'Coupon has expired');
  end if;
  if v_coupon.max_uses is not null and v_coupon.used_count >= v_coupon.max_uses then
    return jsonb_build_object('ok', false, 'error', 'Coupon usage limit reached');
  end if;
  if p_subtotal < v_coupon.min_subtotal then
    return jsonb_build_object('ok', false, 'error', 'Minimum order not met for this coupon');
  end if;

  if v_coupon.discount_type = 'percent' then
    v_discount := round(p_subtotal * least(100, v_coupon.discount_value) / 100, 2);
  else
    v_discount := least(p_subtotal, v_coupon.discount_value);
  end if;

  return jsonb_build_object(
    'ok', true,
    'discount', v_discount,
    'code', v_coupon.code,
    'coupon_id', v_coupon.id
  );
end;
$$;

grant execute on function public.resolve_coupon_discount(text, numeric) to anon, authenticated;

-- Release expired reservations
create or replace function public.rpc_release_expired_reservations()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  delete from public.inventory_reservations where expires_at <= now();
  get diagnostics v_count = row_count;
  return jsonb_build_object('ok', true, 'released', v_count);
end;
$$;

revoke all on function public.rpc_release_expired_reservations() from public;
grant execute on function public.rpc_release_expired_reservations() to service_role;

-- Reserve inventory from order lines
create or replace function public.rpc_reserve_inventory_for_order(
  p_order_id uuid,
  p_ttl_minutes int default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_line record;
  v_component jsonb;
  v_variant_id uuid;
  v_product_id uuid;
  v_qty int;
  v_inventory int;
  v_reserved int;
begin
  perform public.rpc_release_expired_reservations();

  delete from public.inventory_reservations where order_id = p_order_id;

  for v_line in select * from public.order_items where order_id = p_order_id
  loop
    if v_line.bundle_id is not null then
      for v_component in select * from jsonb_array_elements(coalesce(v_line.metadata->'components', '[]'::jsonb))
      loop
        v_product_id := nullif(v_component->>'product_id', '')::uuid;
        v_variant_id := nullif(v_component->>'variant_id', '')::uuid;
        v_qty := greatest(1, (v_component->>'quantity')::int);
        if v_product_id is null then continue; end if;

        if v_variant_id is not null then
          select inventory_count into v_inventory from public.product_variants where id = v_variant_id;
        else
          select inventory_count into v_inventory from public.products where id = v_product_id;
        end if;

        v_reserved := public.reserved_inventory_quantity(v_product_id, v_variant_id, p_order_id);
        if coalesce(v_inventory, 0) - v_reserved < v_qty then
          return jsonb_build_object('ok', false, 'error', 'Insufficient stock to reserve for bundle item');
        end if;

        insert into public.inventory_reservations (order_id, product_id, variant_id, quantity, expires_at)
        values (p_order_id, v_product_id, v_variant_id, v_qty, now() + make_interval(mins => greatest(5, p_ttl_minutes)));
      end loop;
    else
      v_product_id := v_line.product_id;
      v_variant_id := v_line.variant_id;
      v_qty := v_line.quantity;
      if v_product_id is null then continue; end if;

      if v_variant_id is not null then
        select inventory_count into v_inventory from public.product_variants where id = v_variant_id;
      else
        select inventory_count into v_inventory from public.products where id = v_product_id;
      end if;

      v_reserved := public.reserved_inventory_quantity(v_product_id, v_variant_id, p_order_id);
      if coalesce(v_inventory, 0) - v_reserved < v_qty then
        return jsonb_build_object('ok', false, 'error', 'Insufficient stock to reserve');
      end if;

      insert into public.inventory_reservations (order_id, product_id, variant_id, quantity, expires_at)
      values (p_order_id, v_product_id, v_variant_id, v_qty, now() + make_interval(mins => greatest(5, p_ttl_minutes)));
    end if;
  end loop;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.rpc_reserve_inventory_for_order(uuid, int) from public;
grant execute on function public.rpc_reserve_inventory_for_order(uuid, int) to service_role;

create or replace function public.rpc_release_inventory_for_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.inventory_reservations where order_id = p_order_id;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.rpc_release_inventory_for_order(uuid) from public;
grant execute on function public.rpc_release_inventory_for_order(uuid) to service_role;

-- Cart totals with shipping, tax, coupon (extends bundle-aware version)
create or replace function public.rpc_get_cart_totals(
  p_items jsonb,
  p_currency text default null,
  p_shipping_country text default null,
  p_coupon_code text default null
)
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
  v_variant record;
  v_bundle record;
  v_bundle_item record;
  v_qty int;
  v_line numeric(10,2);
  v_unit_price numeric(10,2);
  v_inventory int;
  v_reserved int;
  v_name text;
  v_image text;
  v_items_out jsonb := '[]'::jsonb;
  v_variant_id uuid;
  v_variant_name text;
  v_bundle_id uuid;
  v_selections jsonb;
  v_components jsonb;
  v_sel_variant uuid;
  v_available int;
  v_component jsonb;
  v_shipping numeric(10,2);
  v_tax_rate numeric(10,2);
  v_tax numeric(10,2);
  v_discount numeric(10,2) := 0;
  v_coupon jsonb;
  v_total numeric(10,2);
begin
  select coalesce(p_currency, (select value from public.site_settings where key = 'currency_code' limit 1), 'USD')
  into v_currency;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    v_qty := greatest(1, (v_item->>'quantity')::int);
    v_bundle_id := nullif(v_item->>'bundle_id', '')::uuid;

    if v_bundle_id is not null then
      v_selections := coalesce(v_item->'selections', '[]'::jsonb);
      select * into v_bundle from public.product_bundles b where b.id = v_bundle_id and b.published = true;
      if v_bundle.id is null then
        return jsonb_build_object('ok', false, 'error', 'Bundle unavailable');
      end if;

      v_available := public.bundle_available_quantity(v_bundle_id, v_selections);
      if v_available < v_qty then
        return jsonb_build_object('ok', false, 'error', v_bundle.name || ' has only ' || v_available || ' available in stock');
      end if;

      v_components := '[]'::jsonb;
      for v_bundle_item in select * from public.product_bundle_items where bundle_id = v_bundle_id order by sort_order
      loop
        select * into v_product from public.products p where p.id = v_bundle_item.product_id and p.published = true;
        if v_product.id is null then
          return jsonb_build_object('ok', false, 'error', 'A bundle item is unavailable');
        end if;

        v_sel_variant := public.resolve_bundle_item_variant(v_bundle_item.id, v_selections);
        v_variant_name := null;
        v_unit_price := v_product.price;
        v_inventory := v_product.inventory_count;
        v_name := coalesce(nullif(trim(v_bundle_item.label), ''), v_product.name);

        if v_sel_variant is not null then
          select * into v_variant from public.product_variants pv
          where pv.id = v_sel_variant and pv.product_id = v_product.id and pv.is_active = true;
          if v_variant.id is null then
            return jsonb_build_object('ok', false, 'error', 'Invalid variant for ' || v_product.name);
          end if;
          v_variant_name := v_variant.name;
          v_unit_price := coalesce(v_variant.price, v_product.price);
          v_inventory := v_variant.inventory_count;
          v_name := v_name || ' — ' || v_variant.name;
        elsif exists (select 1 from public.product_variants pv where pv.product_id = v_product.id and pv.is_active = true) then
          return jsonb_build_object('ok', false, 'error', v_product.name || ' requires a variant selection in this bundle');
        end if;

        v_reserved := public.reserved_inventory_quantity(v_product.id, v_sel_variant);
        if v_inventory - v_reserved < v_bundle_item.quantity * v_qty then
          return jsonb_build_object('ok', false, 'error', v_name || ' has insufficient stock for this bundle');
        end if;

        v_components := v_components || jsonb_build_object(
          'bundle_item_id', v_bundle_item.id,
          'product_id', v_product.id,
          'variant_id', v_sel_variant,
          'variant_name', v_variant_name,
          'name', v_name,
          'slug', v_product.slug,
          'quantity', v_bundle_item.quantity * v_qty,
          'unit_price', v_unit_price
        );
      end loop;

      v_line := v_bundle.price * v_qty;
      v_subtotal := v_subtotal + v_line;
      v_items_out := v_items_out || jsonb_build_object(
        'bundle_id', v_bundle.id,
        'product_id', null,
        'variant_id', null,
        'variant_name', null,
        'name', v_bundle.name,
        'slug', v_bundle.slug,
        'image_url', v_bundle.image_url,
        'unit_price', v_bundle.price,
        'quantity', v_qty,
        'line_total', v_line,
        'is_bundle', true,
        'components', v_components
      );
      continue;
    end if;

    v_variant_id := nullif(v_item->>'variant_id', '')::uuid;
    v_variant_name := null;
    select * into v_product from public.products p
    where p.id = (v_item->>'product_id')::uuid and p.published = true;
    if v_product.id is null then
      return jsonb_build_object('ok', false, 'error', 'Product unavailable');
    end if;

    v_unit_price := v_product.price;
    v_inventory := v_product.inventory_count;
    v_name := v_product.name;
    v_image := v_product.image_url;

    if v_variant_id is not null then
      select * into v_variant from public.product_variants pv
      where pv.id = v_variant_id and pv.product_id = v_product.id and pv.is_active = true;
      if v_variant.id is null then
        return jsonb_build_object('ok', false, 'error', 'Variant unavailable for ' || v_product.name);
      end if;
      v_unit_price := coalesce(v_variant.price, v_product.price);
      v_inventory := v_variant.inventory_count;
      v_variant_name := v_variant.name;
      v_name := v_product.name || ' — ' || v_variant.name;
      v_image := coalesce(v_variant.image_url, v_product.image_url);
    elsif exists (select 1 from public.product_variants pv where pv.product_id = v_product.id and pv.is_active = true) then
      return jsonb_build_object('ok', false, 'error', v_product.name || ' requires a variant selection');
    end if;

    v_reserved := public.reserved_inventory_quantity(v_product.id, v_variant_id);
    if v_inventory - v_reserved < v_qty then
      return jsonb_build_object('ok', false, 'error', v_name || ' has only ' || greatest(0, v_inventory - v_reserved) || ' in stock');
    end if;

    v_line := v_unit_price * v_qty;
    v_subtotal := v_subtotal + v_line;
    v_items_out := v_items_out || jsonb_build_object(
      'product_id', v_product.id,
      'variant_id', v_variant_id,
      'variant_name', v_variant_name,
      'name', v_name,
      'slug', v_product.slug,
      'image_url', v_image,
      'unit_price', v_unit_price,
      'quantity', v_qty,
      'line_total', v_line,
      'is_bundle', false
    );
  end loop;

  v_coupon := public.resolve_coupon_discount(p_coupon_code, v_subtotal);
  if not (v_coupon->>'ok')::boolean then
    return v_coupon;
  end if;
  v_discount := coalesce((v_coupon->>'discount')::numeric, 0);

  v_shipping := public.resolve_shipping_rate(p_shipping_country, v_subtotal - v_discount);
  select coalesce(nullif((select value from public.site_settings where key = 'tax_rate_percent' limit 1), '')::numeric, 0)
  into v_tax_rate;
  v_tax := round(greatest(0, v_subtotal - v_discount) * v_tax_rate / 100, 2);
  v_total := greatest(0, v_subtotal - v_discount) + v_shipping + v_tax;

  return jsonb_build_object(
    'ok', true,
    'currency', v_currency,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'coupon_code', v_coupon->>'code',
    'shipping', v_shipping,
    'tax', v_tax,
    'total', v_total,
    'items', v_items_out
  );
end;
$$;

grant execute on function public.rpc_get_cart_totals(jsonb, text, text, text) to anon, authenticated;

-- Sync server cart
create or replace function public.rpc_sync_storefront_cart(
  p_session_id text,
  p_items jsonb,
  p_email text default null,
  p_coupon_code text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_cart_id uuid;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is not null then
    insert into public.storefront_carts (user_id, session_id, email, items, coupon_code, last_activity_at, updated_at)
    values (v_user_id, p_session_id, p_email, coalesce(p_items, '[]'::jsonb), nullif(trim(p_coupon_code), ''), now(), now())
    on conflict (user_id) where user_id is not null do update set
      items = excluded.items,
      email = coalesce(excluded.email, storefront_carts.email),
      coupon_code = excluded.coupon_code,
      session_id = coalesce(excluded.session_id, storefront_carts.session_id),
      last_activity_at = now(),
      updated_at = now()
    returning id into v_cart_id;
  elsif nullif(trim(p_session_id), '') is not null then
    insert into public.storefront_carts (session_id, email, items, coupon_code, last_activity_at, updated_at)
    values (p_session_id, p_email, coalesce(p_items, '[]'::jsonb), nullif(trim(p_coupon_code), ''), now(), now())
    on conflict (session_id) where session_id is not null do update set
      items = excluded.items,
      email = coalesce(excluded.email, storefront_carts.email),
      coupon_code = excluded.coupon_code,
      last_activity_at = now(),
      updated_at = now()
    returning id into v_cart_id;
  else
    return jsonb_build_object('ok', false, 'error', 'session_id required for guest cart');
  end if;

  return jsonb_build_object('ok', true, 'cart_id', v_cart_id);
end;
$$;

grant execute on function public.rpc_sync_storefront_cart(text, jsonb, text, text) to anon, authenticated;

-- Stock alert subscribe
create or replace function public.rpc_subscribe_stock_alert(
  p_email text,
  p_product_id uuid,
  p_variant_id uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not p_email ~ '^[^@]+@[^@]+\.[^@]+$' then
    return jsonb_build_object('ok', false, 'error', 'Valid email required');
  end if;
  insert into public.stock_alert_subscriptions (email, product_id, variant_id)
  values (lower(trim(p_email)), p_product_id, p_variant_id)
  on conflict (email, product_id, variant_id) do nothing;
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.rpc_subscribe_stock_alert(text, uuid, uuid) to anon, authenticated;

-- Admin: list customers aggregated from orders
create or replace function public.rpc_list_admin_customers(
  p_limit int default 25,
  p_offset int default 0,
  p_search text default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_items jsonb;
  v_total int;
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'Forbidden');
  end if;

  with agg as (
    select
      lower(trim(email)) as email,
      max(user_id::text)::uuid as user_id,
      count(*)::int as order_count,
      coalesce(sum(total), 0)::numeric(10,2) as lifetime_value,
      max(created_at) as last_order_at
    from public.orders
    where email is not null and trim(email) <> ''
    group by lower(trim(email))
  )
  select count(*)::int into v_total
  from agg
  where p_search is null or email ilike '%' || trim(p_search) || '%';

  select coalesce(jsonb_agg(row_to_json(x.*)), '[]'::jsonb) into v_items
  from (
    select email, user_id, order_count, lifetime_value, last_order_at
    from agg
    where p_search is null or email ilike '%' || trim(p_search) || '%'
    order by last_order_at desc nulls last
    limit greatest(1, least(p_limit, 100))
    offset greatest(0, p_offset)
  ) x;

  return jsonb_build_object('ok', true, 'items', v_items, 'total', v_total);
end;
$$;

grant execute on function public.rpc_list_admin_customers(int, int, text) to authenticated;

-- Admin: low stock products
create or replace function public.rpc_list_low_stock_products(p_threshold int default null)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_threshold int;
  v_items jsonb;
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'Forbidden');
  end if;

  select coalesce(
    p_threshold,
    nullif((select value from public.site_settings where key = 'low_stock_threshold' limit 1), '')::int,
    5
  ) into v_threshold;

  select coalesce(jsonb_agg(row_to_json(x.*)), '[]'::jsonb) into v_items
  from (
    select id, name, slug, 'product' as kind, inventory_count as stock, null::text as variant_name
    from public.products
    where published = true and inventory_count <= v_threshold
    union all
    select p.id, p.name || ' — ' || pv.name, p.slug, 'variant' as kind, pv.inventory_count as stock, pv.name as variant_name
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.is_active = true and p.published = true and pv.inventory_count <= v_threshold
    order by stock asc, name asc
    limit 100
  ) x;

  return jsonb_build_object('ok', true, 'items', v_items, 'threshold', v_threshold);
end;
$$;

grant execute on function public.rpc_list_low_stock_products(int) to authenticated;

-- Product search autocomplete
create or replace function public.rpc_product_autocomplete(p_query text, p_limit int default 8)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_items jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'slug', p.slug,
    'image_url', p.image_url,
    'price', p.price
  )), '[]'::jsonb)
  into v_items
  from (
    select id, name, slug, image_url, price
    from public.products
    where published = true
      and (
        name ilike '%' || trim(p_query) || '%'
        or slug ilike '%' || trim(p_query) || '%'
      )
    order by sort_order, name
    limit greatest(1, least(p_limit, 20))
  ) p;

  return jsonb_build_object('ok', true, 'items', v_items);
end;
$$;

grant execute on function public.rpc_product_autocomplete(text, int) to anon, authenticated;

-- Filtered product listing (extends rpc with sort + price + in_stock)
create or replace function public.rpc_list_storefront_products(
  p_filter text default 'all',
  p_slug text default null,
  p_limit int default 12,
  p_offset int default 0,
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_in_stock_only boolean default false,
  p_sort text default 'default'
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_total bigint;
  v_items jsonb;
  v_filter text := lower(coalesce(btrim(p_filter), 'all'));
  v_sort text := lower(coalesce(btrim(p_sort), 'default'));
begin
  select count(*) into v_total
  from public.products p
  where p.published = true
    and (p_min_price is null or p.price >= p_min_price)
    and (p_max_price is null or p.price <= p_max_price)
    and (not p_in_stock_only or p.inventory_count > 0)
    and (
      v_filter = 'all'
      or (v_filter = 'new' and p.is_new = true)
      or (v_filter = 'best' and p.is_featured = true)
      or (v_filter in ('deals', 'summer') and p.is_summer = true)
      or (v_filter = 'collection' and p_slug is not null and exists (
        select 1 from public.collections c where c.id = p.collection_id and c.is_active and c.slug = btrim(p_slug)))
      or (v_filter = 'category' and p_slug is not null and p.category_id in (
        with recursive cat_tree as (
          select c.id from public.categories c where c.slug = btrim(p_slug) and c.is_active
          union all
          select ch.id from public.categories ch inner join cat_tree t on ch.parent_id = t.id where ch.is_active
        ) select id from cat_tree))
    );

  select coalesce(jsonb_agg(to_jsonb(sub)), '[]'::jsonb) into v_items
  from (
    select p.*
    from public.products p
    where p.published = true
      and (p_min_price is null or p.price >= p_min_price)
      and (p_max_price is null or p.price <= p_max_price)
      and (not p_in_stock_only or p.inventory_count > 0)
      and (
        v_filter = 'all' or (v_filter = 'new' and p.is_new = true) or (v_filter = 'best' and p.is_featured = true)
        or (v_filter in ('deals', 'summer') and p.is_summer = true)
        or (v_filter = 'collection' and p_slug is not null and exists (
          select 1 from public.collections c where c.id = p.collection_id and c.is_active and c.slug = btrim(p_slug)))
        or (v_filter = 'category' and p_slug is not null and p.category_id in (
          with recursive cat_tree as (
            select c.id from public.categories c where c.slug = btrim(p_slug) and c.is_active
            union all
            select ch.id from public.categories ch inner join cat_tree t on ch.parent_id = t.id where ch.is_active
          ) select id from cat_tree))
      )
    order by
      case when v_sort = 'price_asc' then p.price end asc nulls last,
      case when v_sort = 'price_desc' then p.price end desc nulls last,
      case when v_sort = 'name' then p.name end asc nulls last,
      p.sort_order asc,
      p.created_at desc
    limit greatest(coalesce(p_limit, 12), 1)
    offset greatest(coalesce(p_offset, 0), 0)
  ) sub;

  return jsonb_build_object('ok', true, 'items', v_items, 'total', v_total);
end;
$$;

grant execute on function public.rpc_list_storefront_products(text, text, int, int, numeric, numeric, boolean, text) to anon, authenticated;

-- Redeem coupon on paid order
create or replace function public.rpc_redeem_coupon_for_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_coupon record;
begin
  select * into v_order from public.orders where id = p_order_id;
  if v_order.id is null or nullif(trim(v_order.coupon_code), '') is null then
    return jsonb_build_object('ok', true, 'skipped', true);
  end if;

  select * into v_coupon from public.coupons where upper(code) = upper(trim(v_order.coupon_code)) for update;
  if v_coupon.id is null then
    return jsonb_build_object('ok', false, 'error', 'Coupon not found');
  end if;

  update public.coupons set used_count = used_count + 1, updated_at = now() where id = v_coupon.id;
  insert into public.coupon_redemptions (coupon_id, order_id, email) values (v_coupon.id, v_order.id, v_order.email);
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.rpc_redeem_coupon_for_order(uuid) from public;
grant execute on function public.rpc_redeem_coupon_for_order(uuid) to service_role;

-- Notify stock alerts after inventory fulfillment
create or replace function public.rpc_notify_stock_alerts()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub record;
  v_count int := 0;
begin
  for v_sub in
    select s.id, s.email, p.name as product_name, p.slug
    from public.stock_alert_subscriptions s
    join public.products p on p.id = s.product_id
    left join public.product_variants pv on pv.id = s.variant_id
    where s.notified_at is null
      and (
        (s.variant_id is null and p.inventory_count > 0)
        or (s.variant_id is not null and pv.inventory_count > 0)
      )
    limit 50
  loop
    update public.stock_alert_subscriptions set notified_at = now() where id = v_sub.id;
    v_count := v_count + 1;
  end loop;
  return jsonb_build_object('ok', true, 'notified', v_count);
end;
$$;

revoke all on function public.rpc_notify_stock_alerts() from public;
grant execute on function public.rpc_notify_stock_alerts() to service_role;
