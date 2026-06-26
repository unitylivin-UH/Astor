-- Product bundles: fixed-price kits composed of existing products/variants

create table if not exists public.product_bundles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  overview text,
  description text,
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2),
  sku text,
  image_url text,
  gallery_urls jsonb not null default '[]'::jsonb,
  badge text,
  published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_bundle_items (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.product_bundles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity int not null default 1 check (quantity > 0),
  sort_order int not null default 0,
  label text,
  created_at timestamptz not null default now()
);

create index if not exists product_bundle_items_bundle_id_idx on public.product_bundle_items(bundle_id);
create index if not exists product_bundles_published_sort_idx on public.product_bundles(published, sort_order);

alter table public.product_bundles enable row level security;
alter table public.product_bundle_items enable row level security;

drop policy if exists "public_read_product_bundles" on public.product_bundles;
create policy "public_read_product_bundles" on public.product_bundles
  for select to anon, authenticated using (published = true);

drop policy if exists "admin_all_product_bundles" on public.product_bundles;
create policy "admin_all_product_bundles" on public.product_bundles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public_read_bundle_items" on public.product_bundle_items;
create policy "public_read_bundle_items" on public.product_bundle_items
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.product_bundles b
      where b.id = product_bundle_items.bundle_id and b.published = true
    )
  );

drop policy if exists "admin_all_product_bundle_items" on public.product_bundle_items;
create policy "admin_all_product_bundle_items" on public.product_bundle_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.product_bundles to anon, authenticated;
grant select on public.product_bundle_items to anon, authenticated;
grant all on public.product_bundles to authenticated;
grant all on public.product_bundle_items to authenticated;

alter table public.order_items
  add column if not exists bundle_id uuid references public.product_bundles(id) on delete set null,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Resolve variant for a bundle line item (fixed variant or customer selection)
create or replace function public.resolve_bundle_item_variant(
  p_bundle_item_id uuid,
  p_selections jsonb
)
returns uuid
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_item record;
  v_sel_variant uuid;
begin
  select * into v_item from public.product_bundle_items where id = p_bundle_item_id;
  if v_item.id is null then
    return null;
  end if;

  if v_item.variant_id is not null then
    return v_item.variant_id;
  end if;

  select nullif(elem->>'variant_id', '')::uuid into v_sel_variant
  from jsonb_array_elements(coalesce(p_selections, '[]'::jsonb)) elem
  where nullif(elem->>'bundle_item_id', '')::uuid = p_bundle_item_id
  limit 1;

  return v_sel_variant;
end;
$$;

grant execute on function public.resolve_bundle_item_variant(uuid, jsonb) to anon, authenticated;

-- Max purchasable bundle quantity from component stock
create or replace function public.bundle_available_quantity(
  p_bundle_id uuid,
  p_selections jsonb default '[]'::jsonb
)
returns int
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_item record;
  v_product record;
  v_variant record;
  v_variant_id uuid;
  v_inventory int;
  v_max int := null;
  v_candidate int;
begin
  for v_item in
    select * from public.product_bundle_items
    where bundle_id = p_bundle_id
    order by sort_order, created_at
  loop
    select * into v_product from public.products p
    where p.id = v_item.product_id and p.published = true;

    if v_product.id is null then
      return 0;
    end if;

    v_variant_id := public.resolve_bundle_item_variant(v_item.id, p_selections);

    if v_variant_id is not null then
      select * into v_variant from public.product_variants pv
      where pv.id = v_variant_id and pv.product_id = v_product.id and pv.is_active = true;
      if v_variant.id is null then
        return 0;
      end if;
      v_inventory := v_variant.inventory_count;
    elsif exists (select 1 from public.product_variants pv where pv.product_id = v_product.id and pv.is_active = true) then
      return 0;
    else
      v_inventory := v_product.inventory_count;
    end if;

    v_candidate := floor(v_inventory::numeric / greatest(1, v_item.quantity));
    v_max := least(coalesce(v_max, v_candidate), v_candidate);
  end loop;

  return coalesce(v_max, 0);
end;
$$;

grant execute on function public.bundle_available_quantity(uuid, jsonb) to anon, authenticated;

