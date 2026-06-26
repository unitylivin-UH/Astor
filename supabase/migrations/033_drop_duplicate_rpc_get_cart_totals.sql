-- Migration 029 defined rpc_get_cart_totals(jsonb, text).
-- Migration 030 added a 4-arg version with shipping/tax/coupon but CREATE OR REPLACE
-- does not replace a different signature, leaving two overloads. Named-parameter
-- calls with only p_items (+ optional p_currency) become ambiguous.

drop function if exists public.rpc_get_cart_totals(jsonb, text);

grant execute on function public.rpc_get_cart_totals(jsonb, text, text, text) to anon, authenticated;
