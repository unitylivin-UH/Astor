-- Product enhancements: overview, delivery, variants, reviews, wishlists

-- ── Products: overview + delivery ───────────────────────────────────────────
alter table public.products
  add column if not exists overview text,
  add column if not exists delivery_info text,
  add column if not exists use_default_delivery boolean not null default true;

comment on column public.products.overview is 'Short product overview shown in its own PDP section';
comment on column public.products.delivery_info is 'Per-product delivery copy (HTML). Ignored when use_default_delivery is true';
comment on column public.products.use_default_delivery is 'When true, storefront uses site default_delivery_info';

insert into public.site_settings (key, value) values
  ('default_delivery_info', '<p>Standard delivery 3–5 business days. Express options may be available at checkout. Contact us for bulk or international orders.</p>')
on conflict (key) do nothing;

-- ── Product variants ────────────────────────────────────────────────────────
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  sku text,
  price numeric(10,2),
  compare_at_price numeric(10,2),
  inventory_count int not null default 0,
  option_values jsonb not null default '{}'::jsonb,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_variants_product_id_idx on public.product_variants(product_id);

-- ── Product reviews ─────────────────────────────────────────────────────────
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  rating int not null check (rating >= 1 and rating <= 5),
  title text,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index if not exists product_reviews_product_id_idx on public.product_reviews(product_id);
create index if not exists product_reviews_status_idx on public.product_reviews(status);

-- ── Wishlists ───────────────────────────────────────────────────────────────
create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists wishlists_user_id_idx on public.wishlists(user_id);

-- ── Order items: variant tracking ───────────────────────────────────────────
alter table public.order_items
  add column if not exists variant_id uuid references public.product_variants(id) on delete set null,
  add column if not exists variant_name text;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.product_variants enable row level security;
alter table public.product_reviews enable row level security;
alter table public.wishlists enable row level security;

drop policy if exists "public_read_active_variants" on public.product_variants;
create policy "public_read_active_variants" on public.product_variants
  for select to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.products p
      where p.id = product_variants.product_id and p.published = true
    )
  );

drop policy if exists "admin_all_product_variants" on public.product_variants;
create policy "admin_all_product_variants" on public.product_variants
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public_read_approved_reviews" on public.product_reviews;
drop policy if exists "customer_insert_own_reviews" on public.product_reviews;
create policy "public_read_approved_reviews" on public.product_reviews
  for select to anon, authenticated
  using (status = 'approved');

drop policy if exists "customer_read_own_reviews" on public.product_reviews;
create policy "customer_read_own_reviews" on public.product_reviews
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "admin_all_product_reviews" on public.product_reviews;
create policy "admin_all_product_reviews" on public.product_reviews
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "customer_own_wishlists" on public.wishlists;
create policy "customer_own_wishlists" on public.wishlists
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── Helpers ─────────────────────────────────────────────────────────────────
-- Safe auth.users lookup (anon/authenticated cannot read auth.users directly).
create or replace function public.auth_user_email(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email from auth.users where id = p_user_id;
$$;

revoke all on function public.auth_user_email(uuid) from public;
grant execute on function public.auth_user_email(uuid) to anon, authenticated;

create or replace function public.user_has_purchased_product(p_product_id uuid, p_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  if p_user_id is null then
    return false;
  end if;

  if p_user_id is distinct from auth.uid() and not public.is_admin() then
    return false;
  end if;

  v_email := public.auth_user_email(p_user_id);

  return exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.product_id = p_product_id
      and o.status = 'paid'
      and (
        o.user_id = p_user_id
        or (v_email is not null and lower(o.email) = lower(v_email))
      )
  );
end;
$$;

revoke all on function public.user_has_purchased_product(uuid, uuid) from public;
grant execute on function public.user_has_purchased_product(uuid, uuid) to anon, authenticated;

create or replace function public.resolve_product_delivery_text(p_product_id uuid)
returns text
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_default text;
begin
  select * into v_product from public.products where id = p_product_id;
  if not found then return null; end if;

  if coalesce(v_product.use_default_delivery, true) then
    select value into v_default from public.site_settings where key = 'default_delivery_info' limit 1;
    if v_default is not null and btrim(v_default) <> '' then
      return v_default;
    end if;
    select body_html into v_default
    from public.marketing_pages
    where slug = 'shipping' and published = true
    limit 1;
    return v_default;
  end if;

  return nullif(btrim(coalesce(v_product.delivery_info, '')), '');
end;
$$;

-- ── Storefront product (variants + reviews summary + delivery) ──────────────
create or replace function public.rpc_get_storefront_product(p_slug text)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_row public.products%rowtype;
  v_variants jsonb;
  v_reviews jsonb;
  v_avg numeric;
  v_count int;
  v_delivery text;
begin
  if p_slug is null or btrim(p_slug) = '' then
    return jsonb_build_object('ok', false, 'error', 'Missing slug');
  end if;

  select * into v_row
  from public.products p
  where p.slug = btrim(p_slug) and p.published = true
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Not found');
  end if;

  select coalesce(jsonb_agg(to_jsonb(v) order by v.sort_order, v.name), '[]'::jsonb)
  into v_variants
  from public.product_variants v
  where v.product_id = v_row.id and v.is_active = true;

  select round(avg(r.rating)::numeric, 1), count(*)::int
  into v_avg, v_count
  from public.product_reviews r
  where r.product_id = v_row.id and r.status = 'approved';

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'rating', r.rating,
      'title', r.title,
      'body', r.body,
      'created_at', r.created_at,
      'author_label', coalesce(split_part(public.auth_user_email(r.user_id), '@', 1), 'Customer')
    ) order by r.created_at desc
  ), '[]'::jsonb)
  into v_reviews
  from public.product_reviews r
  where r.product_id = v_row.id and r.status = 'approved';

  v_delivery := public.resolve_product_delivery_text(v_row.id);

  return jsonb_build_object(
    'ok', true,
    'product', to_jsonb(v_row),
    'variants', v_variants,
    'reviews', jsonb_build_object(
      'average_rating', coalesce(v_avg, 0),
      'count', coalesce(v_count, 0),
      'items', v_reviews
    ),
    'delivery_text', v_delivery
  );
