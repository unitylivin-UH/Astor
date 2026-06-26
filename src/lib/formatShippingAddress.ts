type ShippingAddress = {
  line1?: string
  line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export function formatShippingAddress(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const addr = value as ShippingAddress
  const lines = [
    addr.line1,
    addr.line2,
    [addr.city, addr.state].filter(Boolean).join(', '),
    addr.postal_code,
    addr.country,
  ].filter((line) => Boolean(line?.trim()))

  return lines.length > 0 ? lines.join('\n') : null
}
