-- Brand assets in site_settings + responsive hero slide backgrounds

alter table public.hero_slides
  add column if not exists image_url_tablet text,
  add column if not exists image_url_mobile text;

insert into public.site_settings (key, value) values
  ('favicon_url', ''),
  ('logo_dark_url', ''),
  ('logo_light_url', ''),
  ('hero_bg_desktop', ''),
  ('hero_bg_tablet', ''),
  ('hero_bg_mobile', '')
on conflict (key) do nothing;
