-- Homepage product sections: show 8 items (4×2 grid) before "Show more".

create or replace function public.rpc_get_homepage_products(p_section text default 'new')
returns setof public.products
language sql
stable
security invoker
set search_path = public
as $$
  select * from public.products p
  where p.published = true
    and (
      (p_section = 'new' and p.is_new = true)
      or (p_section = 'summer' and p.is_summer = true)
      or (p_section = 'all')
    )
  order by p.sort_order asc, p.created_at desc
  limit 8;
$$;

grant execute on function public.rpc_get_homepage_products(text) to anon, authenticated;
