import { cn } from '@/lib/utils'

type TextMarqueeProps = {
  text: string
  className?: string
  separator?: string
}

export function TextMarquee({ text, className, separator = '✦' }: TextMarqueeProps) {
  const segment = (
    <span className="inline-flex shrink-0 items-center gap-6 px-6">
      <span className="font-display text-sm font-extrabold uppercase tracking-[0.2em] md:text-base">{text}</span>
      <span className="text-xs opacity-60" aria-hidden>
        {separator}
      </span>
    </span>
  )

  return (
    <div className={cn('overflow-hidden border-t border-white/10 bg-white py-3 text-text-brown', className)}>
      <div className="marquee-track flex w-max">
        {segment}
        {segment}
        {segment}
        {segment}
      </div>
    </div>
  )
}
