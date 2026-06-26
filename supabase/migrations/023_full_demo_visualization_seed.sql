-- Full demo visualization: complete product fields, variants, demo customers, orders, reviews

create extension if not exists pgcrypto;

-- ── Demo customer UUIDs (fixed for idempotent re-runs) ───────────────────────
-- Password for all demo accounts: Demo123!
-- Emails: ian.demo@astor.example, sarah.demo@astor.example, marcus.demo@astor.example,
--         emma.demo@astor.example, alex.demo@astor.example

-- Clean prior demo commerce data
delete from public.product_reviews
where user_id in (
  'd1111111-1111-1111-1111-111111111101',
  'd1111111-1111-1111-1111-111111111102',
  'd1111111-1111-1111-1111-111111111103',
  'd1111111-1111-1111-1111-111111111104',
  'd1111111-1111-1111-1111-111111111105'
);

delete from public.order_items
where order_id in (select id from public.orders where order_number like 'AST-DEMO-%');

delete from public.orders where order_number like 'AST-DEMO-%';

delete from auth.identities
where user_id in (
  'd1111111-1111-1111-1111-111111111101',
  'd1111111-1111-1111-1111-111111111102',
  'd1111111-1111-1111-1111-111111111103',
  'd1111111-1111-1111-1111-111111111104',
  'd1111111-1111-1111-1111-111111111105'
);

delete from auth.users
where id in (
  'd1111111-1111-1111-1111-111111111101',
  'd1111111-1111-1111-1111-111111111102',
  'd1111111-1111-1111-1111-111111111103',
  'd1111111-1111-1111-1111-111111111104',
  'd1111111-1111-1111-1111-111111111105'
);

-- ── Demo auth users ───────────────────────────────────────────────────────────
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
(
  'd1111111-1111-1111-1111-111111111101',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'ian.demo@astor.example',
  crypt('Demo123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"first_name":"Ian"}'::jsonb,
  now(), now()
),
(
  'd1111111-1111-1111-1111-111111111102',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'sarah.demo@astor.example',
  crypt('Demo123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"first_name":"Sarah"}'::jsonb,
  now(), now()
),
(
  'd1111111-1111-1111-1111-111111111103',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'marcus.demo@astor.example',
  crypt('Demo123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"first_name":"Marcus"}'::jsonb,
  now(), now()
),
(
  'd1111111-1111-1111-1111-111111111104',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'emma.demo@astor.example',
  crypt('Demo123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"first_name":"Emma"}'::jsonb,
  now(), now()
),
(
  'd1111111-1111-1111-1111-111111111105',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'alex.demo@astor.example',
  crypt('Demo123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"first_name":"Alex"}'::jsonb,
  now(), now()
);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values
(
  'd2222222-2222-2222-2222-222222222201',
  'd1111111-1111-1111-1111-111111111101',
  'd1111111-1111-1111-1111-111111111101',
  '{"sub":"d1111111-1111-1111-1111-111111111101","email":"ian.demo@astor.example"}'::jsonb,
  'email', now(), now(), now()
),
(
  'd2222222-2222-2222-2222-222222222202',
  'd1111111-1111-1111-1111-111111111102',
  'd1111111-1111-1111-1111-111111111102',
  '{"sub":"d1111111-1111-1111-1111-111111111102","email":"sarah.demo@astor.example"}'::jsonb,
  'email', now(), now(), now()
),
(
  'd2222222-2222-2222-2222-222222222203',
  'd1111111-1111-1111-1111-111111111103',
  'd1111111-1111-1111-1111-111111111103',
  '{"sub":"d1111111-1111-1111-1111-111111111103","email":"marcus.demo@astor.example"}'::jsonb,
  'email', now(), now(), now()
),
(
  'd2222222-2222-2222-2222-222222222204',
  'd1111111-1111-1111-1111-111111111104',
  'd1111111-1111-1111-1111-111111111104',
  '{"sub":"d1111111-1111-1111-1111-111111111104","email":"emma.demo@astor.example"}'::jsonb,
  'email', now(), now(), now()
),
(
  'd2222222-2222-2222-2222-222222222205',
  'd1111111-1111-1111-1111-111111111105',
  'd1111111-1111-1111-1111-111111111105',
  '{"sub":"d1111111-1111-1111-1111-111111111105","email":"alex.demo@astor.example"}'::jsonb,
  'email', now(), now(), now()
);

-- ── Complete remaining product fields (all 15 products) ───────────────────────
update public.products set
  description = '<p>The Corsair RM850x is a fully modular 850W PSU with 80 Plus Gold efficiency, ideal for high-end GPUs and multi-drive builds. Zero RPM mode keeps things silent at low loads.</p>',
  gallery_urls = '[
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
    "https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800"
  ]'::jsonb
where slug = 'corsair-rm850x-psu';

update public.products set
  description = '<p>ROG Strix B650-E pairs premium components with intelligent cooling and robust power delivery. WiFi 6E and 2.5G LAN keep you connected for work and play.</p>',
  gallery_urls = '[
    "https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80",
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80"
  ]'::jsonb
where slug = 'asus-rog-strix-b650e';

update public.products set
  gallery_urls = '[
    "https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.unsplash.com/photo-1555618256-3c9d3e08750f?w=800&q=80"
  ]'::jsonb
where slug = 'corsair-vengeance-32gb-ddr5';

update public.products set
  description = '<p>The 7800X3D is the go-to gaming CPU thanks to AMD 3D V-Cache. Drop it into an AM5 board with fast DDR5 for exceptional 1080p and 1440p performance.</p>',
  gallery_urls = '[
    "https://images.unsplash.com/photo-1555618256-3c9d3e08750f?w=800&q=80",
    "https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=800"
  ]'::jsonb
where slug = 'amd-ryzen-7-7800x3d';

update public.products set
  gallery_urls = '[
    "https://images.unsplash.com/photo-1587202372775-e229f172b9b7?w=800&q=80",
    "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80",
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80"
  ]'::jsonb
