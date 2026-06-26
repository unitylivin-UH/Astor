-- Social links (footer) and floating WhatsApp toggle

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text not null,
  icon text not null default 'globe',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.social_links enable row level security;

drop policy if exists "public_read_social_links" on public.social_links;
create policy "public_read_social_links"
  on public.social_links for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "admin_all_social_links" on public.social_links;
create policy "admin_all_social_links"
  on public.social_links for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.social_links to anon, authenticated;
grant all on public.social_links to authenticated;

insert into public.site_settings (key, value) values
  ('floating_whatsapp_enabled', 'true')
on conflict (key) do nothing;
