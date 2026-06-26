-- Admin RPCs: fewer round-trips for CMS admin UI

create or replace function public.rpc_get_admin_session()
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_role text;
  v_active boolean;
begin
  select au.role, au.is_active
  into v_role, v_active
  from public.admin_users au
  where au.auth_user_id = (select auth.uid())
  limit 1;

  if v_role is null or not coalesce(v_active, false) then
    return jsonb_build_object('ok', true, 'is_admin', false, 'can_edit', false, 'role', null);
  end if;

  return jsonb_build_object(
    'ok', true,
    'is_admin', v_role in ('owner', 'admin', 'editor'),
    'can_edit', v_role in ('owner', 'admin', 'editor'),
    'role', v_role
  );
end;
$$;

grant execute on function public.rpc_get_admin_session() to authenticated;

create or replace function public.rpc_get_admin_edit_context()
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'Forbidden');
  end if;

  return jsonb_build_object(
    'ok', true,
    'categories', coalesce((
      select jsonb_agg(to_jsonb(c) order by c.sort_order, c.name)
      from public.categories c
    ), '[]'::jsonb),
    'collections', coalesce((
      select jsonb_agg(to_jsonb(c) order by c.sort_order, c.title)
      from public.collections c
    ), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.rpc_get_admin_edit_context() to authenticated;

create or replace function public.rpc_list_cms_media(
  p_limit int default 48,
  p_offset int default 0,
  p_kind text default 'image',
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
  from public.cms_media m
  where (p_kind is null or m.kind = p_kind)
    and (
      p_search is null
      or btrim(p_search) = ''
      or coalesce(m.file_name, '') ilike '%' || btrim(p_search) || '%'
    );

  select coalesce(jsonb_agg(to_jsonb(sub)), '[]'::jsonb)
  into v_items
  from (
    select m.*
    from public.cms_media m
    where (p_kind is null or m.kind = p_kind)
      and (
        p_search is null
        or btrim(p_search) = ''
        or coalesce(m.file_name, '') ilike '%' || btrim(p_search) || '%'
      )
    order by m.created_at desc
    limit greatest(coalesce(p_limit, 48), 1)
    offset greatest(coalesce(p_offset, 0), 0)
  ) sub;

  return jsonb_build_object('ok', true, 'items', v_items, 'total', v_total);
end;
$$;

grant execute on function public.rpc_list_cms_media(int, int, text, text) to authenticated;

create or replace function public.rpc_register_cms_media(
  p_public_url text,
  p_folder text default 'uploads',
  p_kind text default 'image',
  p_file_name text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row public.cms_media;
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'Forbidden');
  end if;

  if p_public_url is null or btrim(p_public_url) = '' then
    return jsonb_build_object('ok', false, 'error', 'public_url is required');
  end if;

  insert into public.cms_media (public_url, folder, kind, file_name)
  values (btrim(p_public_url), nullif(btrim(p_folder), ''), coalesce(nullif(btrim(p_kind), ''), 'image'), p_file_name)
  returning * into v_row;

  return jsonb_build_object('ok', true, 'media', to_jsonb(v_row));
end;
$$;

grant execute on function public.rpc_register_cms_media(text, text, text, text) to authenticated;

create or replace function public.rpc_get_admin_dashboard()
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'Forbidden');
  end if;

  return jsonb_build_object(
    'ok', true,
    'counts', jsonb_build_object(
      'products', (select count(*) from public.products),
      'collections', (select count(*) from public.collections),
      'categories', (select count(*) from public.categories),
      'subscribers', (select count(*) from public.newsletter_subscribers),
      'media', (select count(*) from public.cms_media),
      'users', (select count(*) from public.admin_users)
    ),
    'recent_newsletter', coalesce((
      select jsonb_agg(to_jsonb(n) order by n.created_at desc)
      from (
        select ns.*
        from public.newsletter_subscribers ns
        order by ns.created_at desc
        limit 5
      ) n
    ), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.rpc_get_admin_dashboard() to authenticated;