where slug = 'astor-phantom-gaming-pc';

update public.products set
  description = '<p>MSI''s RTX 4070 Ti Super features TORX Fan 5.0, a sturdy metal backplate, and excellent thermals for long gaming sessions. DLSS 3 and ray tracing ready.</p>',
  gallery_urls = '[
    "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80",
    "https://images.unsplash.com/photo-1587202372775-e229f172b9b7?w=800&q=80"
  ]'::jsonb
where slug = 'msi-rtx-4070-ti-super';

update public.products set
  description = '<p>Compact dual-fan design fits smaller cases without sacrificing cooling. Great value for 1080p high-refresh gaming and efficient HTPC builds.</p>',
  gallery_urls = '[
    "https://images.unsplash.com/photo-1587202372775-e229f172b9b7?w=800&q=80",
    "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80"
  ]'::jsonb
where slug = 'zotac-rtx-4060-twin-edge';

update public.products set
  description = '<p>Gigabyte''s Aero cooling solution keeps the RTX 4080 Super cool under creator workloads and 4K gaming. 16GB VRAM handles large textures and AI tasks.</p>',
  gallery_urls = '[
    "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80",
    "https://images.unsplash.com/photo-1587202372775-e229f172b9b7?w=800&q=80"
  ]'::jsonb
where slug = 'gigabyte-rtx-4080-super-aero';

update public.products set
  gallery_urls = '[
    "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80",
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
    "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&q=80"
  ]'::jsonb
where slug = 'samsung-galaxy-s24-ultra';

update public.products set
  description = '<p>Pixel 8 Pro brings Google''s best camera algorithms, clean Android, and seven years of updates. Magic Eraser and Night Sight remain class-leading.</p>',
  gallery_urls = '[
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
    "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&q=80"
  ]'::jsonb
where slug = 'google-pixel-8-pro';

update public.products set
  description = '<p>OnePlus 12 combines flagship specs with Hasselblad-tuned cameras and blazing 100W charging. Smooth OxygenOS and a gorgeous curved display.</p>',
  gallery_urls = '[
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
    "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80"
  ]'::jsonb
where slug = 'oneplus-12';

update public.products set
  description = '<p>The Switch OLED upgrades the handheld experience with a vibrant 7-inch panel and improved speakers. Play on the TV, tabletop, or on the go.</p>',
  gallery_urls = '[
    "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&q=80",
    "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80"
  ]'::jsonb
where slug = 'nintendo-switch-oled';

update public.products set
  description = '<p>PS5 Slim delivers the same next-gen performance in a smaller footprint. Ultra-fast SSD loading and immersive DualSense haptics included.</p>',
  gallery_urls = '[
    "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80",
    "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&q=80"
  ]'::jsonb
where slug = 'playstation-5-slim';

update public.products set
  description = '<p>Xbox Series X is the most powerful Xbox ever with 12 TFLOPS, Quick Resume, and full backward compatibility. Game Pass ready out of the box.</p>',
  gallery_urls = '[
    "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800&q=80",
    "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80"
  ]'::jsonb
where slug = 'xbox-series-x';

-- Ensure every product has at least 4 specs and overview
update public.products set specs = specs || '[{"key": "Warranty", "value": "Manufacturer limited"}]'::jsonb
where jsonb_array_length(coalesce(specs, '[]'::jsonb)) < 4;

update public.products set overview = coalesce(overview, '<p>Premium electronics from Astor — built for performance and reliability.</p>')
where overview is null or btrim(overview) = '';

-- ── Additional variants (phones, consoles, GPUs) ──────────────────────────────
delete from public.product_variants where product_id in (
  select id from public.products where slug in (
    'samsung-galaxy-s24-ultra', 'google-pixel-8-pro', 'oneplus-12',
    'nintendo-switch-oled', 'playstation-5-slim', 'xbox-series-x',
    'msi-rtx-4070-ti-super', 'zotac-rtx-4060-twin-edge'
  )
);

