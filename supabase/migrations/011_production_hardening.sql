-- Rate limiting, admin server-side lists, product gallery

alter table public.products
  add column if not exists gallery_urls jsonb not null default '[]'::jsonb;

create table if not exists public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  identifier text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_events_lookup_idx
  on public.rate_limit_events (action, identifier, created_at desc);

alter table public.rate_limit_events enable row level security;
revoke all on public.rate_limit_events from anon, authenticated;

create or replace function public.rpc_check_rate_limit(
  p_action text,
  p_identifier text,
  p_max_requests int default 10,
  p_window_seconds int default 3600
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  delete from public.rate_limit_events
  where created_at < now() - make_interval(secs => p_window_seconds);

  select count(*)::int into v_count
  from public.rate_limit_events
  where action = p_action
    and identifier = p_identifier
    and created_at > now() - make_interval(secs => p_window_seconds);

  if v_count >= p_max_requests then
    return jsonb_build_object('ok', false, 'error', 'Too many requests. Please try again later.');
  end if;

  insert into public.rate_limit_events (action, identifier)
  values (p_action, left(p_identifier, 256));

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.rpc_check_rate_limit(text, text, int, int) from public;
grant execute on function public.rpc_check_rate_limit(text, text, int, int) to service_role;

create or replace function public.rpc_list_admin_products(
  p_limit int default 20,
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
  v_total bigint;
  v_items jsonb;
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'Forbidden');
  end if;

  select count(*) into v_total
  from public.products p
  where p_search is null
    or btrim(p_search) = ''
    or p.name ilike '%' || btrim(p_search) || '%'
    or p.slug ilike '%' || btrim(p_search) || '%';

  select coalesce(jsonb_agg(to_jsonb(sub)), '[]'::jsonb)
  into v_items
  from (
    select p.*
    from public.products p
    where p_search is null
      or btrim(p_search) = ''
      or p.name ilike '%' || btrim(p_search) || '%'
      or p.slug ilike '%' || btrim(p_search) || '%'
    order by p.sort_order, p.name
    limit greatest(coalesce(p_limit, 20), 1)
    offset greatest(coalesce(p_offset, 0), 0)
  ) sub;

  return jsonb_build_object('ok', true, 'items', v_items, 'total', v_total);
end;
$$;

grant execute on function public.rpc_list_admin_products(int, int, text) to authenticated;

create or replace function public.rpc_list_admin_orders(
  p_limit int default 20,
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
  v_total bigint;
  v_items jsonb;
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'Forbidden');
  end if;

  select count(*) into v_total
  from public.orders o
  where p_search is null
    or btrim(p_search) = ''
    or o.order_number ilike '%' || btrim(p_search) || '%'
    or o.email ilike '%' || btrim(p_search) || '%';

  select coalesce(jsonb_agg(to_jsonb(sub)), '[]'::jsonb)
  into v_items
  from (
    select o.*
    from public.orders o
    where p_search is null
      or btrim(p_search) = ''
      or o.order_number ilike '%' || btrim(p_search) || '%'
      or o.email ilike '%' || btrim(p_search) || '%'
    order by o.created_at desc
    limit greatest(coalesce(p_limit, 20), 1)
    offset greatest(coalesce(p_offset, 0), 0)
  ) sub;

  return jsonb_build_object('ok', true, 'items', v_items, 'total', v_total);
end;
$$;

grant execute on function public.rpc_list_admin_orders(int, int, text) to authenticated;
