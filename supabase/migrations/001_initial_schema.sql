-- Astor Sneakers CMS schema
-- Apply via Supabase SQL editor or supabase db push

-- Extensions
create extension if not exists "pgcrypto";

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Collections
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  cover_image_url text,
  type text default 'seasonal',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  category_id uuid references public.categories(id) on delete set null,
  collection_id uuid references public.collections(id) on delete set null,
  badge text,
  is_featured boolean not null default false,
  is_new boolean not null default false,
  is_summer boolean not null default false,
  inventory_count int not null default 0,
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Hero slides
create table if not exists public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  headline_lines jsonb not null default '[]'::jsonb,
  cta_label text,
  cta_url text,
  image_url text,
  background_color text default '#7b674f',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Feature cards
create table if not exists public.feature_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  cta_label text,
  cta_url text,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lifestyle cards
create table if not exists public.lifestyle_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  cta_label text,
  cta_url text,
  image_url text,
  layout text not null default 'small' check (layout in ('large', 'small', 'wide')),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Homepage sections
create table if not exists public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text unique not null,
  title text,
  subtitle text,
  image_url text,
  cta_label text,
  cta_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Nav links
create table if not exists public.nav_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text not null,
  location text not null check (location in ('header', 'footer_categories', 'footer_legal', 'footer_help')),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Site settings (key-value)
create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

-- Newsletter
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  source text default 'homepage_footer',
  created_at timestamptz not null default now()
);

-- CMS media index
create table if not exists public.cms_media (
  id uuid primary key default gen_random_uuid(),
  public_url text not null,
  folder text,
  kind text default 'image',
  file_name text,
  created_at timestamptz not null default now()
);

-- Admin users
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text unique not null,
  role text not null default 'editor' check (role in ('owner', 'admin', 'editor', 'viewer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Form submissions inbox
create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_type text not null default 'contact',
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

-- RLS
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.hero_slides enable row level security;
alter table public.feature_cards enable row level security;
alter table public.lifestyle_cards enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.nav_links enable row level security;
alter table public.site_settings enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.cms_media enable row level security;
alter table public.admin_users enable row level security;
alter table public.form_submissions enable row level security;

-- Public read policies
create policy "public_read_categories" on public.categories for select to anon, authenticated using (is_active = true);
create policy "public_read_collections" on public.collections for select to anon, authenticated using (is_active = true);
create policy "public_read_products" on public.products for select to anon, authenticated using (published = true);
create policy "public_read_hero_slides" on public.hero_slides for select to anon, authenticated using (is_active = true);
create policy "public_read_feature_cards" on public.feature_cards for select to anon, authenticated using (is_active = true);
create policy "public_read_lifestyle_cards" on public.lifestyle_cards for select to anon, authenticated using (is_active = true);
create policy "public_read_homepage_sections" on public.homepage_sections for select to anon, authenticated using (is_active = true);
create policy "public_read_nav_links" on public.nav_links for select to anon, authenticated using (is_active = true);
create policy "public_read_site_settings" on public.site_settings for select to anon, authenticated using (true);
create policy "public_read_cms_media" on public.cms_media for select to anon, authenticated using (true);

-- Admin helper
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users au
    where au.auth_user_id = (select auth.uid())
      and au.is_active = true
      and au.role in ('owner', 'admin', 'editor')
  );
$$;

-- Admin write policies
create policy "admin_all_categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all_collections" on public.collections for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all_products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all_hero_slides" on public.hero_slides for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all_feature_cards" on public.feature_cards for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all_lifestyle_cards" on public.lifestyle_cards for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all_homepage_sections" on public.homepage_sections for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all_nav_links" on public.nav_links for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all_site_settings" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all_cms_media" on public.cms_media for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_read_admin_users" on public.admin_users for select to authenticated using (public.is_admin());
create policy "admin_manage_admin_users" on public.admin_users for all to authenticated using (
  exists (select 1 from public.admin_users au where au.auth_user_id = (select auth.uid()) and au.is_active and au.role in ('owner', 'admin'))
) with check (
  exists (select 1 from public.admin_users au where au.auth_user_id = (select auth.uid()) and au.is_active and au.role in ('owner', 'admin'))
);
create policy "admin_all_form_submissions" on public.form_submissions for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Newsletter: public insert via RPC only; admin read
create policy "admin_read_newsletter" on public.newsletter_subscribers for select to authenticated using (public.is_admin());
create policy "admin_delete_newsletter" on public.newsletter_subscribers for delete to authenticated using (public.is_admin());

-- RPC: subscribe newsletter
create or replace function public.rpc_subscribe_newsletter(p_email text, p_source text default 'homepage_footer')
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return jsonb_build_object('ok', false, 'error', 'Invalid email');
  end if;

  insert into public.newsletter_subscribers (email, source)
  values (v_email, coalesce(p_source, 'homepage_footer'))
  on conflict (email) do nothing;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.rpc_subscribe_newsletter(text, text) to anon, authenticated;

-- RPC: homepage products by flag
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
  limit 6;
$$;

grant execute on function public.rpc_get_homepage_products(text) to anon, authenticated;

-- RPC: collection products
create or replace function public.rpc_get_collection_products(p_collection_slug text)
returns setof public.products
language sql
stable
security invoker
set search_path = public
as $$
  select p.* from public.products p
  join public.collections c on c.id = p.collection_id
  where p.published = true and c.is_active = true and c.slug = p_collection_slug
  order by p.sort_order asc;
$$;

grant execute on function public.rpc_get_collection_products(text) to anon, authenticated;

-- Storage bucket (run in dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('cms-media', 'cms-media', true);

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
