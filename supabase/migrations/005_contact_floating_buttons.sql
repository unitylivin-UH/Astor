-- Default contact numbers for floating call / WhatsApp buttons (editable in Admin → Site Settings)
insert into public.site_settings (key, value) values
  ('contact_phone', ''),
  ('contact_whatsapp', ''),
  ('contact_whatsapp_message', 'Hello! I have a question about Astor Electronics.')
on conflict (key) do nothing;
