import { buildSitemapXml, fetchSitemapUrls } from '../../src/lib/seo/buildSitemap'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? ''

  const urls = supabaseUrl && anonKey
    ? await fetchSitemapUrls(supabaseUrl, anonKey)
    : [
        { loc: '/', changefreq: 'daily', priority: '1.0' },
        { loc: '/search', changefreq: 'weekly', priority: '0.5' },
      ]

  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'public, max-age=3600')
  return buildSitemapXml(url.origin, urls)
})
