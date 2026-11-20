import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown, Globe, Menu, Search, Sparkles, X } from 'lucide-react'
import Brand from './Brand'
import SiteSearch from './SiteSearch'
import { useSite } from '../SiteContext'
import { SITE_LOCALES, SITE_LOCALE_NAMES, SITE_LOCALE_TAGS, countryPath, sitePath, type CountryCode, type SiteLocale, type SitePage } from '../locales'
import { MEGA_COLUMNS } from '../content/shared'
import { PAGE_ICONS, PageLink } from './Layout'

const TOP_LINKS: SitePage[] = ['ai', 'solutions', 'countries', 'pricing', 'about']
const ASIDE_LINKS: SitePage[] = ['product', 'pilot', 'faq', 'security']

interface NavProps {
  page: SitePage
  country?: CountryCode
}

function useLocalePath({ page, country }: NavProps) {
  return (code: SiteLocale) => (country ? countryPath(code, country) : sitePath(code, page))
}

function LanguageMenu(props: NavProps) {
  const { locale, copy } = useSite()
  const pathFor = useLocalePath(props)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="ms-lang" ref={ref}>
      <button
        type="button"
        className="ms-lang-btn"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`${copy.nav.language}: ${SITE_LOCALE_NAMES[locale]}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Globe size={16} aria-hidden="true" />
        <span>{locale.toUpperCase()}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <ul className="ms-lang-list">
          {SITE_LOCALES.map((code) => (
            <li key={code}>
              <Link
                to={pathFor(code)}
                lang={SITE_LOCALE_TAGS[code]}
                hrefLang={SITE_LOCALE_TAGS[code]}
                aria-current={code === locale ? 'true' : undefined}
                onClick={() => setOpen(false)}
              >
                {SITE_LOCALE_NAMES[code]}
                <span aria-hidden="true">{code.toUpperCase()}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function SiteNav(props: NavProps) {
  const { page } = props
  const { locale, copy } = useSite()
  const nav = copy.nav
  const pathFor = useLocalePath(props)
  const [scrolled, setScrolled] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const productRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLButtonElement>(null)
  const megaRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  /** True when a mouse hover opened the menu, so the click that follows does not close it again. */
  const openedByHover = useRef(false)
  /** True when the keyboard opened the menu, so focus moves into it. */
  const focusMegaOnOpen = useRef(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setMegaOpen(false)
        setDrawerOpen(false)
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!megaOpen) return
    const onDown = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setMegaOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setMegaOpen(false)
      productRef.current?.focus()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    if (focusMegaOnOpen.current) {
      focusMegaOnOpen.current = false
      megaRef.current?.querySelector<HTMLElement>('a')?.focus()
    }
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [megaOpen])

  useEffect(() => {
    if (!drawerOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const toggle = toggleRef.current
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false)
        return
      }
      // Keep keyboard focus inside the open drawer (it is a modal dialog).
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('a[href], button, summary')]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
      toggle?.focus()
    }
  }, [drawerOpen])

  const solid = scrolled || megaOpen
  const closeAll = () => {
    setMegaOpen(false)
    setDrawerOpen(false)
  }
  const closeSearch = () => {
    setSearchOpen(false)
    searchRef.current?.focus()
  }
  const label = (target: SitePage) => copy.pages[target].eyebrow
  const tagline = (target: SitePage) => (target in copy.areas.items ? copy.areas.items[target as keyof typeof copy.areas.items].tagline : copy.pages[target].heading)

  return (
    <header
      className="ms-nav"
      data-solid={solid}
      ref={headerRef}
      onMouseLeave={() => {
        openedByHover.current = false
        setMegaOpen(false)
      }}
      onBlur={(e) => {
        if (megaOpen && !e.currentTarget.contains(e.relatedTarget as Node | null)) setMegaOpen(false)
      }}
    >
      <div className="ms-wrap ms-nav-inner">
        <Link to={sitePath(locale)} aria-label={nav.home} onClick={closeAll}>
          <Brand />
        </Link>

        <nav className="ms-nav-links" aria-label={label('product')}>
          <button
            type="button"
            className="ms-nav-link"
            ref={productRef}
            aria-expanded={megaOpen}
            aria-controls="ms-mega"
            onPointerEnter={(e) => {
              if (e.pointerType !== 'mouse' || megaOpen) return
              openedByHover.current = true
              setMegaOpen(true)
            }}
            onClick={(e) => {
              if (openedByHover.current) {
                openedByHover.current = false
                return
              }
              if (!megaOpen && e.detail === 0) focusMegaOnOpen.current = true
              setMegaOpen(!megaOpen)
            }}
          >
            {label('product')}
            <ChevronDown size={15} aria-hidden="true" />
          </button>
          {TOP_LINKS.map((target) => (
            <PageLink key={target} page={target} className="ms-nav-link" onClick={closeAll} current={target === page}>
              <span onMouseEnter={() => setMegaOpen(false)}>{label(target)}</span>
            </PageLink>
          ))}
        </nav>

        <div className="ms-nav-actions">
          <button ref={searchRef} type="button" className="ms-nav-search" aria-label={nav.search.open} onClick={() => { closeAll(); setSearchOpen(true) }}>
            <Search size={17} aria-hidden="true" />
            <span>{nav.search.open}</span>
            <kbd aria-hidden="true">⌘K</kbd>
          </button>
          <LanguageMenu {...props} />
          <Link className="ms-nav-signin" to="/staff-login">{nav.signIn}</Link>
          <PageLink page="contact" className="ms-btn ms-btn--accent ms-btn--sm">{copy.ui.bookCta}</PageLink>
          <button
            ref={toggleRef}
            type="button"
            className="ms-nav-toggle"
            aria-label={nav.openMenu}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      {megaOpen && (
        <div className="ms-mega" id="ms-mega" ref={megaRef}>
          <div className="ms-wrap ms-mega-grid">
            {MEGA_COLUMNS.map((column, ci) => (
              <div key={nav.groups[ci]}>
                <p className="ms-mega-title">{nav.groups[ci]}</p>
                <ul>
                  {column.map((target) => {
                    const Icon = PAGE_ICONS[target] ?? Sparkles
                    return (
                      <li key={target}>
                        <PageLink className="ms-mega-item" page={target} onClick={closeAll} current={target === page}>
                          <span className="ms-mega-icon"><Icon size={18} aria-hidden="true" /></span>
                          <span>
                            <strong>{label(target)}</strong>
                            <span>{tagline(target)}</span>
                          </span>
                        </PageLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
            <div className="ms-mega-aside">
              <img src="/site/kitchen-chef.webp" alt="" width={300} height={128} loading="lazy" decoding="async" />
              <div>
                <p className="ms-mega-title">{nav.asideTitle}</p>
                {ASIDE_LINKS.map((target) => (
                  <PageLink key={target} page={target} onClick={closeAll}>
                    {label(target)}
                    <ArrowRight size={15} aria-hidden="true" />
                  </PageLink>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {drawerOpen && (
        <div className="ms-drawer" onClick={() => setDrawerOpen(false)}>
          <div
            ref={panelRef}
            className="ms-drawer-panel ms-on-dark"
            role="dialog"
            aria-modal="true"
            aria-label={nav.openMenu}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ms-drawer-top">
              <Brand />
              <button type="button" className="ms-nav-toggle ms-nav-toggle--show" aria-label={nav.closeMenu} onClick={() => setDrawerOpen(false)} autoFocus>
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <button type="button" className="ms-drawer-search" onClick={() => { closeAll(); setSearchOpen(true) }}>
              <Search size={18} aria-hidden="true" />
              {nav.search.placeholder}
            </button>
            {MEGA_COLUMNS.map((column, ci) => (
              <details key={nav.groups[ci]} open={ci === 0}>
                <summary>
                  {nav.groups[ci]}
                  <ChevronDown size={18} aria-hidden="true" />
                </summary>
                <ul>
                  {column.map((target) => (
                    <li key={target}><PageLink page={target} onClick={closeAll} current={target === page}>{label(target)}</PageLink></li>
                  ))}
                </ul>
              </details>
            ))}
            {(['product', ...TOP_LINKS.filter((t) => t !== 'ai'), 'pilot', 'faq'] as SitePage[]).map((target) => (
              <PageLink key={target} className="ms-drawer-link" page={target} onClick={closeAll} current={target === page}>{label(target)}</PageLink>
            ))}
            <p className="ms-mega-title ms-drawer-label">{nav.language}</p>
            <div className="ms-drawer-langs">
              {SITE_LOCALES.map((code) => (
                <Link
                  key={code}
                  to={pathFor(code)}
                  lang={SITE_LOCALE_TAGS[code]}
                  hrefLang={SITE_LOCALE_TAGS[code]}
                  aria-current={code === locale ? 'true' : undefined}
                  onClick={closeAll}
                >
                  {SITE_LOCALE_NAMES[code]}
                </Link>
              ))}
            </div>
            <div className="ms-drawer-actions">
              <Link className="ms-btn ms-btn--outline-dark" to="/staff-login">{nav.signIn}</Link>
              <PageLink className="ms-btn ms-btn--accent" page="contact" onClick={closeAll}>{copy.ui.bookCta}</PageLink>
            </div>
          </div>
        </div>
      )}

      {searchOpen && <SiteSearch onClose={closeSearch} />}
    </header>
  )
}