-- Storefront: list published bundles
create or replace function public.rpc_list_storefront_bundles(
  p_limit int default 24,
  p_offset int default 0
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
  select count(*) into v_total from public.product_bundles where published = true;

  select coalesce(jsonb_agg(row_to_json(b.*) order by b.sort_order, b.name), '[]'::jsonb)
  into v_items
  from (
    select id, name, slug, overview, description, price, compare_at_price, sku,
           image_url, gallery_urls, badge, published, sort_order
    from public.product_bundles
    where published = true
    order by sort_order, name
    limit greatest(1, least(p_limit, 100))
    offset greatest(0, p_offset)
  ) b;

  return jsonb_build_object('ok', true, 'items', v_items, 'total', v_total);
end;
$$;

grant execute on function public.rpc_list_storefront_bundles(int, int) to anon, authenticated;

-- Storefront: single bundle with items + product summaries
create or replace function public.rpc_get_storefront_bundle(p_slug text)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_bundle record;
  v_items jsonb;
begin
  select * into v_bundle from public.product_bundles b
  where b.slug = p_slug and b.published = true;

  if v_bundle.id is null then
    return jsonb_build_object('ok', false, 'error', 'Bundle not found');
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', bi.id,
      'bundle_id', bi.bundle_id,
      'product_id', bi.product_id,
      'variant_id', bi.variant_id,
      'quantity', bi.quantity,
      'sort_order', bi.sort_order,
      'label', bi.label,
      'product', jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'slug', p.slug,
        'image_url', p.image_url,
        'price', p.price,
        'inventory_count', p.inventory_count
      ),
      'variants', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', pv.id,
          'product_id', pv.product_id,
          'name', pv.name,
          'sku', pv.sku,
          'price', pv.price,
          'compare_at_price', pv.compare_at_price,
          'inventory_count', pv.inventory_count,
          'image_url', pv.image_url,
          'sort_order', pv.sort_order,
          'is_active', pv.is_active
        ) order by pv.sort_order, pv.name)
        from public.product_variants pv
        where pv.product_id = p.id and pv.is_active = true
      ), '[]'::jsonb)
    ) order by bi.sort_order, bi.created_at
  ), '[]'::jsonb)
  into v_items
  from public.product_bundle_items bi
  join public.products p on p.id = bi.product_id and p.published = true
  where bi.bundle_id = v_bundle.id;

  if jsonb_array_length(v_items) = 0 then
    return jsonb_build_object('ok', false, 'error', 'Bundle has no available items');
  end if;

  return jsonb_build_object(
    'ok', true,
    'bundle', row_to_json(v_bundle),
    'items', v_items,
    'available_quantity', public.bundle_available_quantity(v_bundle.id, '[]'::jsonb)
  );
end;
$$;

grant execute on function public.rpc_get_storefront_bundle(text) to anon, authenticated;

-- Cart totals: products + bundles
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
  v_variant record;
  v_bundle record;
  v_bundle_item record;
  v_qty int;
  v_line numeric(10,2);
  v_unit_price numeric(10,2);
  v_inventory int;
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
begin
  select coalesce(p_currency, (select value from public.site_settings where key = 'currency_code' limit 1), 'USD')
  into v_currency;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    v_qty := greatest(1, (v_item->>'quantity')::int);
    v_bundle_id := nullif(v_item->>'bundle_id', '')::uuid;

    if v_bundle_id is not null then
      v_selections := coalesce(v_item->'selections', '[]'::jsonb);

      select * into v_bundle from public.product_bundles b
      where b.id = v_bundle_id and b.published = true;

      if v_bundle.id is null then
        return jsonb_build_object('ok', false, 'error', 'Bundle unavailable');
      end if;

      v_available := public.bundle_available_quantity(v_bundle_id, v_selections);
      if v_available < v_qty then
        return jsonb_build_object(
          'ok', false,
          'error', v_bundle.name || ' has only ' || v_available || ' available in stock'
        );
      end if;

      v_components := '[]'::jsonb;

      for v_bundle_item in
        select * from public.product_bundle_items where bundle_id = v_bundle_id order by sort_order
      loop
        select * into v_product from public.products p
        where p.id = v_bundle_item.product_id and p.published = true;

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

        if v_inventory < v_bundle_item.quantity * v_qty then
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

    -- Standard product line
    v_variant_id := nullif(v_item->>'variant_id', '')::uuid;
    v_variant_name := null;

    select * into v_product from public.products p
    where p.id = (v_item->>'product_id')::uuid and p.published = true;

    if v_product.id is null then
      return jsonb_build_object('ok', false, 'error', 'Product unavailable: ' || coalesce(v_item->>'product_id', ''));
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

    if v_inventory < v_qty then
      return jsonb_build_object('ok', false, 'error', v_name || ' has only ' || v_inventory || ' in stock');
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

