-- Enrich seed products with all catalog fields for storefront/admin visualization

-- ── Corsair RM850x PSU ──────────────────────────────────────────────────────
update public.products set
  overview = '<p>Reliable <strong>850W</strong> modular PSU for mid-to-high-end gaming and workstation builds. Quiet operation under load with full protection suite.</p>',
  description = '<p>The Corsair RM850x delivers clean, stable power for modern GPUs and multi-core CPUs. Fully modular cables keep your case tidy, while a 135mm rifle-bearing fan stays whisper-quiet at typical loads.</p><ul><li>80 Plus Gold efficiency</li><li>Fully modular cable set</li><li>10-year warranty</li></ul>',
  compare_at_price = 149.99,
  sku = 'AST-PSU-RM850X',
  weight_kg = 1.85,
  specs = '[
    {"key": "Wattage", "value": "850W"},
    {"key": "Efficiency", "value": "80 Plus Gold"},
    {"key": "Modular", "value": "Fully modular"},
    {"key": "Fan", "value": "135mm rifle bearing"}
  ]'::jsonb,
  gallery_urls = '[
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
    "https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800"
  ]'::jsonb,
  use_default_delivery = true,
  delivery_info = null
where slug = 'corsair-rm850x-psu';

-- ── ASUS ROG Strix B650-E ───────────────────────────────────────────────────
update public.products set
  overview = '<p>Flagship <strong>AM5 ATX motherboard</strong> with PCIe 5.0, WiFi 6E, and robust VRM cooling for Ryzen 7000 series.</p>',
  description = '<p>Built for enthusiasts who want premium connectivity and overclocking headroom. PCIe 5.0 M.2 and x16 slots future-proof your build.</p>',
  compare_at_price = 329.99,
  sku = 'AST-MB-B650E',
  weight_kg = 1.2,
  specs = '[
    {"key": "Socket", "value": "AM5"},
    {"key": "Chipset", "value": "AMD B650"},
    {"key": "WiFi", "value": "WiFi 6E"},
    {"key": "PCIe", "value": "Gen 5 x16 + M.2"}
  ]'::jsonb,
  gallery_urls = '[
    "https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80"
  ]'::jsonb,
  use_default_delivery = false,
  delivery_info = '<p><strong>Component shipping:</strong> Ships in anti-static packaging within 2 business days. Signature required on orders over $500.</p>'
where slug = 'asus-rog-strix-b650e';

-- ── Corsair Vengeance 32GB DDR5 ─────────────────────────────────────────────
update public.products set
  overview = '<p>High-speed <strong>DDR5-6000</strong> memory kit tuned for AMD EXPO and Intel XMP 3.0 profiles.</p>',
  description = '<p>32GB (2×16GB) capacity ideal for gaming, streaming, and content creation. Low-profile heat spreaders fit most air coolers.</p>',
  compare_at_price = 139.99,
  sku = 'AST-RAM-DDR5-32',
  weight_kg = 0.12,
  specs = '[
    {"key": "Capacity", "value": "32GB (2×16GB)"},
    {"key": "Speed", "value": "DDR5-6000"},
    {"key": "Timings", "value": "CL30"},
    {"key": "Voltage", "value": "1.35V"}
  ]'::jsonb,
  gallery_urls = '["https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  use_default_delivery = true
where slug = 'corsair-vengeance-32gb-ddr5';

-- ── AMD Ryzen 7 7800X3D ─────────────────────────────────────────────────────
update public.products set
  overview = '<p>The ultimate <strong>gaming CPU</strong> with 3D V-Cache technology for industry-leading frame rates.</p>',
  description = '<p>8 cores and 16 threads with 96MB L3 cache deliver exceptional performance in modern titles. Pair with AM5 and fast DDR5 for the best gaming experience.</p>',
  compare_at_price = 499.99,
  sku = 'AST-CPU-7800X3D',
  weight_kg = 0.05,
  specs = '[
    {"key": "Cores / Threads", "value": "8 / 16"},
    {"key": "Boost Clock", "value": "5.0 GHz"},
    {"key": "Cache", "value": "96MB L3 (3D V-Cache)"},
    {"key": "TDP", "value": "120W"}
  ]'::jsonb,
  gallery_urls = '["https://images.unsplash.com/photo-1555618256-3c9d3e08750f?w=800&q=80"]'::jsonb,
  use_default_delivery = true
where slug = 'amd-ryzen-7-7800x3d';

