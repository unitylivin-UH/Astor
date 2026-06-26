import { tryGetSupabase } from '@/integrations/supabase/client'

export type SettingEntry = { key: string; value: string; isNew?: boolean }

export function getSettingValue(entries: SettingEntry[], key: string, fallback = '') {
  return entries.find((e) => e.key === key)?.value ?? fallback
}

export function patchSetting(entries: SettingEntry[], key: string, value: string): SettingEntry[] {
  const idx = entries.findIndex((e) => e.key === key)
  if (idx >= 0) return entries.map((e, i) => (i === idx ? { ...e, value } : e))
  return [...entries, { key, value, isNew: true }]
}

export async function upsertSiteSettings(keys: string[], entries: SettingEntry[]) {
  const sb = tryGetSupabase()
  const rows = keys.map((key) => ({
    key,
    value: getSettingValue(entries, key),
    updated_at: new Date().toISOString(),
  }))
  const { error } = await sb.from('site_settings').upsert(rows)
  if (error) throw new Error(error.message)
}

export const MANAGED_SETTING_KEYS = [
  'favicon_url',
  'logo_dark_url',
  'logo_light_url',
  'hero_bg_desktop',
  'hero_bg_tablet',
  'hero_bg_mobile',
  'currency_code',
  'currency_locale',
  'contact_phone',
  'contact_whatsapp',
  'contact_whatsapp_message',
  'floating_whatsapp_enabled',
  'email_brand_color',
  'email_footer_text',
  'email_from_name',
  'store_url',
  'default_delivery_info',
] as const

export function isManagedSettingKey(key: string) {
  return (MANAGED_SETTING_KEYS as readonly string[]).includes(key)
}
