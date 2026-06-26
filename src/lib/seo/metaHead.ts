import type { PageMeta } from '@/lib/seo'

export function buildHeadMeta(meta: PageMeta) {
  const tags: Array<Record<string, string>> = [
    { title: meta.title },
  ]
  if (meta.description) {
    tags.push({ name: 'description', content: meta.description })
    tags.push({ property: 'og:description', content: meta.description })
  }
  tags.push({ property: 'og:title', content: meta.title })
  tags.push({ property: 'og:type', content: 'website' })
  tags.push({ name: 'twitter:card', content: 'summary_large_image' })
  tags.push({ name: 'twitter:title', content: meta.title })
  if (meta.description) tags.push({ name: 'twitter:description', content: meta.description })
  if (meta.image) {
    tags.push({ property: 'og:image', content: meta.image })
    tags.push({ name: 'twitter:image', content: meta.image })
  }
  return { meta: tags }
}