insert into public.product_variants (product_id, name, sku, price, compare_at_price, inventory_count, option_values, image_url, sort_order) values
(
  (select id from public.products where slug = 'samsung-galaxy-s24-ultra'),
  '256GB / Titanium Gray', 'AST-S24U-256-TG', 1199.99, 1299.99, 10,
  '{"Storage": "256GB", "Color": "Titanium Gray"}'::jsonb,
  'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80', 0
),
(
  (select id from public.products where slug = 'samsung-galaxy-s24-ultra'),
  '512GB / Titanium Black', 'AST-S24U-512-TB', 1399.99, 1499.99, 6,
  '{"Storage": "512GB", "Color": "Titanium Black"}'::jsonb, null, 1
),
(
  (select id from public.products where slug = 'google-pixel-8-pro'),
  '128GB / Obsidian', 'AST-PXL8P-128-OB', 899.99, 999.99, 12,
  '{"Storage": "128GB", "Color": "Obsidian"}'::jsonb, null, 0
),
(
  (select id from public.products where slug = 'google-pixel-8-pro'),
  '256GB / Porcelain', 'AST-PXL8P-256-PO', 999.99, 1099.99, 8,
  '{"Storage": "256GB", "Color": "Porcelain"}'::jsonb, null, 1
),
(
  (select id from public.products where slug = 'oneplus-12'),
  '256GB / Silky Black', 'AST-OP12-256-BK', 799.99, 899.99, 14,
  '{"Storage": "256GB", "Color": "Silky Black"}'::jsonb, null, 0
),
(
  (select id from public.products where slug = 'oneplus-12'),
  '512GB / Flowy Emerald', 'AST-OP12-512-EM', 899.99, 999.99, 9,
  '{"Storage": "512GB", "Color": "Flowy Emerald"}'::jsonb, null, 1
),
(
  (select id from public.products where slug = 'nintendo-switch-oled'),
  'Neon Red/Blue Joy-Con', 'AST-NSW-OLED-NEON', 349.99, 399.99, 18,
  '{"Color": "Neon Red/Blue"}'::jsonb,
  'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&q=80', 0
),
(
  (select id from public.products where slug = 'nintendo-switch-oled'),
  'White Joy-Con', 'AST-NSW-OLED-WHT', 349.99, 399.99, 12,
  '{"Color": "White"}'::jsonb, null, 1
),
(
  (select id from public.products where slug = 'playstation-5-slim'),
  'Disc Edition', 'AST-PS5-SLIM-DISC', 499.99, 549.99, 5,
  '{"Edition": "Disc"}'::jsonb,
  'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80', 0
),
(
  (select id from public.products where slug = 'playstation-5-slim'),
  'Digital Edition', 'AST-PS5-SLIM-DIG', 449.99, 499.99, 7,
  '{"Edition": "Digital"}'::jsonb, null, 1
),
(
  (select id from public.products where slug = 'xbox-series-x'),
  '1TB Console', 'AST-XSX-1TB', 499.99, 549.99, 8,
  '{"Storage": "1TB"}'::jsonb,
  'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800&q=80', 0
),
(
  (select id from public.products where slug = 'xbox-series-x'),
  '1TB + Extra Controller', 'AST-XSX-1TB-2PAD', 549.99, 599.99, 4,
  '{"Storage": "1TB", "Bundle": "Extra Controller"}'::jsonb, null, 1
),
(
  (select id from public.products where slug = 'msi-rtx-4070-ti-super'),
  'Gaming X Trio', 'AST-GPU-4070TIS-GXT', 799.99, 899.99, 6,
  '{"Model": "Gaming X Trio"}'::jsonb, null, 0
),
(
  (select id from public.products where slug = 'msi-rtx-4070-ti-super'),
  'Ventus 3X OC', 'AST-GPU-4070TIS-VOC', 779.99, 879.99, 4,
  '{"Model": "Ventus 3X OC"}'::jsonb, null, 1
),
(
  (select id from public.products where slug = 'zotac-rtx-4060-twin-edge'),
  'Twin Edge', 'AST-GPU-4060-TE', 299.99, 349.99, 12,
  '{"Model": "Twin Edge"}'::jsonb, null, 0
),
(
  (select id from public.products where slug = 'zotac-rtx-4060-twin-edge'),
  'Twin Edge OC White', 'AST-GPU-4060-TEW', 319.99, 369.99, 8,
  '{"Model": "Twin Edge OC White"}'::jsonb, null, 1
);

