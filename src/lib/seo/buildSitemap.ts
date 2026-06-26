type SitemapUrl = { loc: string; changefreq?: string; priority?: string }

export function buildSitemapXml(baseUrl: string, urls: SitemapUrl[]): string {
  const origin = baseUrl.replace(/\/$/, '')
  const body = urls
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(`${origin}${entry.loc.startsWith('/') ? entry.loc : `/${entry.loc}`}`)}</loc>${entry.changefreq ? `\n    <changefreq>${entry.changefreq}</changefreq>` : ''}${entry.priority ? `\n    <priority>${entry.priority}</priority>` : ''}
  </url>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function fetchSitemapUrls(supabaseUrl: string, anonKey: string): Promise<SitemapUrl[]> {
  const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
  const base: SitemapUrl[] = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/search', changefreq: 'weekly', priority: '0.5' },
    { loc: '/collection/all', changefreq: 'daily', priority: '0.9' },
  ]

  try {
    const [productsRes, collectionsRes, pagesRes, bundlesRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/products?select=slug,updated_at&published=eq.true&order=sort_order`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/collections?select=slug&is_active=eq.true`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/marketing_pages?select=slug&published=eq.true`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/product_bundles?select=slug&published=eq.true`, { headers }),
    ])

    const products = productsRes.ok ? ((await productsRes.json()) as { slug: string }[]) : []
    const collections = collectionsRes.ok ? ((await collectionsRes.json()) as { slug: string }[]) : []
    const pages = pagesRes.ok ? ((await pagesRes.json()) as { slug: string }[]) : []
    const bundles = bundlesRes.ok ? ((await bundlesRes.json()) as { slug: string }[]) : []

    return [
      ...base,
      { loc: '/bundles', changefreq: 'weekly', priority: '0.85' },
      ...products.map((p) => ({ loc: `/product/${p.slug}`, changefreq: 'weekly', priority: '0.8' })),
      ...bundles.map((b) => ({ loc: `/bundle/${b.slug}`, changefreq: 'weekly', priority: '0.8' })),
      ...collections.map((c) => ({ loc: `/collection/${c.slug}`, changefreq: 'weekly', priority: '0.7' })),
      ...pages.map((p) => ({ loc: `/pages/${p.slug}`, changefreq: 'monthly', priority: '0.6' })),
    ]
  } catch {
    return base
  }
}
