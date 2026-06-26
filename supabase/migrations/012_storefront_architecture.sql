-- Storefront architecture: paginated product listing, search, single product RPCs.
-- Run after 011. Enables partial CMS load on the client (layout snapshot + per-route products).

-- Paginated storefront product listing with filter modes.
create or replace function public.rpc_list_storefront_products(
  p_filter text default 'all',
  p_slug text default null,
  p_limit int default 12,
  p_offset int default 0
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
begin
  select count(*) into v_total
  from public.products p
  where p.published = true
    and (
      v_filter = 'all'
      or (v_filter = 'new' and p.is_new = true)
      or (v_filter = 'best' and p.is_featured = true)
      or (v_filter in ('deals', 'summer') and p.is_summer = true)
      or (
        v_filter = 'collection'
        and p_slug is not null
        and exists (
          select 1
          from public.collections c
          where c.id = p.collection_id
            and c.is_active = true
            and c.slug = btrim(p_slug)
        )
      )
      or (
        v_filter = 'category'
        and p_slug is not null
        and p.category_id in (
          with recursive cat_tree as (
            select c.id
            from public.categories c
            where c.slug = btrim(p_slug)
              and c.is_active = true
            union all
            select ch.id
            from public.categories ch
            inner join cat_tree t on ch.parent_id = t.id
            where ch.is_active = true
          )
          select id from cat_tree
        )
      )
    );

  select coalesce(jsonb_agg(to_jsonb(sub)), '[]'::jsonb)
  into v_items
  from (
    select p.*
    from public.products p
    where p.published = true
      and (
        v_filter = 'all'
        or (v_filter = 'new' and p.is_new = true)
        or (v_filter = 'best' and p.is_featured = true)
        or (v_filter in ('deals', 'summer') and p.is_summer = true)
        or (
          v_filter = 'collection'
          and p_slug is not null
          and exists (
            select 1
            from public.collections c
            where c.id = p.collection_id
              and c.is_active = true
              and c.slug = btrim(p_slug)
          )
        )
        or (
          v_filter = 'category'
          and p_slug is not null
          and p.category_id in (
            with recursive cat_tree as (
              select c.id
              from public.categories c
              where c.slug = btrim(p_slug)
                and c.is_active = true
              union all
              select ch.id
              from public.categories ch
              inner join cat_tree t on ch.parent_id = t.id
              where ch.is_active = true
            )
            select id from cat_tree
          )
        )
      )
    order by p.sort_order asc, p.created_at desc
    limit greatest(coalesce(p_limit, 12), 1)
    offset greatest(coalesce(p_offset, 0), 0)
  ) sub;

  return jsonb_build_object('ok', true, 'items', v_items, 'total', v_total);
end;
$$;

grant execute on function public.rpc_list_storefront_products(text, text, int, int) to anon, authenticated;

-- Full-text style search with pagination.
create or replace function public.rpc_search_storefront_products(
  p_query text,
  p_limit int default 12,
  p_offset int default 0
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
  v_q text := btrim(coalesce(p_query, ''));
begin
  if v_q = '' then
    return jsonb_build_object('ok', true, 'items', '[]'::jsonb, 'total', 0);
  end if;

  select count(*) into v_total
  from public.products p
  where p.published = true
    and (
      p.name ilike '%' || v_q || '%'
      or p.slug ilike '%' || v_q || '%'
      or coalesce(p.description, '') ilike '%' || v_q || '%'
      or coalesce(p.badge, '') ilike '%' || v_q || '%'
    );

  select coalesce(jsonb_agg(to_jsonb(sub)), '[]'::jsonb)
  into v_items
  from (
    select p.*
    from public.products p
    where p.published = true
      and (
        p.name ilike '%' || v_q || '%'
        or p.slug ilike '%' || v_q || '%'
        or coalesce(p.description, '') ilike '%' || v_q || '%'
        or coalesce(p.badge, '') ilike '%' || v_q || '%'
      )
    order by p.sort_order asc, p.created_at desc
    limit greatest(coalesce(p_limit, 12), 1)
    offset greatest(coalesce(p_offset, 0), 0)
  ) sub;

  return jsonb_build_object('ok', true, 'items', v_items, 'total', v_total);
end;
$$;

grant execute on function public.rpc_search_storefront_products(text, int, int) to anon, authenticated;

-- Single product by slug for PDP.
create or replace function public.rpc_get_storefront_product(p_slug text)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_row public.products%rowtype;
begin
  if p_slug is null or btrim(p_slug) = '' then
    return jsonb_build_object('ok', false, 'error', 'Missing slug');
  end if;

  select * into v_row
  from public.products p
  where p.slug = btrim(p_slug)
    and p.published = true
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Not found');
  end if;

  return jsonb_build_object('ok', true, 'product', to_jsonb(v_row));
end;
$$;

grant execute on function public.rpc_get_storefront_product(text) to anon, authenticated;