-- ── Demo orders (spread across last 30 days for dashboard charts) ─────────────
insert into public.orders (
  id, order_number, email, user_id, status, currency, subtotal, total,
  shipping_address, fulfillment_status, tracking_number, carrier, shipped_at, created_at
) values
(
  'e1000001-0000-0000-0000-000000000001', 'AST-DEMO-001',
  'ian.demo@astor.example', 'd1111111-1111-1111-1111-111111111101',
  'paid', 'USD', 999.99, 999.99,
  '{"line1":"42 Tech Lane","city":"Austin","state":"TX","postal_code":"78701","country":"US"}'::jsonb,
  'delivered', '1Z999AA10123456784', 'UPS', now() - interval '5 days',
  now() - interval '12 days'
),
(
  'e1000001-0000-0000-0000-000000000002', 'AST-DEMO-002',
  'ian.demo@astor.example', 'd1111111-1111-1111-1111-111111111101',
  'paid', 'USD', 799.99, 799.99,
  '{"line1":"42 Tech Lane","city":"Austin","state":"TX","postal_code":"78701","country":"US"}'::jsonb,
  'shipped', '9400111899223344556677', 'USPS', now() - interval '2 days',
  now() - interval '8 days'
),
(
  'e1000001-0000-0000-0000-000000000003', 'AST-DEMO-003',
  'sarah.demo@astor.example', 'd1111111-1111-1111-1111-111111111102',
  'paid', 'USD', 1599.99, 1599.99,
  '{"line1":"88 Builder Blvd","city":"Seattle","state":"WA","postal_code":"98101","country":"US"}'::jsonb,
  'processing', null, null, null,
  now() - interval '4 days'
),
(
  'e1000001-0000-0000-0000-000000000004', 'AST-DEMO-004',
  'sarah.demo@astor.example', 'd1111111-1111-1111-1111-111111111102',
  'quote_requested', 'USD', 249.98, 249.98,
  '{"line1":"88 Builder Blvd","city":"Seattle","state":"WA","postal_code":"98101","country":"US"}'::jsonb,
  'unfulfilled', null, null, null,
  now() - interval '2 days'
),
(
  'e1000001-0000-0000-0000-000000000005', 'AST-DEMO-005',
  'marcus.demo@astor.example', 'd1111111-1111-1111-1111-111111111103',
  'paid', 'USD', 739.98, 739.98,
  '{"line1":"15 Silicon Street","city":"Denver","state":"CO","postal_code":"80202","country":"US"}'::jsonb,
  'delivered', '1Z888BB20234567890', 'UPS', now() - interval '10 days',
  now() - interval '20 days'
),
(
  'e1000001-0000-0000-0000-000000000006', 'AST-DEMO-006',
  'marcus.demo@astor.example', 'd1111111-1111-1111-1111-111111111103',
  'paid', 'USD', 499.99, 499.99,
  '{"line1":"15 Silicon Street","city":"Denver","state":"CO","postal_code":"80202","country":"US"}'::jsonb,
  'shipped', '794611234567', 'FedEx', now() - interval '1 day',
  now() - interval '6 days'
),
(
  'e1000001-0000-0000-0000-000000000007', 'AST-DEMO-007',
  'emma.demo@astor.example', 'd1111111-1111-1111-1111-111111111104',
  'paid', 'USD', 1199.99, 1199.99,
  '{"line1":"7 Pixel Park","city":"Portland","state":"OR","postal_code":"97201","country":"US"}'::jsonb,
  'delivered', null, null, null,
  now() - interval '15 days'
),
(
  'e1000001-0000-0000-0000-000000000008', 'AST-DEMO-008',
  'emma.demo@astor.example', 'd1111111-1111-1111-1111-111111111104',
  'pending', 'USD', 899.99, 899.99,
  '{"line1":"7 Pixel Park","city":"Portland","state":"OR","postal_code":"97201","country":"US"}'::jsonb,
  'unfulfilled', null, null, null,
  now() - interval '1 day'
),
(
  'e1000001-0000-0000-0000-000000000009', 'AST-DEMO-009',
  'alex.demo@astor.example', 'd1111111-1111-1111-1111-111111111105',
  'paid', 'USD', 549.99, 549.99,
  '{"line1":"101 Console Court","city":"Chicago","state":"IL","postal_code":"60601","country":"US"}'::jsonb,
  'shipped', '1Z777CC30345678901', 'UPS', now() - interval '3 days',
  now() - interval '9 days'
),
(
  'e1000001-0000-0000-0000-000000000010', 'AST-DEMO-010',
  'alex.demo@astor.example', 'd1111111-1111-1111-1111-111111111105',
  'paid', 'USD', 349.99, 349.99,
  '{"line1":"101 Console Court","city":"Chicago","state":"IL","postal_code":"60601","country":"US"}'::jsonb,
  'delivered', null, null, null,
  now() - interval '25 days'
),
(
  'e1000001-0000-0000-0000-000000000011', 'AST-DEMO-011',
  'ian.demo@astor.example', 'd1111111-1111-1111-1111-111111111101',
  'paid', 'USD', 129.99, 129.99,
  '{"line1":"42 Tech Lane","city":"Austin","state":"TX","postal_code":"78701","country":"US"}'::jsonb,
  'delivered', null, null, null,
  now() - interval '18 days'
),
(
  'e1000001-0000-0000-0000-000000000012', 'AST-DEMO-012',
  'sarah.demo@astor.example', 'd1111111-1111-1111-1111-111111111102',
  'cancelled', 'USD', 1099.99, 1099.99,
  '{"line1":"88 Builder Blvd","city":"Seattle","state":"WA","postal_code":"98101","country":"US"}'::jsonb,
  'unfulfilled', null, null, null,
  now() - interval '3 days'
),
(
  'e1000001-0000-0000-0000-000000000013', 'AST-DEMO-013',
  'emma.demo@astor.example', 'd1111111-1111-1111-1111-111111111104',
  'paid', 'USD', 449.99, 449.99,
  '{"line1":"7 Pixel Park","city":"Portland","state":"OR","postal_code":"97201","country":"US"}'::jsonb,
  'delivered', null, null, null,
  now() - interval '7 days'
),
(
  'e1000001-0000-0000-0000-000000000014', 'AST-DEMO-014',
  'alex.demo@astor.example', 'd1111111-1111-1111-1111-111111111105',
  'paid', 'USD', 899.99, 899.99,
  '{"line1":"101 Console Court","city":"Chicago","state":"IL","postal_code":"60601","country":"US"}'::jsonb,
  'processing', null, null, null,
  now() - interval '1 day'
);

