-- Ensure Google Pixel has approved reviews visible on storefront

insert into public.product_reviews (product_id, user_id, order_id, rating, title, body, status, created_at)
select
  p.id,
  'd1111111-1111-1111-1111-111111111104',
  'e1000001-0000-0000-0000-000000000008',
  5,
  'Pure Android done right',
  'Magic Eraser and Night Sight still impress. Seven years of updates is peace of mind.',
  'approved',
  now() - interval '5 days'
from public.products p
where p.slug = 'google-pixel-8-pro'
on conflict (product_id, user_id) do update set
  status = 'approved',
  rating = excluded.rating,
  title = excluded.title,
  body = excluded.body;
