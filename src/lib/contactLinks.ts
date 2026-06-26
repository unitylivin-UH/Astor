/** Digits only for wa.me / tel links */
export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function toTelHref(phone: string): string | null {
  const digits = normalizePhoneDigits(phone)
  if (!digits) return null
  return `tel:+${digits}`
}

export function toWhatsAppHref(phone: string, message?: string): string | null {
  const digits = normalizePhoneDigits(phone)
  if (!digits) return null
  const base = `https://wa.me/${digits}`
  if (message?.trim()) {
    return `${base}?text=${encodeURIComponent(message.trim())}`
  }
  return base
}

export function getContactSettings(siteSettings: Record<string, string>) {
  const phone = siteSettings.contact_phone?.trim() ?? ''
  const whatsapp = siteSettings.contact_whatsapp?.trim() ?? ''
  const whatsappMessage = siteSettings.contact_whatsapp_message?.trim() ?? ''
  const floatingWhatsAppEnabled = siteSettings.floating_whatsapp_enabled !== 'false'
  return {
    phone,
    whatsapp,
    floatingWhatsAppEnabled,
    telHref: toTelHref(phone),
    whatsAppHref: floatingWhatsAppEnabled ? toWhatsAppHref(whatsapp, whatsappMessage) : null,
  }
}
