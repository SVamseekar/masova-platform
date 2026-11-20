import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BarChart3, Bot, CalendarClock, ChefHat, CircleCheck, Gauge, HeartHandshake, MessageCircle, Mic,
  MonitorSmartphone, Package, Plug, ScrollText, ShieldCheck, ShoppingBag, Smartphone, Sparkles, Star, Store, Tablet,
  Tag, TrendingUp, Truck, UserRoundCheck, Users, Wallet, type LucideIcon,
} from 'lucide-react'
import { useSite } from '../SiteContext'
import { countryPath, sitePath, type CountryCode, type SitePage } from '../locales'
import type { AppStatus } from '../content/types'

/** Icon for each page that appears in menus, cards and search. */
export const PAGE_ICONS: Partial<Record<SitePage, LucideIcon>> = {
  ordering: ShoppingBag,
  counter: Wallet,
  kitchen: ChefHat,
  delivery: Truck,
  stock: Package,
  team: Users,
  guests: HeartHandshake,
  insights: BarChart3,
  ai: Sparkles,
  apps: MonitorSmartphone,
  integrations: Plug,
  compliance: ScrollText,
  security: ShieldCheck,
}

/** Same order as `ai.assistants` in the copy. */
export const ASSISTANT_ICONS: LucideIcon[] = [TrendingUp, Package, CalendarClock, Star, UserRoundCheck, Gauge, Tag, MessageCircle]

export const APP_ICONS: Record<string, LucideIcon> = {
  web: ShoppingBag,
  counter: Store,
  kiosk: Tablet,
  kds: ChefHat,
  driver: Truck,
  manager: BarChart3,
  agents: Sparkles,
  support: MessageCircle,
  'customer-app': Smartphone,
  'staff-app': MonitorSmartphone,
  copilot: Bot,
  voice: Mic,
}

/** Link to another site page in the current language. */
export function PageLink({ page, hash, className, style, children, onClick, current }: { page: SitePage; hash?: string; className?: string; style?: CSSProperties; children: ReactNode; onClick?: () => void; current?: boolean }) {
  const { locale } = useSite()
  return (
    <Link to={`${sitePath(locale, page)}${hash ? `#${hash}` : ''}`} className={className} style={style} onClick={onClick} aria-current={current ? 'page' : undefined}>
      {children}
    </Link>
  )
}

/** Link to a country page in the current language. */
export function CountryLink({ code, className, children, onClick, glow }: { code: CountryCode; className?: string; children: ReactNode; onClick?: () => void; glow?: boolean }) {
  const { locale } = useSite()
  return <Link to={countryPath(locale, code)} className={className} onClick={onClick} data-glow={glow ? '' : undefined}>{children}</Link>
}

export function SectionHead({ eyebrow, title, lead, id, center = false }: { eyebrow?: string; title: string; lead?: string; id: string; center?: boolean }) {
  return (
    <div className={center ? 'ms-head ms-head--center' : 'ms-head'} data-section-anchor data-rv>
      {eyebrow && <p className="ms-eyebrow">{eyebrow}</p>}
      <h2 className="ms-h2" id={id}>{title}</h2>
      {lead && <p className="ms-lead">{lead}</p>}
    </div>
  )
}

export function StatusChip({ status }: { status: AppStatus }) {
  const { copy } = useSite()
  const Icon = status === 'available' ? CircleCheck : status === 'early' ? CalendarClock : Sparkles
  return (
    <span className={`ms-chip ms-chip--${status}`}>
      <Icon size={13} aria-hidden="true" />
      {copy.ui.status[status]}
    </span>
  )
}

/** Dark header band at the top of every page except home. The nav floats over it. */
export function PageHeader({ page, image, imageAlt, heading, lead, eyebrow, children }: { page: SitePage; image?: string; imageAlt?: string; heading?: string; lead?: string; eyebrow?: ReactNode; children?: ReactNode }) {
  const { copy } = useSite()
  const p = copy.pages[page]
  return (
    <header className="ms-page-head ms-on-dark" data-has-image={Boolean(image)}>
      {image && (
        <div className="ms-page-head-media">
          <img src={image} alt={imageAlt ?? ''} width={1200} height={800} fetchPriority="high" decoding="async" />
        </div>
      )}
      <div className="ms-wrap ms-page-head-inner">
        <div className="ms-page-head-copy">
          <p className="ms-eyebrow">{eyebrow ?? p.eyebrow}</p>
          <h1 className="ms-page-title">{heading ?? p.heading}</h1>
          <p className="ms-lead">{lead ?? p.lead}</p>
          {children}
        </div>
      </div>
    </header>
  )
}

/** Closing call to action shown above the footer on every page. */
export function CtaBand({ page }: { page: SitePage }) {
  const { copy } = useSite()
  return (
    <section className="ms-cta ms-on-dark" aria-labelledby="ms-cta-title">
      <div className="ms-wrap ms-cta-inner" data-rv>
        <div>
          <h2 className="ms-h2" id="ms-cta-title">{copy.cta.title}</h2>
          <p className="ms-lead">{copy.cta.text}</p>
        </div>
        <div className="ms-cta-actions">
          <PageLink page="contact" className="ms-btn ms-btn--accent">
            {copy.ui.bookCta}
            <ArrowRight size={18} aria-hidden="true" />
          </PageLink>
          {page !== 'pilot' && <PageLink page="pilot" className="ms-btn ms-btn--outline-dark">{copy.cta.secondary}</PageLink>}
        </div>
      </div>
    </section>
  )
}

/**
 * Fades sections in as they scroll into view. Elements opt in with `data-rv`.
 * Without JavaScript, or when the visitor prefers reduced motion, everything is simply visible.
 */
export function useReveal(key: string) {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const nodes = [...document.querySelectorAll<HTMLElement>('#product-site [data-rv]')]
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute('data-reveal', 'shown')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    for (const node of nodes) {
      if (node.getBoundingClientRect().top < window.innerHeight * 0.92) {
        node.setAttribute('data-reveal', 'shown')
        continue
      }
      node.setAttribute('data-reveal', 'pending')
      observer.observe(node)
    }
    return () => {
      observer.disconnect()
      for (const node of nodes) node.removeAttribute('data-reveal')
    }
  }, [key])
}
