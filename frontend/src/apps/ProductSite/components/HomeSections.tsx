import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { useSite } from '../SiteContext'
import { PRODUCT_AREAS } from '../locales'
import { REGIONS, SITE_COUNTRIES } from '../content/shared'
import { ROLE_APPS } from './Previews'
import { ScenePaused } from './Devices'
import { AreaThumbScene, HeroPinsList, HeroTonightScene, JourneyAiScene, JourneyDriverScene, JourneyKitchenScene, JourneyManagerScene, JourneyOrderScene, RoleScene } from './scenes'
import { CountUp, useTilt } from './Effects'
import { CountryLink, PAGE_ICONS, PageLink, SectionHead } from './Layout'
import DecisionInbox from './DecisionInbox'

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    setReduced(Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches))
  }, [])
  return reduced
}

export function HeroSection() {
  const { copy } = useSite()
  const hero = copy.hero
  const reduced = useReducedMotion()
  const [stage, setStage] = useState(0)
  const last = hero.lifecycle.length - 1
  const artRef = useTilt<HTMLElement>()

  useEffect(() => {
    if (reduced) {
      setStage(last)
      return
    }
    const id = window.setInterval(() => setStage((s) => (s >= last ? 0 : s + 1)), 1900)
    return () => window.clearInterval(id)
  }, [reduced, last])

  return (
    <>
      <section className="ms-hero ms-on-dark" aria-labelledby="ms-hero-title">
        <div className="ms-hero-bg">
          <img src="/site/restaurant-interior.webp" alt="" width={1536} height={1024} fetchPriority="high" decoding="async" />
        </div>
        <div className="ms-hero-scrim" />
        <HeroTonightScene />

        <div className="ms-wrap ms-hero-grid">
          <div className="ms-hero-copy">
            <p className="ms-hero-eyebrow">
              <b>MaSoVa</b>
              <span>{hero.eyebrow}</span>
            </p>
            <h1 id="ms-hero-title">
              {hero.titleLead}
              <span>{hero.titleAccent}</span>
            </h1>
            <p className="ms-hero-sub">{hero.sub}</p>
            <div className="ms-hero-actions">
              <PageLink page="contact" className="ms-btn ms-btn--accent">
                {copy.ui.bookCta}
                <ArrowRight size={18} aria-hidden="true" />
              </PageLink>
              <a className="ms-btn ms-btn--outline-dark" href="#journey">{hero.secondary}</a>
            </div>
          </div>

          <figure className="ms-hero-art" ref={artRef}>
            <HeroPinsList />
            <figcaption className="ms-sr">{hero.previewLabel}</figcaption>
            <p className="pv-sample" aria-hidden="true">{copy.ui.sampleData}</p>
          </figure>
        </div>

        <div className="ms-wrap">
          <div className="ms-lifecycle">
            <h2>{hero.lifecycleLabel}</h2>
            <ol style={{ '--ms-progress': stage / last } as React.CSSProperties}>
              {hero.lifecycle.map((step, i) => (
                <li key={step} data-state={i < stage ? 'done' : i === stage ? 'now' : 'next'}>
                  <span className="ms-lifecycle-dot" aria-hidden="true">
                    {i < stage || (i === last && stage === last) ? <Check size={14} /> : <span className="ms-num">{i + 1}</span>}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <div className="ms-facts">
        <div className="ms-wrap">
          <ul>
            {copy.facts.map((fact) => (
              <li key={fact.label}>
                <strong className="ms-num"><CountUp value={fact.value} /></strong>
                <span>{fact.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}

function JourneyStage({ index }: { index: number }): ReactNode {
  switch (index) {
    case 0:
      return <JourneyOrderScene />
    case 1:
      return <JourneyKitchenScene />
    case 2:
      return <JourneyDriverScene />
    case 3:
      return <JourneyManagerScene />
    case 4:
      return <JourneyAiScene />
    default:
      return <div className="ms-stage-mid"><DecisionCard /></div>
  }
}

function DecisionCard() {
  const { copy } = useSite()
  const item = copy.ai.inbox.items[0]
  return (
    <div className="ms-proposal ms-proposal--static" aria-hidden="true">
      <h3>{item.title}</h3>
      <p>{item.body}</p>
      <p className="ms-proposal-action">{item.action}</p>
      <div className="ms-proposal-buttons">
        <span className="ms-btn ms-btn--forest ms-btn--sm"><Check size={16} />{copy.ai.inbox.approve}</span>
        <span className="ms-btn ms-btn--outline ms-btn--sm">{copy.ai.inbox.dismiss}</span>
      </div>
    </div>
  )
}

/**
 * The order story. On wide screens the preview stays in place while the steps scroll past it;
 * on narrow screens each step carries its own preview.
 */
export function JourneySection() {
  const { copy } = useSite()
  const journey = copy.journey
  const [active, setActive] = useState(0)
  const stepRefs = useRef<(HTMLLIElement | null)[]>([])

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index))
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    for (const node of stepRefs.current) if (node) observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="ms-section" id="journey" aria-labelledby="ms-journey-title">
      <div className="ms-wrap">
        <SectionHead id="ms-journey-title" eyebrow={journey.eyebrow} title={journey.title} lead={journey.lead} />
        <div className="ms-story">
          <ol className="ms-story-steps" style={{ '--ms-progress': active / (journey.steps.length - 1) } as React.CSSProperties}>
            {journey.steps.map((step, i) => (
              <li key={step.name} ref={(el) => { stepRefs.current[i] = el }} data-index={i} data-active={i === active} data-done={i < active}>
                <span className="ms-story-num ms-num" aria-hidden="true">{i + 1}</span>
                <div>
                  <span className="ms-chip ms-chip--app">{step.app}</span>
                  <h3>{step.name}</h3>
                  <p>{step.text}</p>
                  <figure className="ms-story-inline" aria-hidden="true"><JourneyStage index={i} /></figure>
                </div>
              </li>
            ))}
          </ol>
          <div className="ms-story-stage" aria-hidden="true">
            <div className="ms-story-frame">
              {journey.steps.map((step, i) => (
                <div key={step.name} className="ms-story-layer" data-active={i === active}>
                  {/* Faded-out layers still count as on screen, so pause them; the key restarts a scene from its first frame when its step comes up. */}
                  <ScenePaused value={i !== active}><JourneyStage key={String(i === active)} index={i} /></ScenePaused>
                </div>
              ))}
              <p className="ms-story-count ms-num">{copy.ui.stepLabel} {active + 1} / {journey.steps.length}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** The eight product areas as a grid of cards, each with a live preview. */
export function AreasGrid({ head = true }: { head?: boolean }) {
  const { copy } = useSite()
  const areas = copy.areas
  return (
    <section className="ms-section ms-section--alt" aria-labelledby="ms-areas-title">
      <div className="ms-wrap">
        {head ? <SectionHead id="ms-areas-title" eyebrow={areas.eyebrow} title={areas.title} lead={areas.lead} /> : <h2 className="ms-sr" id="ms-areas-title">{areas.title}</h2>}
        <ul className="ms-bento">
          {PRODUCT_AREAS.map((area, i) => {
            const item = areas.items[area]
            const Icon = PAGE_ICONS[area]
            return (
              <li key={area} className="ms-bento-card" data-glow data-rv style={{ '--rv-delay': `${(i % 4) * 60}ms` } as React.CSSProperties}>
                <PageLink page={area} className="ms-bento-link">
                  <div className="ms-bento-visual" aria-hidden="true"><AreaThumbScene area={area} /></div>
                  <div className="ms-bento-copy">
                    <span className="ms-bento-icon">{Icon && <Icon size={18} aria-hidden="true" />}</span>
                    <h3>{item.label}</h3>
                    <p>{item.tagline}</p>
                    <span className="ms-link">{copy.ui.explore}<ArrowRight size={16} aria-hidden="true" /></span>
                  </div>
                </PageLink>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export function AiHomeSection() {
  const { copy } = useSite()
  const ai = copy.ai.home
  return (
    <section className="ms-section ms-section--dark ms-on-dark" id="ai" aria-labelledby="ms-ai-title">
      <div className="ms-wrap">
        <SectionHead id="ms-ai-title" eyebrow={ai.eyebrow} title={ai.title} lead={ai.lead} />
        <DecisionInbox
          extra={(
            <PageLink page="ai" className="ms-inbox-extra">
              <strong>{copy.pages.ai.lead}</strong>
              <span>{ai.cta}<ArrowRight size={18} aria-hidden="true" /></span>
            </PageLink>
          )}
        />
      </div>
    </section>
  )
}

/** "A day with MaSoVa": pick a role, read what its day looks like and see the screen it works on. */
export function RolesSection({ head = true }: { head?: boolean }) {
  const { copy } = useSite()
  const [index, setIndex] = useState(0)
  const roles = copy.apps.roles
  const appKey = ROLE_APPS[index] ?? 'manager'
  const app = copy.apps.items.find((item) => item.key === appKey)
  return (
    <section className="ms-section" aria-labelledby="ms-roles-title">
      <div className="ms-wrap">
        {head
          ? <SectionHead id="ms-roles-title" eyebrow={copy.pages.apps.eyebrow} title={copy.pages.apps.heading} lead={copy.pages.apps.lead} />
          : <h2 className="ms-h2 ms-h2--sm ms-roles-title" id="ms-roles-title">{copy.apps.rolesTitle}</h2>}
        <div className="ms-roles-card ms-on-dark" data-rv>
          <div className="ms-roles-copy">
            <div className="ms-roles-tabs" role="group" aria-label={copy.apps.rolesTitle}>
              {roles.map((role, i) => (
                <button key={role.role} type="button" className="ms-pill" aria-pressed={i === index} onClick={() => setIndex(i)}>
                  {role.role}
                </button>
              ))}
            </div>
            <p className="ms-roles-text" key={index} aria-live="polite">{roles[index].text}</p>
            {app && <p className="ms-roles-app"><span className="ms-chip ms-chip--app">{app.name}</span></p>}
            {head && (
              <PageLink page="apps" className="ms-link">
                {copy.ui.explore}: {copy.pages.apps.eyebrow}
                <ArrowRight size={16} aria-hidden="true" />
              </PageLink>
            )}
          </div>
          <figure className="ms-roles-stage" key={index} aria-hidden="true">
            <RoleScene index={index} />
          </figure>
        </div>
      </div>
    </section>
  )
}

export function CountriesTeaser() {
  const { copy } = useSite()
  const c = copy.countries
  return (
    <section className="ms-section ms-section--alt" aria-labelledby="ms-world-title">
      <div className="ms-wrap">
        <SectionHead id="ms-world-title" eyebrow={copy.pages.countries.eyebrow} title={copy.pages.countries.heading} lead={copy.pages.countries.lead} />
        <div className="ms-world" data-rv>
          {REGIONS.map((region) => (
            <div key={region}>
              <h3>{c.regions[region]}</h3>
              <ul>
                {SITE_COUNTRIES.filter((country) => country.region === region).map((country) => (
                  <li key={country.code}>
                    <CountryLink code={country.code} className="ms-world-chip">
                      <b>{country.code}</b>
                      {c.list[country.code].name}
                    </CountryLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
