import { sanitizeMarketingHtml } from '@/lib/sanitizeHtml'
import { cn } from '@/lib/utils'

type RichTextContentProps = {
  html: string
  className?: string
}

export function RichTextContent({ html, className }: RichTextContentProps) {
  const safe = sanitizeMarketingHtml(html)
  if (!safe) return null
  return (
    <div
      className={cn(
        'prose prose-sm max-w-none text-text-brown prose-headings:font-extrabold prose-a:text-cta-brown prose-a:no-underline hover:prose-a:underline',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  )
}
