-- Astor Electronics: category hierarchy, quote checkout, electronics catalog

-- Category hierarchy (parent → child for nav dropdowns)
alter table public.categories
  add column if not exists parent_id uuid references public.categories(id) on delete set null;

create index if not exists categories_parent_id_idx on public.categories(parent_id);

-- Allow quote-request orders
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'paid', 'failed', 'refunded', 'cancelled', 'quote_requested'));

-- Checkout settings
insert into public.site_settings (key, value) values
  ('checkout_mode', 'quote'),
  ('quote_notification_email', 'quotes@astor.example')
on conflict (key) do update set value = excluded.value;

-- Site branding
insert into public.site_settings (key, value) values
  ('site_name', 'Astor'),
  ('logo_text', 'ASTOR'),
  ('newsletter_heading', 'Stay ahead with new tech drops'),
  ('footer_tagline', 'Premium electronics for work, play, and everything in between.'),
  ('contact_whatsapp_message', 'Hello! I have a question about Astor Electronics.')
on conflict (key) do update set value = excluded.value;

-- Remove legacy sneaker categories (products will be re-seeded)
delete from public.products where category_id in (
  select id from public.categories where slug in ('men', 'kids', 'accessories')
);
delete from public.categories where slug in ('men', 'kids', 'accessories');

-- Top-level departments
insert into public.categories (id, name, slug, sort_order, parent_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'System Accessories', 'system-accessories', 0, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Graphics Card', 'graphics-card', 1, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Mobile Phones', 'mobile-phones', 2, null),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'Gaming', 'gaming', 3, null)
on conflict (slug) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  parent_id = excluded.parent_id;

-- System Accessories children
insert into public.categories (id, name, slug, sort_order, parent_id) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb101', 'Power Supply', 'power-supply', 0, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb102', 'Motherboards', 'motherboards', 1, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb103', 'Ram', 'ram', 2, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb104', 'Processors', 'processors', 3, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb105', 'Gaming PC', 'gaming-pc', 4, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1')
on conflict (slug) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  parent_id = excluded.parent_id;

