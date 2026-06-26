-- Complete fix: admin_manage_admin_users (FOR ALL) also recursed on SELECT.
-- Use a SECURITY DEFINER helper for owner/admin checks.

create or replace function public.can_manage_admin_users()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.auth_user_id = (select auth.uid())
      and au.is_active = true
      and au.role in ('owner', 'admin')
  );
$$;

revoke all on function public.can_manage_admin_users() from public;
grant execute on function public.can_manage_admin_users() to authenticated;

drop policy if exists "admin_read_all_users" on public.admin_users;
drop policy if exists "admin_manage_admin_users" on public.admin_users;

-- Owners/admins can list every admin user (helper bypasses RLS, no recursion).
create policy "admin_read_all_users" on public.admin_users
  for select to authenticated
  using (public.can_manage_admin_users());

create policy "admin_insert_admin_users" on public.admin_users
  for insert to authenticated
  with check (public.can_manage_admin_users());

create policy "admin_update_admin_users" on public.admin_users
  for update to authenticated
  using (public.can_manage_admin_users())
  with check (public.can_manage_admin_users());

create policy "admin_delete_admin_users" on public.admin_users
  for delete to authenticated
  using (public.can_manage_admin_users());
