-- Bundles moved from homepage section to primary header navigation.

insert into public.nav_links (id, label, href, location, sort_order, is_active) values
  ('55555555-5555-5555-5555-555555555514', 'Bundles', '/bundles', 'header', 1, true)
on conflict (id) do update set
  label = excluded.label,
  href = excluded.href,
  location = excluded.location,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;
