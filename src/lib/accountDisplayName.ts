import type { User } from '@supabase/supabase-js'

function capitalizeWord(value: string) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

export function getAccountFirstName(user: User): string | null {
  const meta = user.user_metadata as Record<string, unknown> | undefined

  const fromMeta =
    (typeof meta?.first_name === 'string' && meta.first_name.trim()) ||
    (typeof meta?.full_name === 'string' && meta.full_name.trim().split(/\s+/)[0]) ||
    (typeof meta?.name === 'string' && meta.name.trim().split(/\s+/)[0])

  if (fromMeta) return capitalizeWord(fromMeta)

  const emailLocal = user.email?.split('@')[0]?.split(/[._-]/)[0]
  return emailLocal ? capitalizeWord(emailLocal) : null
}

export function getAccountTitle(user: User): string {
  const firstName = getAccountFirstName(user)
  return firstName ? `${firstName}'s Account` : 'My Account'
}