-- Graphics Card brands
insert into public.categories (id, name, slug, sort_order, parent_id) values
  ('cccccccc-cccc-cccc-cccc-cccccccccc01', 'MSI', 'msi', 0, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02', 'Zotac', 'zotac', 1, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc03', 'Gigabyte', 'gigabyte', 2, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2')
on conflict (slug) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  parent_id = excluded.parent_id;

-- Mobile Phones brands
insert into public.categories (id, name, slug, sort_order, parent_id) values
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', 'Apple', 'apple', 0, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd02', 'Samsung', 'samsung', 1, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd03', 'Google', 'google', 2, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd04', 'Oneplus', 'oneplus', 3, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3')
on conflict (slug) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  parent_id = excluded.parent_id;

-- Gaming consoles
insert into public.categories (id, name, slug, sort_order, parent_id) values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 'Nintendo', 'nintendo', 0, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02', 'Playstation 5', 'playstation-5', 1, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03', 'Xbox', 'xbox', 2, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4')
on conflict (slug) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  parent_id = excluded.parent_id;

-- Collections
insert into public.collections (id, title, slug, description, sort_order) values
  ('22222222-2222-2222-2222-222222222201', 'New Arrivals', 'new', 'Latest tech releases', 0),
  ('22222222-2222-2222-2222-222222222202', 'Hot Deals', 'deals', 'Limited-time offers on top gear', 1)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  sort_order = excluded.sort_order;

-- Homepage sections
insert into public.homepage_sections (section_key, title, subtitle, cta_label, cta_url, sort_order) values
  ('newly_dropped', 'Newly Arrived Tech', 'The latest components, phones, and consoles — curated for performance and value.', 'View All', '/collection/new', 0),
  ('summer_collections', 'Hot Deals', 'Save on GPUs, phones, and gaming gear while stocks last.', 'View Deals', '/collection/deals', 1),
  ('final_cta', 'Build Your Setup With Premium Electronics From Astor.', '', 'Shop Now', '/collection/all', 2)
on conflict (section_key) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  cta_label = excluded.cta_label,
  cta_url = excluded.cta_url;

-- Sample electronics products (images from Unsplash / Pexels)
insert into public.products (id, name, slug, description, price, image_url, category_id, collection_id, badge, is_featured, is_new, is_summer, inventory_count, published, sort_order) values
  ('f0000001-0000-0000-0000-000000000001', 'Corsair RM850x PSU', 'corsair-rm850x-psu', '80 Plus Gold modular power supply with quiet fan and full protection suite.', 129.99, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb101', '22222222-2222-2222-2222-222222222201', 'New', true, true, false, 18, true, 0),
  ('f0000001-0000-0000-0000-000000000002', 'ASUS ROG Strix B650-E', 'asus-rog-strix-b650e', 'AM5 ATX motherboard with PCIe 5.0, WiFi 6E, and robust VRM cooling.', 289.99, 'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=600', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb102', '22222222-2222-2222-2222-222222222201', 'Bestseller', true, true, false, 12, true, 1),
  ('f0000001-0000-0000-0000-000000000003', 'Corsair Vengeance 32GB DDR5', 'corsair-vengeance-32gb-ddr5', '32GB (2×16GB) DDR5-6000 kit optimized for AMD and Intel platforms.', 119.99, 'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=600', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb103', '22222222-2222-2222-2222-222222222202', 'Deal', false, false, true, 30, true, 2),
  ('f0000001-0000-0000-0000-000000000004', 'AMD Ryzen 7 7800X3D', 'amd-ryzen-7-7800x3d', '8-core gaming processor with 3D V-Cache for exceptional frame rates.', 449.99, 'https://images.unsplash.com/photo-1555618256-3c9d3e08750f?w=600&q=80', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb104', '22222222-2222-2222-2222-222222222201', 'Hot', true, true, false, 9, true, 3),
  ('f0000001-0000-0000-0000-000000000005', 'Astor Phantom Gaming PC', 'astor-phantom-gaming-pc', 'Pre-built RTX 4070 rig with Ryzen 7, 32GB RAM, and 1TB NVMe SSD.', 1599.99, 'https://images.unsplash.com/photo-1587202372775-e229f172b9b7?w=600&q=80', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb105', '22222222-2222-2222-2222-222222222201', 'Premium', true, true, false, 5, true, 4),
  ('f0000001-0000-0000-0000-000000000006', 'MSI GeForce RTX 4070 Ti Super', 'msi-rtx-4070-ti-super', 'Triple-fan cooling, 12GB GDDR6X, ideal for 1440p and 4K gaming.', 799.99, 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&q=80', 'cccccccc-cccc-cccc-cccc-cccccccccc01', '22222222-2222-2222-2222-222222222201', 'New', true, true, false, 8, true, 5),
  ('f0000001-0000-0000-0000-000000000007', 'Zotac RTX 4060 Twin Edge', 'zotac-rtx-4060-twin-edge', 'Compact dual-fan GPU for efficient 1080p gaming builds.', 299.99, 'https://images.unsplash.com/photo-1587202372775-e229f172b9b7?w=600&q=80', 'cccccccc-cccc-cccc-cccc-cccccccccc02', '22222222-2222-2222-2222-222222222202', 'Deal', false, false, true, 15, true, 6),
  ('f0000001-0000-0000-0000-000000000008', 'Gigabyte RTX 4080 Super Aero', 'gigabyte-rtx-4080-super-aero', '16GB GDDR6X with advanced cooling for demanding creators and gamers.', 1099.99, 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&q=80', 'cccccccc-cccc-cccc-cccc-cccccccccc03', '22222222-2222-2222-2222-222222222201', 'Pro', true, false, false, 6, true, 7),
  ('f0000001-0000-0000-0000-000000000009', 'iPhone 15 Pro', 'iphone-15-pro', 'Titanium design, A17 Pro chip, and advanced camera system.', 999.99, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80', 'dddddddd-dddd-dddd-dddd-dddddddddd01', '22222222-2222-2222-2222-222222222201', 'New', true, true, false, 20, true, 8),
  ('f0000001-0000-0000-0000-000000000010', 'Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', '200MP camera, S Pen support, and vivid AMOLED display.', 1199.99, 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80', 'dddddddd-dddd-dddd-dddd-dddddddddd02', '22222222-2222-2222-2222-222222222201', 'Flagship', true, true, false, 14, true, 9),
  ('f0000001-0000-0000-0000-000000000011', 'Google Pixel 8 Pro', 'google-pixel-8-pro', 'Pure Android with exceptional computational photography.', 899.99, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80', 'dddddddd-dddd-dddd-dddd-dddddddddd03', '22222222-2222-2222-2222-222222222202', 'Deal', false, false, true, 11, true, 10),
  ('f0000001-0000-0000-0000-000000000012', 'OnePlus 12', 'oneplus-12', 'Snapdragon 8 Gen 3, fast charging, and smooth 120Hz display.', 799.99, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80', 'dddddddd-dddd-dddd-dddd-dddddddddd04', '22222222-2222-2222-2222-222222222201', 'Value', false, true, false, 16, true, 11),
  ('f0000001-0000-0000-0000-000000000013', 'Nintendo Switch OLED', 'nintendo-switch-oled', '7-inch OLED screen with enhanced audio and versatile play modes.', 349.99, 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=600&q=80', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', '22222222-2222-2222-2222-222222222202', 'Deal', true, false, true, 22, true, 12),
  ('f0000001-0000-0000-0000-000000000014', 'PlayStation 5 Slim', 'playstation-5-slim', 'Next-gen gaming with ultra-fast SSD and DualSense controller.', 499.99, 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&q=80', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02', '22222222-2222-2222-2222-222222222201', 'Hot', true, true, false, 7, true, 13),
  ('f0000001-0000-0000-0000-000000000015', 'Xbox Series X', 'xbox-series-x', '12 teraflops of power with Quick Resume and Game Pass ready.', 499.99, 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=600&q=80', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03', '22222222-2222-2222-2222-222222222201', 'Bestseller', true, false, false, 10, true, 14)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  image_url = excluded.image_url,
  category_id = excluded.category_id,
  collection_id = excluded.collection_id,
  badge = excluded.badge,
  is_featured = excluded.is_featured,
  is_new = excluded.is_new,
  is_summer = excluded.is_summer,
  inventory_count = excluded.inventory_count,
  published = excluded.published,
  sort_order = excluded.sort_order;