-- ── Order line items ──────────────────────────────────────────────────────────
insert into public.order_items (
  order_id, product_id, variant_id, variant_name, product_name, product_slug,
  image_url, unit_price, quantity, line_total
) values
-- Ian order 1: iPhone
(
  'e1000001-0000-0000-0000-000000000001',
  (select id from public.products where slug = 'iphone-15-pro'),
  (select id from public.product_variants where sku = 'AST-IPH15PRO-128-NT'),
  '128GB / Natural Titanium', 'iPhone 15 Pro', 'iphone-15-pro',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
  999.99, 1, 999.99
),
-- Ian order 2: MSI GPU
(
  'e1000001-0000-0000-0000-000000000002',
  (select id from public.products where slug = 'msi-rtx-4070-ti-super'),
  (select id from public.product_variants where sku = 'AST-GPU-4070TIS-GXT'),
  'Gaming X Trio', 'MSI GeForce RTX 4070 Ti Super', 'msi-rtx-4070-ti-super',
  'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&q=80',
  799.99, 1, 799.99
),
-- Sarah order 3: Gaming PC
(
  'e1000001-0000-0000-0000-000000000003',
  (select id from public.products where slug = 'astor-phantom-gaming-pc'),
  (select id from public.product_variants where sku = 'AST-PC-PHANTOM-1TB'),
  'RTX 4070 / 1TB', 'Astor Phantom Gaming PC', 'astor-phantom-gaming-pc',
  'https://images.unsplash.com/photo-1587202372775-e229f172b9b7?w=600&q=80',
  1599.99, 1, 1599.99
),
-- Sarah order 4: PSU + RAM quote
(
  'e1000001-0000-0000-0000-000000000004',
  (select id from public.products where slug = 'corsair-rm850x-psu'),
  null, null, 'Corsair RM850x PSU', 'corsair-rm850x-psu',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80',
  129.99, 1, 129.99
),
(
  'e1000001-0000-0000-0000-000000000004',
  (select id from public.products where slug = 'corsair-vengeance-32gb-ddr5'),
  (select id from public.product_variants where sku = 'AST-RAM-32-BK'),
  '32GB (2×16GB) Black', 'Corsair Vengeance 32GB DDR5', 'corsair-vengeance-32gb-ddr5',
  'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=600',
  119.99, 1, 119.99
),
-- Marcus order 5: CPU + Motherboard
(
  'e1000001-0000-0000-0000-000000000005',
  (select id from public.products where slug = 'amd-ryzen-7-7800x3d'),
  null, null, 'AMD Ryzen 7 7800X3D', 'amd-ryzen-7-7800x3d',
  'https://images.unsplash.com/photo-1555618256-3c9d3e08750f?w=600&q=80',
  449.99, 1, 449.99
),
(
  'e1000001-0000-0000-0000-000000000005',
  (select id from public.products where slug = 'asus-rog-strix-b650e'),
  null, null, 'ASUS ROG Strix B650-E', 'asus-rog-strix-b650e',
  'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=600',
  289.99, 1, 289.99
),
-- Marcus order 6: PS5
(
  'e1000001-0000-0000-0000-000000000006',
  (select id from public.products where slug = 'playstation-5-slim'),
  (select id from public.product_variants where sku = 'AST-PS5-SLIM-DISC'),
  'Disc Edition', 'PlayStation 5 Slim', 'playstation-5-slim',
  'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&q=80',
  499.99, 1, 499.99
),
-- Emma order 7: Samsung
(
  'e1000001-0000-0000-0000-000000000007',
  (select id from public.products where slug = 'samsung-galaxy-s24-ultra'),
  (select id from public.product_variants where sku = 'AST-S24U-256-TG'),
  '256GB / Titanium Gray', 'Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra',
  'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80',
  1199.99, 1, 1199.99
),
-- Emma order 8: Pixel (pending)
(
  'e1000001-0000-0000-0000-000000000008',
  (select id from public.products where slug = 'google-pixel-8-pro'),
  (select id from public.product_variants where sku = 'AST-PXL8P-128-OB'),
  '128GB / Obsidian', 'Google Pixel 8 Pro', 'google-pixel-8-pro',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
  899.99, 1, 899.99
),
-- Alex order 9: Xbox bundle
(
  'e1000001-0000-0000-0000-000000000009',
  (select id from public.products where slug = 'xbox-series-x'),
  (select id from public.product_variants where sku = 'AST-XSX-1TB-2PAD'),
  '1TB + Extra Controller', 'Xbox Series X', 'xbox-series-x',
  'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=600&q=80',
  549.99, 1, 549.99
),
-- Alex order 10: Switch
(
  'e1000001-0000-0000-0000-000000000010',
  (select id from public.products where slug = 'nintendo-switch-oled'),
  (select id from public.product_variants where sku = 'AST-NSW-OLED-NEON'),
  'Neon Red/Blue Joy-Con', 'Nintendo Switch OLED', 'nintendo-switch-oled',
  'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=600&q=80',
  349.99, 1, 349.99
),
-- Ian order 11: PSU
(
  'e1000001-0000-0000-0000-000000000011',
  (select id from public.products where slug = 'corsair-rm850x-psu'),
  null, null, 'Corsair RM850x PSU', 'corsair-rm850x-psu',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80',
  129.99, 1, 129.99
),
-- Sarah cancelled: Gigabyte GPU
(
  'e1000001-0000-0000-0000-000000000012',
  (select id from public.products where slug = 'gigabyte-rtx-4080-super-aero'),
  null, null, 'Gigabyte RTX 4080 Super Aero', 'gigabyte-rtx-4080-super-aero',
  'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&q=80',
  1099.99, 1, 1099.99
),
-- Emma order 13: Ryzen CPU
(
  'e1000001-0000-0000-0000-000000000013',
  (select id from public.products where slug = 'amd-ryzen-7-7800x3d'),
  null, null, 'AMD Ryzen 7 7800X3D', 'amd-ryzen-7-7800x3d',
  'https://images.unsplash.com/photo-1555618256-3c9d3e08750f?w=600&q=80',
  449.99, 1, 449.99
),
-- Alex order 14: OnePlus
(
  'e1000001-0000-0000-0000-000000000014',
  (select id from public.products where slug = 'oneplus-12'),
  (select id from public.product_variants where sku = 'AST-OP12-512-EM'),
  '512GB / Flowy Emerald', 'OnePlus 12', 'oneplus-12',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
  899.99, 1, 899.99
);

