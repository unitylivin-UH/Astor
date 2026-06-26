-- Track admin "viewed" state for quote requests and form submissions.

alter table public.orders
  add column if not exists admin_viewed_at timestamptz;

alter table public.form_submissions
  add column if not exists admin_viewed_at timestamptz;

create or replace function public.rpc_get_admin_dashboard()
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_daily jsonb;
  v_weekly jsonb;
  v_monthly jsonb;
begin
  if not public.is_admin() then
    return jsonb_build_object('ok', false, 'error', 'Forbidden');
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'label', initcap(trim(to_char(d.day_date, 'Day'))),
      'short_label', to_char(d.day_date, 'Dy'),
      'date', d.day_date,
      'count', coalesce(o.cnt, 0),
      'is_current', d.day_date = current_date
    )
    order by d.day_date
  ), '[]'::jsonb)
  into v_daily
  from (
    select gs::date as day_date
    from generate_series(
      date_trunc('week', current_date)::date,
      date_trunc('week', current_date)::date + interval '6 days',
      interval '1 day'
    ) gs
  ) d
  left join lateral (
    select count(*)::int as cnt
    from public.orders ord
    where ord.created_at::date = d.day_date
  ) o on true;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'label', initcap(trim(to_char(d.day_date, 'Day'))),
      'short_label', to_char(d.day_date, 'Dy'),
      'date', d.day_date,
      'count', coalesce(o.cnt, 0),
      'is_current', d.day_date = current_date
    )
    order by d.day_date
  ), '[]'::jsonb)
  into v_weekly
  from (
    select gs::date as day_date
    from generate_series(
      current_date - interval '6 days',
      current_date,
      interval '1 day'
    ) gs
  ) d
  left join lateral (
    select count(*)::int as cnt
    from public.orders ord
    where ord.created_at::date = d.day_date
  ) o on true;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'label', to_char(m.month_start, 'Mon'),
      'year', extract(year from m.month_start)::int,
      'month', extract(month from m.month_start)::int,
      'count', coalesce(o.cnt, 0),
      'is_current', m.month_start = date_trunc('month', current_date)::date
    )
    order by m.month_start
  ), '[]'::jsonb)
  into v_monthly
  from (
    select gs::date as month_start
    from generate_series(
      (date_trunc('month', current_date) - interval '11 months')::date,
      date_trunc('month', current_date)::date,
      interval '1 month'
    ) gs
  ) m
  left join lateral (
    select count(*)::int as cnt
    from public.orders ord
    where date_trunc('month', ord.created_at)::date = m.month_start
  ) o on true;

  return jsonb_build_object(
    'ok', true,
    'counts', jsonb_build_object(
      'products', (select count(*) from public.products),
      'collections', (select count(*) from public.collections),
      'unread_quotes', (
        select count(*)
        from public.orders ord
        where ord.status = 'quote_requested'
          and ord.admin_viewed_at is null
      ),
      'unread_submissions', (
        select count(*)
        from public.form_submissions fs
        where fs.admin_viewed_at is null
      ),
      'media', (select count(*) from public.cms_media),
      'total_sales', coalesce((
        select sum(ord.total)
        from public.orders ord
        where ord.status not in ('failed', 'cancelled', 'refunded')
      ), 0)
    ),
    'recent_newsletter', coalesce((
      select jsonb_agg(to_jsonb(n) order by n.created_at desc)
      from (
        select ns.*
        from public.newsletter_subscribers ns
        order by ns.created_at desc
        limit 5
      ) n
    ), '[]'::jsonb),
    'order_chart', jsonb_build_object(
      'daily', v_daily,
      'weekly', v_weekly,
      'monthly', v_monthly
    )
  );
end;
$$;

grant execute on function public.rpc_get_admin_dashboard() to authenticated;
