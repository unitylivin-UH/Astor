-- Demo coupon for launch
insert into public.coupons (code, description, discount_type, discount_value, min_subtotal, is_active)
values ('WELCOME10', '10% off your first order', 'percent', 10, 50, true)
on conflict (code) do nothing;
