import { useContext, useEffect } from 'react'
import { SeoCollectorContext, buildSeoHead, type SeoProps } from './seoHead'

export type { SeoAlternate, SeoProps } from './seoHead'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function Seo(props: SeoProps) {
  const collect = useContext(SeoCollectorContext)
  collect?.(props)

  const { title, description, path, noindex, lang, ogLocale, alternates, jsonLd } = props

  useEffect(() => {
    const head = buildSeoHead({ title, description, path, noindex, lang, ogLocale, alternates, jsonLd })
    document.documentElement.lang = head.lang
    document.title = head.title

    head.metas.forEach(({ attr, key, content }) => upsertMeta(attr, key, content))

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = head.canonical

    document.querySelectorAll('link[rel="alternate"][data-seo-hreflang]').forEach((node) => node.remove())
    head.alternates.forEach(({ hrefLang, href }) => {
      const link = document.createElement('link')
      link.rel = 'alternate'
      link.hreflang = hrefLang
      link.href = href
      link.setAttribute('data-seo-hreflang', '')
      document.head.appendChild(link)
    })

    document.querySelectorAll('script[data-seo-jsonld="home"]').forEach((node) => node.remove())
    head.jsonLd.forEach((schema) => {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.setAttribute('data-seo-jsonld', 'home')
      script.textContent = JSON.stringify(schema)
      document.head.appendChild(script)
    })
  }, [title, description, path, noindex, lang, ogLocale, alternates, jsonLd])

  return null
}