end;
$$;

grant execute on function public.rpc_get_storefront_product(text) to anon, authenticated;

-- ── Cart totals with variant support ────────────────────────────────────────
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
  v_qty int;
  v_line numeric(10,2);
  v_unit_price numeric(10,2);
  v_inventory int;
  v_name text;
  v_image text;
  v_items_out jsonb := '[]'::jsonb;
  v_variant_id uuid;
  v_variant_name text;
begin
  select coalesce(p_currency, (select value from public.site_settings where key = 'currency_code' limit 1), 'USD')
  into v_currency;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    v_qty := greatest(1, (v_item->>'quantity')::int);
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

-- ── Submit review (post-purchase) ───────────────────────────────────────────
create or replace function public.rpc_submit_product_review(
  p_product_id uuid,
  p_rating int,
  p_title text default null,
  p_body text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_body text := nullif(btrim(coalesce(p_body, '')), '');
  v_order_id uuid;
  v_email text;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'Sign in to leave a review');
  end if;

  if p_rating is null or p_rating < 1 or p_rating > 5 then
    return jsonb_build_object('ok', false, 'error', 'Rating must be between 1 and 5');
  end if;

  if v_body is null then
    return jsonb_build_object('ok', false, 'error', 'Review text is required');
  end if;

  if not exists (select 1 from public.products where id = p_product_id and published = true) then
    return jsonb_build_object('ok', false, 'error', 'Product not found');
  end if;

  if not public.user_has_purchased_product(p_product_id, v_uid) then
    return jsonb_build_object('ok', false, 'error', 'You can only review products you have purchased');
  end if;

  if exists (select 1 from public.product_reviews where product_id = p_product_id and user_id = v_uid) then
    return jsonb_build_object('ok', false, 'error', 'You have already reviewed this product');
  end if;

  v_email := public.auth_user_email(v_uid);

  select o.id into v_order_id
  from public.orders o
  join public.order_items oi on oi.order_id = o.id
  where oi.product_id = p_product_id
    and o.status = 'paid'
    and (o.user_id = v_uid or (v_email is not null and lower(o.email) = lower(v_email)))
  order by o.created_at desc
  limit 1;

  insert into public.product_reviews (product_id, user_id, order_id, rating, title, body, status)
  values (p_product_id, v_uid, v_order_id, p_rating, nullif(btrim(coalesce(p_title, '')), ''), v_body, 'pending');

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.rpc_submit_product_review(uuid, int, text, text) from public;
grant execute on function public.rpc_submit_product_review(uuid, int, text, text) to authenticated;

-- ── Review eligibility ──────────────────────────────────────────────────────
create or replace function public.rpc_can_review_product(p_product_id uuid)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return jsonb_build_object('ok', true, 'can_review', false, 'reason', 'sign_in');
  end if;

  if exists (select 1 from public.product_reviews where product_id = p_product_id and user_id = v_uid) then
    return jsonb_build_object('ok', true, 'can_review', false, 'reason', 'already_reviewed');
  end if;

  if not public.user_has_purchased_product(p_product_id, v_uid) then
    return jsonb_build_object('ok', true, 'can_review', false, 'reason', 'not_purchased');
  end if;

  return jsonb_build_object('ok', true, 'can_review', true);
end;
$$;

grant execute on function public.rpc_can_review_product(uuid) to authenticated;

-- ── Wishlist RPCs ───────────────────────────────────────────────────────────
create or replace function public.rpc_toggle_wishlist(p_product_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_exists boolean;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'Sign in to use your wishlist');
  end if;

  if not exists (select 1 from public.products where id = p_product_id and published = true) then
    return jsonb_build_object('ok', false, 'error', 'Product not found');
  end if;

  select exists (
    select 1 from public.wishlists where user_id = v_uid and product_id = p_product_id
  ) into v_exists;

  if v_exists then
    delete from public.wishlists where user_id = v_uid and product_id = p_product_id;
    return jsonb_build_object('ok', true, 'in_wishlist', false);
  end if;

  insert into public.wishlists (user_id, product_id) values (v_uid, p_product_id);
  return jsonb_build_object('ok', true, 'in_wishlist', true);
end;
$$;

grant execute on function public.rpc_toggle_wishlist(uuid) to authenticated;

create or replace function public.rpc_list_wishlist_product_ids()
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_ids jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('ok', true, 'product_ids', '[]'::jsonb);
  end if;

  select coalesce(jsonb_agg(w.product_id order by w.created_at desc), '[]'::jsonb)
  into v_ids
  from public.wishlists w
  join public.products p on p.id = w.product_id and p.published = true
  where w.user_id = v_uid;

  return jsonb_build_object('ok', true, 'product_ids', v_ids);
end;
$$;

grant execute on function public.rpc_list_wishlist_product_ids() to authenticated;
