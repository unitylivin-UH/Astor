import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import { formatCurrency, getCurrencyFromSettings } from '@/lib/currency'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** @deprecated Use useFormatPrice() or formatCurrency() for dynamic currency */
export function formatPrice(value: number, currencyCode = 'USD', locale = 'en-US') {
  return formatCurrency(value, getCurrencyFromSettings({ currency_code: currencyCode, currency_locale: locale }))
}

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Homepage section keys (e.g. newly_dropped, final_cta) — hyphens or underscores. */
export const SECTION_KEY_REGEX = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function sectionKeyify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_\s-]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
}

function ordinalDay(day: number) {
  const mod100 = day % 100
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`
  switch (day % 10) {
    case 1:
      return `${day}st`
    case 2:
      return `${day}nd`
    case 3:
      return `${day}rd`
    default:
      return `${day}th`
  }
}

/** e.g. 24th May, 16th Aug */
export function formatOrdinalShortDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const month = date.toLocaleDateString('en-GB', { month: 'short' })
  return `${ordinalDay(date.getDate())} ${month}`
}
