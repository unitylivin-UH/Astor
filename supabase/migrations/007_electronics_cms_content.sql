-- Seed homepage CMS content with correct storefront routes

insert into public.hero_slides (id, headline_lines, cta_label, cta_url, image_url, background_color, sort_order) values
  ('11111111-1111-1111-1111-111111111101', '["Tech That", "Powers Your", "Everyday"]'::jsonb, 'Shop Now', '/collection/new', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&q=80', '#1a3a5c', 0),
  ('11111111-1111-1111-1111-111111111102', '["Build Your", "Dream", "Setup"]'::jsonb, 'Browse Components', '/collection/system-accessories', 'https://images.unsplash.com/photo-1587202372775-e229f172b9b7?w=900&q=80', '#2d4a6a', 1)
on conflict (id) do update set
  headline_lines = excluded.headline_lines,
  cta_label = excluded.cta_label,
  cta_url = excluded.cta_url,
  image_url = excluded.image_url,
  background_color = excluded.background_color,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.feature_cards (id, title, cta_label, cta_url, image_url, sort_order) values
  ('33333333-3333-3333-3333-333333333301', 'Components Built For Performance — Reliable, Efficient, And Ready To Ship.', 'Shop Components', '/collection/system-accessories', 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80', 0),
  ('33333333-3333-3333-3333-333333333302', 'Latest Phones & Tablets — Flagship Features At Competitive Prices.', 'Shop Phones', '/collection/mobile-phones', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80', 1),
  ('33333333-3333-3333-3333-333333333303', 'GAMING ZONE', 'Shop Consoles', '/collection/gaming', 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80', 2)
on conflict (id) do update set
  title = excluded.title,
  cta_label = excluded.cta_label,
  cta_url = excluded.cta_url,
  image_url = excluded.image_url,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.lifestyle_cards (id, title, cta_label, cta_url, image_url, layout, sort_order) values
  ('44444444-4444-4444-4444-444444444401', 'Pro Gaming Rigs', 'Explore', '/collection/gaming-pc', 'https://images.unsplash.com/photo-1587202372775-e229f172b9b7?w=900&q=80', 'large', 0),
  ('44444444-4444-4444-4444-444444444402', 'GPU Deals', 'Shop', '/collection/graphics-card', 'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800', 'small', 1),
  ('44444444-4444-4444-4444-444444444403', 'Console Corner', 'View', '/collection/gaming', 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80', 'small', 2),
  ('44444444-4444-4444-4444-444444444404', 'Curated For Every Setup', 'View All Products', '/collection/all', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80', 'wide', 3)
on conflict (id) do update set
  title = excluded.title,
  cta_label = excluded.cta_label,
  cta_url = excluded.cta_url,
  image_url = excluded.image_url,
  layout = excluded.layout,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.nav_links (id, label, href, location, sort_order) values
  ('55555555-5555-5555-5555-555555555501', 'Home', '/', 'header', 0),
  ('55555555-5555-5555-5555-555555555506', 'New Arrivals', '/collection/new', 'footer_categories', 0),
  ('55555555-5555-5555-5555-555555555507', 'Best Sellers', '/collection/best', 'footer_categories', 1),
  ('55555555-5555-5555-5555-555555555512', 'Hot Deals', '/collection/deals', 'footer_categories', 2),
  ('55555555-5555-5555-5555-555555555508', 'Privacy Policy', '/pages/privacy', 'footer_legal', 0),
  ('55555555-5555-5555-5555-555555555509', 'Terms', '/pages/terms', 'footer_legal', 1),
  ('55555555-5555-5555-5555-555555555510', 'Contact', '/pages/contact', 'footer_help', 0),
  ('55555555-5555-5555-5555-555555555511', 'Shipping', '/pages/shipping', 'footer_help', 1)
on conflict (id) do update set
  label = excluded.label,
  href = excluded.href,
  location = excluded.location,
  sort_order = excluded.sort_order,
  is_active = true;
