-- Gap closure: order user linking, public RPC rate limits, contact email template.

-- Link orders to authenticated users when checkout provides user_id.
alter table public.orders add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists orders_user_id_idx on public.orders(user_id);

drop policy if exists "customer_read_own_orders" on public.orders;
create policy "customer_read_own_orders" on public.orders
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  );

-- Contact notification email (admin inbox for contact form).
insert into public.site_settings (key, value) values
  ('contact_notification_email', 'hello@astor.example')
on conflict (key) do nothing;

-- Rate-limited newsletter subscribe (identifier = email).
create or replace function public.rpc_subscribe_newsletter(p_email text, p_source text default 'homepage_footer')
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_rate jsonb;
begin
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return jsonb_build_object('ok', false, 'error', 'Invalid email');
  end if;

  v_rate := public.rpc_check_rate_limit('newsletter_subscribe', v_email, 5, 3600);
  if coalesce((v_rate->>'ok')::boolean, false) = false then
    return jsonb_build_object('ok', false, 'error', coalesce(v_rate->>'error', 'Too many attempts. Try again later.'));
  end if;

  insert into public.newsletter_subscribers (email, source)
  values (v_email, coalesce(p_source, 'homepage_footer'))
  on conflict (email) do nothing;

  return jsonb_build_object('ok', true);
end;
$$;

-- Contact form admin notification template.
insert into public.email_templates (template_key, name, description, subject, body_html) values
(
  'contact_form_admin',
  'Contact form (admin)',
  'Sent to your team when a customer submits the contact form.',
  'New contact message from {{customer_name}}',
  '<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3d3428;">You have a new contact form submission.</p>
<p style="margin:0 0 8px;font-size:14px;color:#6b5d4d;"><strong>From:</strong> {{customer_name}} ({{customer_email}})</p>
<div style="margin:16px 0;padding:16px;background:#faf8f5;border-radius:8px;border:1px solid #e8e0d4;">
  {{message_html}}
</div>
<p style="margin:16px 0 0;font-size:14px;color:#6b5d4d;">Reply directly to the customer at {{customer_email}}.</p>'
)
on conflict (template_key) do nothing;