-- Extra paid orders so every product has at least one purchase for reviews
insert into public.orders (
  id, order_number, email, user_id, status, currency, subtotal, total,
  shipping_address, fulfillment_status, created_at
) values
(
  'e1000001-0000-0000-0000-000000000015', 'AST-DEMO-015',
  'ian.demo@astor.example', 'd1111111-1111-1111-1111-111111111101',
  'paid', 'USD', 299.99, 299.99,
  '{"line1":"42 Tech Lane","city":"Austin","state":"TX","postal_code":"78701","country":"US"}'::jsonb,
  'delivered', now() - interval '22 days'
),
(
  'e1000001-0000-0000-0000-000000000016', 'AST-DEMO-016',
  'sarah.demo@astor.example', 'd1111111-1111-1111-1111-111111111102',
  'paid', 'USD', 289.99, 289.99,
  '{"line1":"88 Builder Blvd","city":"Seattle","state":"WA","postal_code":"98101","country":"US"}'::jsonb,
  'delivered', now() - interval '19 days'
),
(
  'e1000001-0000-0000-0000-000000000017', 'AST-DEMO-017',
  'marcus.demo@astor.example', 'd1111111-1111-1111-1111-111111111103',
  'paid', 'USD', 119.99, 119.99,
  '{"line1":"15 Silicon Street","city":"Denver","state":"CO","postal_code":"80202","country":"US"}'::jsonb,
  'delivered', now() - interval '16 days'
),
(
  'e1000001-0000-0000-0000-000000000018', 'AST-DEMO-018',
  'emma.demo@astor.example', 'd1111111-1111-1111-1111-111111111104',
  'paid', 'USD', 799.99, 799.99,
  '{"line1":"7 Pixel Park","city":"Portland","state":"OR","postal_code":"97201","country":"US"}'::jsonb,
  'delivered', now() - interval '14 days'
),
(
  'e1000001-0000-0000-0000-000000000019', 'AST-DEMO-019',
  'alex.demo@astor.example', 'd1111111-1111-1111-1111-111111111105',
  'paid', 'USD', 1099.99, 1099.99,
  '{"line1":"101 Console Court","city":"Chicago","state":"IL","postal_code":"60601","country":"US"}'::jsonb,
  'delivered', now() - interval '11 days'
);

