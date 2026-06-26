import { useEffect } from 'react'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SITE_KEYWORDS,
  buildHomeJsonLd,
} from '../../lib/seo'
import { SITE_URL } from '../../lib/site'

interface SeoProps {
  title?: string
  description?: string
  path?: string
  noindex?: boolean
}

function upsertMeta(name: string, content: string, property = false) {
  const attr = property ? 'property' : 'name'
  let el = document.head.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function Seo({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  noindex = false,
}: SeoProps) {
  const url = path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`

  useEffect(() => {
    document.documentElement.lang = 'en-GB'
    document.title = title

    upsertMeta('description', description)
    upsertMeta('keywords', SITE_KEYWORDS)
    upsertMeta(
      'robots',
      noindex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    )
    upsertMeta('og:title', title, true)
    upsertMeta('og:description', description, true)
    upsertMeta('og:url', url, true)
    upsertMeta('og:type', 'website', true)
    upsertMeta('og:site_name', 'MaSoVa', true)
    upsertMeta('og:locale', 'en_GB', true)
    upsertMeta('twitter:card', 'summary_large_image')
    upsertMeta('twitter:title', title)
    upsertMeta('twitter:description', description)

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = url

    document
      .querySelectorAll('script[data-seo-jsonld="home"]')
      .forEach((node) => node.remove())

    if (!noindex) {
      buildHomeJsonLd().forEach((schema) => {
        const script = document.createElement('script')
        script.type = 'application/ld+json'
        script.setAttribute('data-seo-jsonld', 'home')
        script.textContent = JSON.stringify(schema)
        document.head.appendChild(script)
      })
    }
  }, [title, description, url, noindex])

  return null
}