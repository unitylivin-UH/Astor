-- Storefront: contact form, customer orders, inventory fulfillment, media storage

-- Contact form (public RPC — no direct table insert)
create or replace function public.rpc_submit_contact_form(
  p_name text,
  p_email text,
  p_message text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_message), '') = '' then
    return jsonb_build_object('ok', false, 'error', 'Name and message are required');
  end if;
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return jsonb_build_object('ok', false, 'error', 'Invalid email address');
  end if;

  insert into public.form_submissions (form_type, payload, status)
  values (
    'contact',
    jsonb_build_object('name', trim(p_name), 'email', v_email, 'message', trim(p_message)),
    'new'
  );

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.rpc_submit_contact_form(text, text, text) to anon, authenticated;

-- Fulfill inventory after payment (service role / edge functions only)
create or replace function public.rpc_fulfill_order_inventory(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_line record;
  v_order record;
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
    if v_line.product_id is not null then
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

-- Customers can read their own orders by email
create policy "customer_read_own_orders" on public.orders
  for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt()->>'email', '')));

create policy "customer_read_own_order_items" on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and lower(o.email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

-- cms-media storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cms-media',
  'cms-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "public_read_cms_media" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'cms-media');

create policy "admin_insert_cms_media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cms-media' and public.is_admin());

create policy "admin_update_cms_media" on storage.objects
  for update to authenticated
  using (bucket_id = 'cms-media' and public.is_admin());

create policy "admin_delete_cms_media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'cms-media' and public.is_admin());

-- Richer default contact page body (form rendered in app when slug=contact)
update public.marketing_pages
set body_html = '<p>Have a question about sizing, shipping, or your order? Send us a message and we will reply within one business day.</p>'
where slug = 'contact';
