import { Link, type LinkProps } from '@tanstack/react-router'
import { isExternalHref, normalizeCmsHref, resolveStorefrontLink } from '@/lib/cmsLink'

type CmsLinkProps = Omit<LinkProps, 'to' | 'params'> & {
  href: string | null | undefined
}

export function CmsLink({ href, children, ...props }: CmsLinkProps) {
  const normalized = normalizeCmsHref(href)

  if (isExternalHref(normalized)) {
    const { className, style, target, rel, onClick, ...rest } = props
    return (
      <a
        href={normalized}
        className={className}
        style={style}
        target={target ?? '_blank'}
        rel={rel ?? 'noopener noreferrer'}
        onClick={onClick}
        {...rest}
      >
        {children}
      </a>
    )
  }

  const resolved = resolveStorefrontLink(normalized)

  if ('external' in resolved) {
    return null
  }

  return (
    <Link to={resolved.to} params={resolved.params} {...props}>
      {children}
    </Link>
  )
}
