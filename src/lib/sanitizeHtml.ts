import DOMPurify from 'isomorphic-dompurify'

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'blockquote', 'hr', 'span', 'div',
]

const ALLOWED_ATTR = ['href', 'title', 'target', 'rel', 'class']

export function sanitizeMarketingHtml(html: string) {
  if (!html.trim()) return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ['target'],
  })
}
