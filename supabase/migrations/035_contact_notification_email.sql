-- Route contact form notifications to the Astor inbox.
update public.site_settings
set value = 'info@astor.ae'
where key = 'contact_notification_email'
  and (value is null or trim(value) = '' or value = 'hello@astor.example');

insert into public.site_settings (key, value)
select 'contact_notification_email', 'info@astor.ae'
where not exists (
  select 1 from public.site_settings where key = 'contact_notification_email'
);
