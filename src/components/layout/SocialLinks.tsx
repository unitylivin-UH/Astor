import type { SocialLink } from '@/data/static-cms'
import { getSocialIcon } from '@/lib/socialIcons'
import { cn } from '@/lib/utils'

type SocialLinksProps = {
  links: SocialLink[]
  className?: string
  iconClassName?: string
}

export function SocialLinks({ links, className, iconClassName }: SocialLinksProps) {
  const active = links.filter((link) => link.isActive && link.href.trim())
  if (active.length === 0) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {active.map((link) => {
        const Icon = getSocialIcon(link.icon)
        const external = /^https?:\/\//i.test(link.href)
        return (
          <a
            key={link.id}
            href={link.href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            aria-label={link.label}
            title={link.label}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/16 bg-white/8 text-white/85 transition hover:border-white/30 hover:bg-white/14 hover:text-white"
          >
            <Icon className={cn('h-4 w-4', iconClassName)} aria-hidden />
          </a>
        )
      })}
    </div>
  )
}