-- ── Astor Phantom Gaming PC ─────────────────────────────────────────────────
update public.products set
  overview = '<p>Pre-built powerhouse with <strong>RTX 4070</strong>, Ryzen 7, 32GB RAM, and 1TB NVMe — plug in and play.</p>',
  description = '<p>Hand-assembled and stress-tested before shipping. Tempered glass case, RGB fans, and Windows 11 Pro pre-installed. Ideal for 1440p ultra gaming.</p>',
  compare_at_price = 1799.99,
  sku = 'AST-PC-PHANTOM',
  weight_kg = 12.5,
  specs = '[
    {"key": "GPU", "value": "NVIDIA RTX 4070"},
    {"key": "CPU", "value": "AMD Ryzen 7"},
    {"key": "RAM", "value": "32GB DDR5"},
    {"key": "Storage", "value": "1TB NVMe SSD"}
  ]'::jsonb,
  gallery_urls = '[
    "https://images.unsplash.com/photo-1587202372775-e229f172b9b7?w=800&q=80",
    "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80"
  ]'::jsonb,
  use_default_delivery = false,
  delivery_info = '<p><strong>Pre-built PC delivery:</strong> Fully insured freight. Setup guide included. 48-hour burn-in before dispatch.</p>'
where slug = 'astor-phantom-gaming-pc';

-- ── MSI RTX 4070 Ti Super ───────────────────────────────────────────────────
update public.products set
  overview = '<p>Triple-fan <strong>RTX 4070 Ti Super</strong> with 12GB GDDR6X for smooth 1440p and capable 4K gaming.</p>',
  description = '<p>MSI TORX Fan 5.0 cooling, metal backplate, and DLSS 3 frame generation. Excellent thermals and acoustics under sustained load.</p>',
  compare_at_price = 899.99,
  sku = 'AST-GPU-4070TIS',
  weight_kg = 1.4,
  specs = '[
    {"key": "VRAM", "value": "12GB GDDR6X"},
    {"key": "Boost Clock", "value": "2610 MHz"},
    {"key": "Outputs", "value": "3× DisplayPort, 1× HDMI"},
    {"key": "TDP", "value": "285W"}
  ]'::jsonb,
  gallery_urls = '["https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&q=80"]'::jsonb,
  use_default_delivery = true
where slug = 'msi-rtx-4070-ti-super';

-- ── Remaining products (batch defaults + unique specs) ───────────────────────
update public.products set
  overview = '<p>Compact dual-fan GPU for efficient <strong>1080p gaming</strong> builds without breaking the budget.</p>',
  compare_at_price = 349.99,
  sku = 'AST-GPU-4060',
  weight_kg = 0.9,
  specs = '[{"key": "VRAM", "value": "8GB GDDR6"}, {"key": "TDP", "value": "115W"}]'::jsonb,
  gallery_urls = '["https://images.unsplash.com/photo-1587202372775-e229f172b9b7?w=800&q=80"]'::jsonb,
  use_default_delivery = true
where slug = 'zotac-rtx-4060-twin-edge';

update public.products set
  overview = '<p>Premium <strong>RTX 4080 Super</strong> with 16GB VRAM for creators and 4K gamers.</p>',
  compare_at_price = 1199.99,
  sku = 'AST-GPU-4080S',
  weight_kg = 1.6,
  specs = '[{"key": "VRAM", "value": "16GB GDDR6X"}, {"key": "TDP", "value": "320W"}]'::jsonb,
  use_default_delivery = true
where slug = 'gigabyte-rtx-4080-super-aero';

update public.products set
  overview = '<p>Apple''s titanium flagship with <strong>A17 Pro</strong> chip and pro camera system.</p>',
  description = '<p>Action button, USB-C, and all-day battery. The reference smartphone for mobile photography and performance.</p>',
  compare_at_price = 1099.99,
  sku = 'AST-IPH15PRO',
  weight_kg = 0.187,
  specs = '[{"key": "Display", "value": "6.1\" Super Retina XDR"}, {"key": "Chip", "value": "A17 Pro"}, {"key": "Storage options", "value": "128GB–1TB"}]'::jsonb,
  gallery_urls = '[
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
    "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80"
  ]'::jsonb,
  use_default_delivery = true
where slug = 'iphone-15-pro';

update public.products set
  overview = '<p>Samsung''s ultimate flagship with <strong>200MP camera</strong>, S Pen, and stunning AMOLED display.</p>',
  compare_at_price = 1299.99,
  sku = 'AST-S24U',
  weight_kg = 0.233,
  specs = '[{"key": "Display", "value": "6.8\" Dynamic AMOLED 2X"}, {"key": "S Pen", "value": "Included"}, {"key": "Battery", "value": "5000mAh"}]'::jsonb,
  use_default_delivery = true
where slug = 'samsung-galaxy-s24-ultra';

update public.products set
  overview = '<p>Pure Android with <strong>computational photography</strong> that rivals dedicated cameras.</p>',
  compare_at_price = 999.99,
  sku = 'AST-PXL8P',
  weight_kg = 0.213,
  specs = '[{"key": "Display", "value": "6.7\" LTPO OLED"}, {"key": "Updates", "value": "7 years OS"}]'::jsonb,
  use_default_delivery = true
