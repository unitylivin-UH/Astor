const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'blockquote', 'hr', 'span', 'div',
])

/** SSR-safe sanitizer for trusted CMS HTML (no jsdom / DOMPurify in the server bundle). */
export function sanitizeMarketingHtml(html: string) {
  if (!html.trim()) return ''

  let sanitized = html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?(?:iframe|object|embed|form|input|textarea|select|button)[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '')

  sanitized = sanitized.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag: string) => {
    const normalized = tag.toLowerCase()
    if (!ALLOWED_TAGS.has(normalized)) return ''
    if (match.startsWith('</')) return `</${normalized}>`

    if (normalized === 'a') {
      const href = match.match(/\shref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i)
      const safeHref = href?.[2] ?? href?.[3] ?? href?.[4] ?? ''
      if (safeHref.trim().toLowerCase().startsWith('javascript:')) return ''
      return safeHref ? `<a href="${safeHref.replace(/"/g, '&quot;')}" rel="noopener noreferrer">` : '<a>'
    }

    return `<${normalized}>`
  })

  return sanitized
}
