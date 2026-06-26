-- Optional seed data for Astor Electronics (run after 001_initial_schema.sql)

insert into public.site_settings (key, value) values
  ('site_name', 'Astor'),
  ('logo_text', 'ASTOR'),
  ('newsletter_heading', 'Stay ahead with new tech drops'),
  ('footer_tagline', 'Premium electronics for work, play, and everything in between.'),
  ('checkout_mode', 'quote'),
  ('quote_notification_email', 'quotes@astor.example')
on conflict (key) do update set value = excluded.value;

-- Categories, collections, and products are seeded in 006_electronics_catalog.sql

insert into public.homepage_sections (section_key, title, subtitle, cta_label, cta_url, sort_order) values
  ('newly_dropped', 'Newly Arrived Tech', 'The latest components, phones, and consoles — curated for performance and value.', 'View All', '/collection/new', 0),
  ('summer_collections', 'Hot Deals', 'Save on GPUs, phones, and gaming gear while stocks last.', 'View Deals', '/collection/deals', 1),
  ('final_cta', 'Build Your Setup With Premium Electronics From Astor.', '', 'Shop Now', '/collection/all', 2)
on conflict (section_key) do nothing;