insert into public.order_items (
  order_id, product_id, variant_id, variant_name, product_name, product_slug,
  image_url, unit_price, quantity, line_total
) values
(
  'e1000001-0000-0000-0000-000000000015',
  (select id from public.products where slug = 'zotac-rtx-4060-twin-edge'),
  (select id from public.product_variants where sku = 'AST-GPU-4060-TE'),
  'Twin Edge', 'Zotac RTX 4060 Twin Edge', 'zotac-rtx-4060-twin-edge',
  'https://images.unsplash.com/photo-1587202372775-e229f172b9b7?w=600&q=80',
  299.99, 1, 299.99
),
(
  'e1000001-0000-0000-0000-000000000016',
  (select id from public.products where slug = 'asus-rog-strix-b650e'),
  null, null, 'ASUS ROG Strix B650-E', 'asus-rog-strix-b650e',
  'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=600',
  289.99, 1, 289.99
),
(
  'e1000001-0000-0000-0000-000000000017',
  (select id from public.products where slug = 'corsair-vengeance-32gb-ddr5'),
  (select id from public.product_variants where sku = 'AST-RAM-32-WH'),
  '32GB (2×16GB) White', 'Corsair Vengeance 32GB DDR5', 'corsair-vengeance-32gb-ddr5',
  'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=600',
  124.99, 1, 124.99
),
(
  'e1000001-0000-0000-0000-000000000018',
  (select id from public.products where slug = 'oneplus-12'),
  (select id from public.product_variants where sku = 'AST-OP12-256-BK'),
  '256GB / Silky Black', 'OnePlus 12', 'oneplus-12',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
  799.99, 1, 799.99
),
(
  'e1000001-0000-0000-0000-000000000019',
  (select id from public.products where slug = 'gigabyte-rtx-4080-super-aero'),
  null, null, 'Gigabyte RTX 4080 Super Aero', 'gigabyte-rtx-4080-super-aero',
  'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&q=80',
  1099.99, 1, 1099.99
);

