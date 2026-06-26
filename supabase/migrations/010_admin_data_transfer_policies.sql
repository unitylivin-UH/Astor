-- Allow admin bulk import for newsletter and commerce records

create policy "admin_insert_newsletter" on public.newsletter_subscribers
  for insert to authenticated
  with check (public.is_admin());

create policy "admin_update_newsletter" on public.newsletter_subscribers
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin_insert_orders" on public.orders
  for insert to authenticated
  with check (public.is_admin());

create policy "admin_insert_order_items" on public.order_items
  for insert to authenticated
  with check (public.is_admin());

create policy "admin_update_order_items" on public.order_items
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