-- Fulfill inventory: bundles expand to components; products use variant stock when set
create or replace function public.rpc_fulfill_order_inventory(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_line record;
  v_order record;
  v_component jsonb;
  v_variant_id uuid;
begin
  select * into v_order from public.orders where id = p_order_id;
  if v_order.id is null then
    return jsonb_build_object('ok', false, 'error', 'Order not found');
  end if;
  if v_order.status = 'paid' and coalesce(v_order.metadata->>'inventory_fulfilled', 'false') = 'true' then
    return jsonb_build_object('ok', true, 'skipped', true);
  end if;

  for v_line in select * from public.order_items where order_id = p_order_id
  loop
    if v_line.bundle_id is not null then
      for v_component in select * from jsonb_array_elements(coalesce(v_line.metadata->'components', '[]'::jsonb))
      loop
        v_variant_id := nullif(v_component->>'variant_id', '')::uuid;
        if v_variant_id is not null then
          update public.product_variants
          set inventory_count = greatest(0, inventory_count - greatest(1, (v_component->>'quantity')::int)),
              updated_at = now()
          where id = v_variant_id;
        elsif nullif(v_component->>'product_id', '') is not null then
          update public.products
          set inventory_count = greatest(0, inventory_count - greatest(1, (v_component->>'quantity')::int)),
              updated_at = now()
          where id = (v_component->>'product_id')::uuid;
        end if;
      end loop;
    elsif v_line.variant_id is not null then
      update public.product_variants
      set inventory_count = greatest(0, inventory_count - v_line.quantity),
          updated_at = now()
      where id = v_line.variant_id;
    elsif v_line.product_id is not null then
      update public.products
      set inventory_count = greatest(0, inventory_count - v_line.quantity),
          updated_at = now()
      where id = v_line.product_id;
    end if;
  end loop;

  update public.orders
  set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('inventory_fulfilled', true),
      updated_at = now()
  where id = p_order_id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.rpc_fulfill_order_inventory(uuid) from public;
grant execute on function public.rpc_fulfill_order_inventory(uuid) to service_role;

-- Demo bundle seed (PC builder kit)
insert into public.product_bundles (
  id, name, slug, overview, description, price, compare_at_price, image_url, badge, published, sort_order
) values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb901',
  'AMD Gaming Build Kit',
  'amd-gaming-build-kit',
  'CPU, motherboard, and RAM bundled for a ready-to-build gaming PC.',
  '<p>Save when you buy together: Ryzen 7 7800X3D, ASUS ROG Strix B650-E, and 32GB DDR5.</p>',
  799.99,
  859.97,
  'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80',
  'Bundle',
  true,
  0
) on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  overview = excluded.overview,
  description = excluded.description,
  price = excluded.price,
  compare_at_price = excluded.compare_at_price,
  image_url = excluded.image_url,
  badge = excluded.badge,
  published = excluded.published,
  sort_order = excluded.sort_order,
  updated_at = now();

delete from public.product_bundle_items where bundle_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb901';

insert into public.product_bundle_items (id, bundle_id, product_id, quantity, sort_order, label) values
  ('cccccccc-cccc-cccc-cccc-cccccccccc91', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb901', (select id from public.products where slug = 'amd-ryzen-7-7800x3d' limit 1), 1, 0, 'Processor'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc92', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb901', (select id from public.products where slug = 'asus-rog-strix-b650e' limit 1), 1, 1, 'Motherboard'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc93', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb901', (select id from public.products where slug = 'corsair-vengeance-32gb-ddr5' limit 1), 1, 2, 'Memory')
on conflict (id) do nothing;
