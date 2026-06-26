-- Fix admin login 500: admin_users SELECT policy called is_admin(), which queried
-- admin_users again under RLS → infinite recursion on rpc_get_admin_session.

drop policy if exists "admin_read_admin_users" on public.admin_users;

-- Any signed-in user can read their own admin profile (bootstrap for rpc_get_admin_session).
create policy "admin_read_own_user" on public.admin_users
  for select to authenticated
  using (auth_user_id = (select auth.uid()));

-- Owners/admins can list all admin users (direct subquery avoids is_admin() recursion).
create policy "admin_read_all_users" on public.admin_users
  for select to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where au.auth_user_id = (select auth.uid())
        and au.is_active = true
        and au.role in ('owner', 'admin')
    )
  );