where slug = 'google-pixel-8-pro';

update public.products set
  overview = '<p>Flagship killer with <strong>Snapdragon 8 Gen 3</strong> and 100W SUPERVOOC charging.</p>',
  compare_at_price = 899.99,
  sku = 'AST-OP12',
  weight_kg = 0.220,
  specs = '[{"key": "Display", "value": "6.82\" 120Hz LTPO"}, {"key": "Charging", "value": "100W wired"}]'::jsonb,
  use_default_delivery = true
where slug = 'oneplus-12';

update public.products set
  overview = '<p>Vibrant <strong>7\" OLED</strong> handheld for gaming at home or on the go.</p>',
  compare_at_price = 399.99,
  sku = 'AST-NSW-OLED',
  weight_kg = 0.42,
  specs = '[{"key": "Display", "value": "7\" OLED"}, {"key": "Storage", "value": "64GB"}, {"key": "Modes", "value": "TV / Tabletop / Handheld"}]'::jsonb,
  use_default_delivery = true
where slug = 'nintendo-switch-oled';

update public.products set
  overview = '<p>Sleeker PS5 with ultra-fast SSD and immersive <strong>DualSense</strong> haptics.</p>',
  compare_at_price = 549.99,
  sku = 'AST-PS5-SLIM',
  weight_kg = 2.6,
  specs = '[{"key": "Storage", "value": "1TB SSD"}, {"key": "Resolution", "value": "Up to 4K 120Hz"}]'::jsonb,
  use_default_delivery = false,
  delivery_info = '<p><strong>Console delivery:</strong> Ships in original manufacturer packaging with tracking. Allow 3–5 business days.</p>'
where slug = 'playstation-5-slim';

update public.products set
  overview = '<p>Most powerful Xbox with <strong>12 TFLOPS</strong>, Quick Resume, and Game Pass ready.</p>',
  compare_at_price = 549.99,
  sku = 'AST-XSX',
  weight_kg = 4.45,
  specs = '[{"key": "Storage", "value": "1TB SSD"}, {"key": "Resolution", "value": "Up to 4K 120Hz"}]'::jsonb,
  use_default_delivery = true
where slug = 'xbox-series-x';

-- ── Variants (phones, RAM, gaming PC) ───────────────────────────────────────
delete from public.product_variants where product_id in (
  select id from public.products where slug in (
    'iphone-15-pro', 'corsair-vengeance-32gb-ddr5', 'astor-phantom-gaming-pc'
  )
);

insert into public.product_variants (product_id, name, sku, price, compare_at_price, inventory_count, option_values, image_url, sort_order) values
(
  (select id from public.products where slug = 'iphone-15-pro'),
  '128GB / Natural Titanium', 'AST-IPH15PRO-128-NT', 999.99, 1099.99, 8,
  '{"Storage": "128GB", "Color": "Natural Titanium"}'::jsonb,
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80', 0
),
(
  (select id from public.products where slug = 'iphone-15-pro'),
  '256GB / Blue Titanium', 'AST-IPH15PRO-256-BT', 1099.99, 1199.99, 6,
  '{"Storage": "256GB", "Color": "Blue Titanium"}'::jsonb,
  'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80', 1
),
(
  (select id from public.products where slug = 'iphone-15-pro'),
  '512GB / Black Titanium', 'AST-IPH15PRO-512-BK', 1299.99, 1399.99, 4,
  '{"Storage": "512GB", "Color": "Black Titanium"}'::jsonb,
  null, 2
),
(
  (select id from public.products where slug = 'corsair-vengeance-32gb-ddr5'),
  '32GB (2×16GB) Black', 'AST-RAM-32-BK', 119.99, 139.99, 20,
  '{"Capacity": "32GB", "Color": "Black"}'::jsonb, null, 0
),
(
  (select id from public.products where slug = 'corsair-vengeance-32gb-ddr5'),
  '32GB (2×16GB) White', 'AST-RAM-32-WH', 124.99, 144.99, 15,
  '{"Capacity": "32GB", "Color": "White"}'::jsonb, null, 1
),
(
  (select id from public.products where slug = 'astor-phantom-gaming-pc'),
  'RTX 4070 / 1TB', 'AST-PC-PHANTOM-1TB', 1599.99, 1799.99, 3,
  '{"GPU": "RTX 4070", "Storage": "1TB"}'::jsonb,
  'https://images.unsplash.com/photo-1587202372775-e229f172b9b7?w=800&q=80', 0
),
(
  (select id from public.products where slug = 'astor-phantom-gaming-pc'),
  'RTX 4070 Ti / 2TB', 'AST-PC-PHANTOM-2TB', 1899.99, 2099.99, 2,
  '{"GPU": "RTX 4070 Ti", "Storage": "2TB"}'::jsonb,
  null, 1
);
