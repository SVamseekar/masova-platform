import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, FileText, Globe, ListChecks, Search, X } from 'lucide-react'
import { useSite } from '../SiteContext'
import { COUNTRY_CODES, PRODUCT_AREAS, SITE_PAGES, countryPath, sitePath } from '../locales'

interface Entry {
  kind: 'pages' | 'features' | 'countries'
  title: string
  text: string
  to: string
  haystack: string
}

/** Lower-case and strip accents so "cafe" finds "Café". */
function fold(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

const KIND_ICONS = { pages: FileText, features: ListChecks, countries: Globe } as const
const MAX_RESULTS = 12

/** Search across every page, feature and country of the site, in the current language. */
export default function SiteSearch({ onClose }: { onClose: () => void }) {
  const { copy, locale } = useSite()
  const s = copy.nav.search
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const entries = useMemo<Entry[]>(() => {
    const pages: Entry[] = SITE_PAGES.filter((page) => page !== 'home').map((page) => {
      const p = copy.pages[page]
      return { kind: 'pages', title: p.eyebrow, text: p.heading, to: sitePath(locale, page), haystack: fold(`${p.eyebrow} ${p.heading} ${p.lead}`) }
    })
    const features: Entry[] = PRODUCT_AREAS.flatMap((area) =>
      copy.areas.items[area].groups.flatMap((group, g) =>
        group.features.map((feature): Entry => ({
          kind: 'features',
          title: feature.title,
          text: `${copy.areas.items[area].label} · ${feature.text}`,
          to: `${sitePath(locale, area)}#g${g + 1}`,
          haystack: fold(`${feature.title} ${feature.text} ${group.title}`),
        })),
      ),
    )
    const assistants: Entry[] = copy.ai.assistants.map((assistant) => ({
      kind: 'features',
      title: assistant.name,
      text: `${copy.pages.ai.eyebrow} · ${assistant.does}`,
      to: `${sitePath(locale, 'ai')}#assistants`,
      haystack: fold(`${assistant.name} ${assistant.does}`),
    }))
    const countries: Entry[] = COUNTRY_CODES.map((code) => ({
      kind: 'countries',
      title: copy.countries.list[code].name,
      text: copy.countries.list[code].keep,
      to: countryPath(locale, code),
      haystack: fold(`${copy.countries.list[code].name} ${code}`),
    }))
    return [...pages, ...features, ...assistants, ...countries]
  }, [copy, locale])

  const results = useMemo(() => {
    const words = fold(query).split(/\s+/).filter(Boolean)
    if (!words.length) return entries.filter((entry) => entry.kind === 'pages').slice(0, MAX_RESULTS)
    return entries.filter((entry) => words.every((word) => entry.haystack.includes(word))).slice(0, MAX_RESULTS)
  }, [entries, query])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    inputRef.current?.focus()
    return () => { document.body.style.overflow = previous }
  }, [])

  useEffect(() => setActive(0), [query])

  const go = (entry: Entry | undefined) => {
    if (!entry) return
    onClose()
    navigate(entry.to)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = (active + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % Math.max(results.length, 1)
      setActive(next)
      listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(results[active])
    } else if (e.key === 'Tab') {
      // The dialog has two stops: the field and the close button.
      const close = e.currentTarget.querySelector<HTMLButtonElement>('.ms-search-close')
      if (document.activeElement === inputRef.current) close?.focus()
      else inputRef.current?.focus()
      e.preventDefault()
    }
  }

  return (
    <div className="ms-search" onClick={onClose}>
      <div className="ms-search-panel" role="dialog" aria-modal="true" aria-label={s.open} onClick={(e) => e.stopPropagation()} onKeyDown={onKeyDown}>
        <div className="ms-search-field">
          <Search size={20} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={s.placeholder}
            aria-label={s.placeholder}
            role="combobox"
            aria-expanded="true"
            aria-controls="ms-search-results"
            aria-activedescendant={results[active] ? `ms-search-${active}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" className="ms-search-close" aria-label={s.close} onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {results.length ? (
          <ul className="ms-search-results" id="ms-search-results" role="listbox" ref={listRef}>
            {results.map((entry, i) => {
              const Icon = KIND_ICONS[entry.kind]
              return (
                <li
                  key={`${entry.to}-${entry.title}`}
                  id={`ms-search-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(entry)}
                >
                  <span className="ms-search-icon"><Icon size={17} aria-hidden="true" /></span>
                  <span className="ms-search-text">
                    <strong>{entry.title}</strong>
                    <span>{entry.text}</span>
                  </span>
                  <small>{s[entry.kind]}</small>
                  <CornerDownLeft size={15} aria-hidden="true" className="ms-search-enter" />
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="ms-search-empty" role="status">{s.empty}</p>
        )}
      </div>
    </div>
  )
}