-- ── Product reviews (approved on every product + 2 pending for admin moderation) ─
insert into public.product_reviews (product_id, user_id, order_id, rating, title, body, status, created_at) values
-- Ian
(
  (select id from public.products where slug = 'iphone-15-pro'),
  'd1111111-1111-1111-1111-111111111101',
  'e1000001-0000-0000-0000-000000000001',
  5, 'Best iPhone yet',
  'Titanium build feels premium and the camera is incredible in low light. Arrived quickly from Astor.',
  'approved', now() - interval '10 days'
),
(
  (select id from public.products where slug = 'msi-rtx-4070-ti-super'),
  'd1111111-1111-1111-1111-111111111101',
  'e1000001-0000-0000-0000-000000000002',
  4, 'Solid 1440p performer',
  'Runs cool and quiet. Only wish it was a bit cheaper, but performance is excellent.',
  'approved', now() - interval '6 days'
),
(
  (select id from public.products where slug = 'corsair-rm850x-psu'),
  'd1111111-1111-1111-1111-111111111101',
  'e1000001-0000-0000-0000-000000000011',
  5, 'Quiet and reliable',
  'Modular cables made the build clean. No coil whine under load.',
  'approved', now() - interval '16 days'
),
(
  (select id from public.products where slug = 'zotac-rtx-4060-twin-edge'),
  'd1111111-1111-1111-1111-111111111101',
  'e1000001-0000-0000-0000-000000000015',
  4, 'Great budget GPU',
  'Perfect for my son''s 1080p build. Compact and efficient.',
  'approved', now() - interval '20 days'
),
(
  (select id from public.products where slug = 'google-pixel-8-pro'),
  'd1111111-1111-1111-1111-111111111101',
  null, 5, 'Camera king',
  'Photos look amazing straight out of the box. Stock Android is a joy.',
  'pending', now() - interval '2 days'
),
-- Sarah
(
  (select id from public.products where slug = 'astor-phantom-gaming-pc'),
  'd1111111-1111-1111-1111-111111111102',
  'e1000001-0000-0000-0000-000000000003',
  5, 'Plug and play perfection',
  'Unboxed, connected, and was gaming in minutes. Cable management inside is tidy.',
  'approved', now() - interval '3 days'
),
(
  (select id from public.products where slug = 'asus-rog-strix-b650e'),
  'd1111111-1111-1111-1111-111111111102',
  'e1000001-0000-0000-0000-000000000016',
  5, 'Feature-rich board',
  'BIOS is easy to navigate and WiFi 6E speeds are great.',
  'approved', now() - interval '17 days'
),
(
  (select id from public.products where slug = 'corsair-vengeance-32gb-ddr5'),
  'd1111111-1111-1111-1111-111111111102',
  'e1000001-0000-0000-0000-000000000004',
  4, 'Fast RAM kit',
  'EXPO profile worked first try on my AM5 board.',
  'approved', now() - interval '1 day'
),
-- Marcus
(
  (select id from public.products where slug = 'amd-ryzen-7-7800x3d'),
  'd1111111-1111-1111-1111-111111111103',
  'e1000001-0000-0000-0000-000000000005',
  5, 'Gaming beast',
  'FPS gains in CPU-bound titles are noticeable. Worth the upgrade.',
  'approved', now() - interval '18 days'
),
(
  (select id from public.products where slug = 'playstation-5-slim'),
  'd1111111-1111-1111-1111-111111111103',
  'e1000001-0000-0000-0000-000000000006',
  5, 'Next-gen fun',
  'SSD load times are wild. DualSense adds so much to games.',
  'approved', now() - interval '5 days'
),
(
  (select id from public.products where slug = 'corsair-vengeance-32gb-ddr5'),
  'd1111111-1111-1111-1111-111111111103',
  'e1000001-0000-0000-0000-000000000017',
  5, 'White edition looks clean',
  'Matches my build aesthetic and runs stable at advertised speed.',
  'approved', now() - interval '14 days'
),
-- Emma
(
  (select id from public.products where slug = 'samsung-galaxy-s24-ultra'),
  'd1111111-1111-1111-1111-111111111104',
  'e1000001-0000-0000-0000-000000000007',
  5, 'S Pen is a game changer',
  'Display is stunning and the zoom camera is unreal for concerts.',
  'approved', now() - interval '13 days'
),
(
  (select id from public.products where slug = 'amd-ryzen-7-7800x3d'),
  'd1111111-1111-1111-1111-111111111104',
  'e1000001-0000-0000-0000-000000000013',
  4, 'Great chip',
  'Paired with a B650 board — temps are fine with a decent cooler.',
  'approved', now() - interval '6 days'
),
(
  (select id from public.products where slug = 'oneplus-12'),
  'd1111111-1111-1111-1111-111111111104',
  'e1000001-0000-0000-0000-000000000018',
  5, 'Charges insanely fast',
  '100W charging is no joke. Display is buttery smooth.',
  'approved', now() - interval '12 days'
),
-- Alex
(
  (select id from public.products where slug = 'xbox-series-x'),
  'd1111111-1111-1111-1111-111111111105',
  'e1000001-0000-0000-0000-000000000009',
  4, 'Powerful console',
  'Quick Resume is my favorite feature. Extra controller bundle was worth it.',
  'approved', now() - interval '7 days'
),
(
  (select id from public.products where slug = 'nintendo-switch-oled'),
  'd1111111-1111-1111-1111-111111111105',
  'e1000001-0000-0000-0000-000000000010',
  5, 'OLED screen shines',
  'Colors pop in handheld mode. Perfect for travel.',
  'approved', now() - interval '23 days'
),
(
  (select id from public.products where slug = 'oneplus-12'),
  'd1111111-1111-1111-1111-111111111105',
  'e1000001-0000-0000-0000-000000000014',
  4, 'Flagship feel',
  'Hasselblad colors look natural. OxygenOS is snappy.',
  'approved', now() - interval '1 day'
),
(
  (select id from public.products where slug = 'gigabyte-rtx-4080-super-aero'),
  'd1111111-1111-1111-1111-111111111105',
  'e1000001-0000-0000-0000-000000000019',
  5, 'Creator powerhouse',
  '16GB VRAM handles my Blender scenes without breaking a sweat.',
  'approved', now() - interval '9 days'
),
(
  (select id from public.products where slug = 'google-pixel-8-pro'),
  'd1111111-1111-1111-1111-111111111105',
  null, 3, 'Good but pricey',
  'Love the software experience. Battery could be better on heavy days.',
  'pending', now() - interval '1 day'
);

-- Second review per popular product (different user) for richer PDPs
insert into public.product_reviews (product_id, user_id, order_id, rating, title, body, status, created_at) values
(
  (select id from public.products where slug = 'iphone-15-pro'),
  'd1111111-1111-1111-1111-111111111104',
  null, 5, 'Upgrade from 13 Pro',
  'USB-C finally! Action button is handy for shortcuts.',
  'approved', now() - interval '8 days'
),
(
  (select id from public.products where slug = 'astor-phantom-gaming-pc'),
  'd1111111-1111-1111-1111-111111111103',
  null, 4, 'Worth the premium',
  'Pre-built quality is high. Would love more RGB control out of the box.',
  'approved', now() - interval '11 days'
),
(
  (select id from public.products where slug = 'msi-rtx-4070-ti-super'),
  'd1111111-1111-1111-1111-111111111105',
  null, 5, 'Thermals on point',
  'Stays under 70°C in my airflow case. Very impressed.',
  'approved', now() - interval '4 days'
),
(
  (select id from public.products where slug = 'samsung-galaxy-s24-ultra'),
  'd1111111-1111-1111-1111-111111111102',
  null, 4, 'Almost perfect',
  'S Pen integration is seamless. Phone is large but the screen rewards it.',
  'approved', now() - interval '9 days'
),
(
  (select id from public.products where slug = 'playstation-5-slim'),
  'd1111111-1111-1111-1111-111111111104',
  null, 5, 'Smaller footprint',
  'Fits my media cabinet better than the original PS5.',
  'approved', now() - interval '7 days'
);
