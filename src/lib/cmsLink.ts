import type { LinkProps } from '@tanstack/react-router'

type InternalLinkProps = Pick<LinkProps, 'to' | 'params' | 'search' | 'hash'>

export function normalizeCmsHref(href: string | null | undefined): string {
  const trimmed = (href ?? '').trim()
  if (!trimmed) return '/'
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

export function isExternalHref(href: string): boolean {
  return /^(https?:|mailto:|tel:)/i.test(href)
}

/** Map CMS href strings to typed TanStack Router link targets. */
export function resolveStorefrontLink(href: string | null | undefined): InternalLinkProps | { external: true; href: string } {
  const normalized = normalizeCmsHref(href)

  if (isExternalHref(normalized)) {
    return { external: true, href: normalized }
  }

  const productMatch = normalized.match(/^\/product\/([^/?#]+)/)
  if (productMatch) {
    return { to: '/product/$slug', params: { slug: decodeURIComponent(productMatch[1]) } }
  }

  const collectionMatch = normalized.match(/^\/collection\/([^/?#]+)/)
  if (collectionMatch) {
    return { to: '/collection/$slug', params: { slug: decodeURIComponent(collectionMatch[1]) } }
  }

  const pageMatch = normalized.match(/^\/pages\/([^/?#]+)/)
  if (pageMatch) {
    return { to: '/pages/$slug', params: { slug: decodeURIComponent(pageMatch[1]) } }
  }

  return { to: normalized as InternalLinkProps['to'] }
}
