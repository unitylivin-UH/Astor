export default defineEventHandler((event) => {
  const origin = getRequestURL(event).origin
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return `User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`
})
