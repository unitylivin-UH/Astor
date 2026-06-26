-- Fix rpc_list_storefront_products: CTE "filtered" was scoped to the first statement only,
-- causing "relation filtered does not exist" and REST 404 on collection/list pages.

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

notify pgrst, 'reload schema';
