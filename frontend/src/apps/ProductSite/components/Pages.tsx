import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, BadgeCheck, Check, CreditCard, Eye, FileText, KeyRound, ListChecks, Lock, Plus, Search, ShieldCheck,
  Sparkles, UserCheck, Wheat, type LucideIcon,
} from 'lucide-react'
import { useSite } from '../SiteContext'
import { PRODUCT_AREAS, SITE_LOCALE_NAMES, SITE_LOCALE_TAGS, countryPath, isSiteLocale, type CountryCode, type ProductArea } from '../locales'
import { APP_STATUS, AREA_META, ASSISTANT_SCHEDULE, DEFAULT_COUNTRY_FOR_LOCALE, INTEGRATION_BRANDS, REGIONS, SITE_COUNTRIES, countryFacts } from '../content/shared'
import { APP_ICONS, ASSISTANT_ICONS, CountryLink, PAGE_ICONS, PageHeader, PageLink, SectionHead, StatusChip } from './Layout'
import { AiCopilotScene, AiGuestChatScene, AreaScene } from './scenes'
import DecisionInbox from './DecisionInbox'
import { AgentGrid, AiHero, VoiceSection } from './AiShowcase'
import SupportEmailLink from './SupportEmailLink'
import { AreasGrid, JourneySection, RolesSection } from './HomeSections'
import { AppMatrix, AppShowcase } from './AppFamily'
import { CountUp, SectionRail } from './Effects'

/* ---------- Product ---------- */

export function ProductPage() {
  const { copy } = useSite()
  return (
    <>
      <PageHeader page="product" />
      <section className="ms-section" aria-labelledby="ms-map-title">
        <div className="ms-wrap">
          <h2 className="ms-sr" id="ms-map-title">{copy.areas.title}</h2>
          <ul className="ms-map">
            {PRODUCT_AREAS.map((area) => {
              const item = copy.areas.items[area]
              const Icon = PAGE_ICONS[area] ?? Sparkles
              return (
                <li key={area} data-glow data-rv>
                  <div className="ms-map-head">
                    <span className="ms-bento-icon"><Icon size={18} aria-hidden="true" /></span>
                    <h3><PageLink page={area}>{item.label}</PageLink></h3>
                  </div>
                  <ul>
                    {item.groups.map((group, g) => (
                      <li key={group.title}>
                        <PageLink page={area} hash={`g${g + 1}`}>
                          {group.title}
                          <span className="ms-num">{group.features.length}</span>
                        </PageLink>
                      </li>
                    ))}
                  </ul>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
      <AreasGrid head={false} />
      <JourneySection />
    </>
  )
}

/** A product area page: every feature group with its own live preview, then the apps and assistants involved. */
export function AreaPage({ area }: { area: ProductArea }) {
  const { copy } = useSite()
  const item = copy.areas.items[area]
  const meta = AREA_META[area]
  const next = PRODUCT_AREAS[(PRODUCT_AREAS.indexOf(area) + 1) % PRODUCT_AREAS.length]
  const apps = meta.apps.map((key) => copy.apps.items.find((app) => app.key === key)).filter((app): app is NonNullable<typeof app> => Boolean(app))

  return (
    <>
      <PageHeader page={area} image={meta.image} imageAlt={item.imageAlt}>
        <nav className="ms-jump" aria-label={item.label}>
          {item.groups.map((group, g) => <a key={group.title} href={`#g${g + 1}`}>{group.title}</a>)}
        </nav>
      </PageHeader>
      <SectionRail area={area} />

      {item.groups.map((group, g) => (
        <section key={group.title} className={g % 2 ? 'ms-section ms-section--alt ms-feature' : 'ms-section ms-feature'} id={`g${g + 1}`} aria-labelledby={`ms-g${g + 1}-title`}>
          <div className="ms-wrap ms-feature-grid" data-flip={g % 2 === 1}>
            <div data-section-anchor data-rv>
              <p className="ms-feature-num ms-num" aria-hidden="true">{String(g + 1).padStart(2, '0')}</p>
              <h2 className="ms-h2 ms-h2--sm" id={`ms-g${g + 1}-title`}>{group.title}</h2>
              <p className="ms-lead">{group.text}</p>
              <dl className="ms-features">
                {group.features.map((feature) => (
                  <div key={feature.title}>
                    <dt><Check size={16} aria-hidden="true" />{feature.title}</dt>
                    <dd>{feature.text}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <figure className="ms-stage" data-rv>
              <AreaScene area={area} group={g} />
              <figcaption className="ms-stage-note">{copy.ui.sampleData}</figcaption>
            </figure>
          </div>
        </section>
      ))}

      <section className="ms-section ms-section--dark ms-on-dark" aria-labelledby="ms-area-apps">
        <div className="ms-wrap ms-area-foot">
          <div>
            <h2 className="ms-sub-title" id="ms-area-apps">{copy.areas.appsTitle}</h2>
            <ul className="ms-mini">
              {apps.map((app) => {
                const Icon = APP_ICONS[app.key] ?? Sparkles
                return (
                  <li key={app.key}>
                    <Icon size={20} aria-hidden="true" />
                    <span><strong>{app.name}</strong><span>{copy.ui.forLabel}: {app.who}</span></span>
                    <StatusChip status={APP_STATUS[app.key]} />
                  </li>
                )
              })}
            </ul>
          </div>
          <div>
            <h2 className="ms-sub-title">{copy.areas.assistantsTitle}</h2>
            <ul className="ms-mini">
              {meta.assistants.map((index) => {
                const assistant = copy.ai.assistants[index]
                const Icon = ASSISTANT_ICONS[index]
                return (
                  <li key={assistant.name}>
                    <Icon size={20} aria-hidden="true" />
                    <span><strong>{assistant.name}</strong><span>{assistant.does}</span></span>
                  </li>
                )
              })}
            </ul>
            <PageLink page="ai" className="ms-link">{copy.ai.home.cta}<ArrowRight size={16} aria-hidden="true" /></PageLink>
          </div>
        </div>
      </section>

      <div className="ms-wrap">
        <PageLink page={next} className="ms-next">
          <span>
            {copy.ui.next}
            <strong>{copy.areas.items[next].label}</strong>
          </span>
          <ArrowRight size={22} aria-hidden="true" />
        </PageLink>
      </div>
    </>
  )
}

/* ---------- Apps ---------- */

export function AppsPage() {
  const { copy } = useSite()
  return (
    <>
      <PageHeader page="apps" />
      <section className="ms-section" aria-label={copy.pages.apps.heading}>
        <div className="ms-wrap">
          <AppShowcase />
        </div>
      </section>
      <AppMatrix />
      <RolesSection head={false} />
    </>
  )
}

/* ---------- AI ---------- */

function hourNow(): number {
  const now = new Date()
  return now.getHours() + now.getMinutes() / 60
}

function isWorking(index: number, hour: number): boolean {
  const slot = ASSISTANT_SCHEDULE[index]
  if (slot.from !== undefined && slot.to !== undefined) return hour >= slot.from && hour < slot.to
  return Boolean(slot.at?.some((at) => hour >= at && hour < at + 1))
}

/** The assistants on a 24-hour clock, with a marker at the visitor's own time. */
function AiCycle() {
  const { copy, locale } = useSite()
  const cycle = copy.ai.cycle
  const [hour, setHour] = useState<number | null>(null)

  useEffect(() => {
    setHour(hourNow())
    const id = window.setInterval(() => setHour(hourNow()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const timeLabel = useMemo(
    () => (hour === null ? '' : new Intl.DateTimeFormat(SITE_LOCALE_TAGS[locale], { hour: '2-digit', minute: '2-digit' }).format(new Date())),
    [hour, locale],
  )

  return (
    <section className="ms-section ms-section--dark ms-on-dark" id="assistants" aria-labelledby="ms-cycle-title">
      <div className="ms-wrap">
        <SectionHead id="ms-cycle-title" eyebrow={cycle.eyebrow} title={cycle.title} lead={cycle.lead} />
        <div className="ms-cycle" data-rv>
          <div className="ms-cycle-scale" aria-hidden="true">
            <span />
            <div>{[0, 6, 12, 18, 24].map((h) => <b key={h} className="ms-num" style={{ left: `${(h / 24) * 100}%` }}>{String(h % 24).padStart(2, '0')}:00</b>)}</div>
          </div>
          <ul>
            {copy.ai.assistants.map((assistant, i) => {
              const Icon = ASSISTANT_ICONS[i]
              const slot = ASSISTANT_SCHEDULE[i]
              const working = hour !== null && isWorking(i, hour)
              return (
                <li key={assistant.name} data-working={working}>
                  <div className="ms-cycle-who">
                    <span className="ms-cycle-icon"><Icon size={17} aria-hidden="true" /></span>
                    <span><strong>{assistant.name}</strong><small>{assistant.when}</small></span>
                  </div>
                  <div className="ms-cycle-track" aria-hidden="true">
                    {slot.from !== undefined && slot.to !== undefined && (
                      <i className="ms-cycle-band" style={{ left: `${(slot.from / 24) * 100}%`, width: `${((slot.to - slot.from) / 24) * 100}%` }} />
                    )}
                    {slot.at?.map((at) => <i key={at} className="ms-cycle-dot" style={{ left: `${(at / 24) * 100}%` }} />)}
                    {hour !== null && <i className="ms-cycle-now" style={{ left: `${(hour / 24) * 100}%` }} />}
                  </div>
                </li>
              )
            })}
          </ul>
          {hour !== null && <p className="ms-cycle-time ms-num" aria-hidden="true" style={{ '--ms-now': hour / 24 } as React.CSSProperties}>{timeLabel}</p>}
        </div>
      </div>
    </section>
  )
}

export function AiPage() {
  const { copy } = useSite()
  const ai = copy.ai
  const moreVisuals = [<AiCopilotScene key="c" />, <AiGuestChatScene key="s" />]
  return (
    <>
      <AiHero />
      <AiCycle />
      <AgentGrid />
      <VoiceSection />

      <section className="ms-section ms-section--alt" id="inbox" aria-labelledby="ms-inbox-title">
        <div className="ms-wrap">
          <SectionHead id="ms-inbox-title" eyebrow={ai.inbox.eyebrow} title={ai.inbox.title} lead={ai.inbox.lead} />
          <DecisionInbox
            extra={(
              <PageLink page="contact" className="ms-inbox-extra">
                <strong>{copy.cta.title}</strong>
                <span>{copy.ui.bookCta}<ArrowRight size={18} aria-hidden="true" /></span>
              </PageLink>
            )}
          />
        </div>
      </section>

      <section className="ms-section" aria-labelledby="ms-how-title">
        <div className="ms-wrap ms-how">
          <div>
            <h2 className="ms-h2 ms-h2--sm" id="ms-how-title">{ai.how.title}</h2>
            <ol className="ms-how-steps">
              {ai.how.steps.map((step, i) => (
                <li key={step.title} data-rv>
                  <span className="ms-num" aria-hidden="true">{i + 1}</span>
                  <div><strong>{step.title}</strong><p>{step.text}</p></div>
                </li>
              ))}
            </ol>
          </div>
          <div className="ms-rules-card" data-rv>
            <h2 className="ms-sub-title">{ai.rules.title}</h2>
            <ul className="ms-rules">
              {ai.rules.items.map((rule) => <li key={rule}><ShieldCheck size={18} aria-hidden="true" /><span>{rule}</span></li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="ms-section ms-section--alt" aria-labelledby="ms-more-title">
        <div className="ms-wrap">
          <h2 className="ms-h2 ms-h2--sm" id="ms-more-title">{ai.more.title}</h2>
          <div className="ms-more">
            <ul>
              {ai.more.items.map((item, i) => (
                <li key={item.title} data-rv>
                  <StatusChip status={i === 1 ? 'early' : 'preview'} />
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </li>
              ))}
            </ul>
            <figure className="ms-stage ms-stage--pair" data-rv aria-hidden="true">{moreVisuals}</figure>
          </div>
        </div>
      </section>
    </>
  )
}

/* ---------- Solutions ---------- */

/* One dish that fits each kind of restaurant, in the same order as `solutions.types`. */
const SOLUTION_IMAGES = ['/site/menu/lasagna-bolognese.webp', '/site/menu/crispy-chicken-burger.webp', '/site/menu/paella.webp', '/site/menu/chicken-biryani-plate.webp', '/site/menu/apple-strudel.webp']
const SOLUTION_AREAS: ProductArea[][] = [['insights', 'team', 'stock'], ['counter', 'kitchen', 'ordering'], ['counter', 'guests', 'team'], ['ordering', 'delivery', 'insights'], ['counter', 'stock', 'guests']]

export function SolutionsPage() {
  const { copy } = useSite()
  const [index, setIndex] = useState(0)
  const s = copy.solutions
  const current = s.types[index]
  return (
    <>
      <PageHeader page="solutions" />
      <section className="ms-section" aria-label={copy.pages.solutions.heading}>
        <div className="ms-wrap">
          <div className="ms-tabs" role="group" aria-label={copy.pages.solutions.eyebrow}>
            {s.types.map((type, i) => (
              <button key={type.name} type="button" className="ms-pill" aria-pressed={i === index} onClick={() => setIndex(i)}>{type.name}</button>
            ))}
          </div>
          <div className="ms-solution" key={index}>
            <img src={SOLUTION_IMAGES[index]} alt="" width={720} height={520} loading="lazy" decoding="async" />
            <div aria-live="polite">
              <h2 className="ms-h2 ms-h2--sm">{current.name}</h2>
              <p className="ms-lead">{current.text}</p>
              <ul className="ms-checks">
                {current.points.map((point) => <li key={point}><Check size={18} aria-hidden="true" /><span>{point}</span></li>)}
              </ul>
              <div className="ms-solution-links">
                {SOLUTION_AREAS[index].map((area) => (
                  <PageLink key={area} page={area} className="ms-world-chip">{copy.areas.items[area].label}<ArrowRight size={14} aria-hidden="true" /></PageLink>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="ms-section ms-section--alt" aria-labelledby="ms-sol-roles">
        <div className="ms-wrap">
          <h2 className="ms-h2 ms-h2--sm" id="ms-sol-roles">{s.rolesTitle}</h2>
          <ul className="ms-principles">
            {s.roles.map((role) => <li key={role.role} data-rv><strong>{role.role}</strong><span>{role.text}</span></li>)}
          </ul>
        </div>
      </section>
    </>
  )
}

/* ---------- Countries ---------- */

function fold(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export function CountriesPage() {
  const { copy, locale } = useSite()
  const c = copy.countries
  const [query, setQuery] = useState('')
  const home = DEFAULT_COUNTRY_FOR_LOCALE[locale]
  const matches = (code: CountryCode) => !query.trim() || fold(`${c.list[code].name} ${code}`).includes(fold(query.trim()))
  const anyMatch = SITE_COUNTRIES.some((country) => matches(country.code))

  return (
    <>
      <PageHeader page="countries">
        <label className="ms-find">
          <Search size={18} aria-hidden="true" />
          <span className="ms-sr">{c.find}</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={c.find} autoComplete="off" />
        </label>
      </PageHeader>
      <section className="ms-section" aria-label={copy.pages.countries.heading}>
        <div className="ms-wrap">
          {REGIONS.map((region) => {
            const list = SITE_COUNTRIES.filter((country) => country.region === region && matches(country.code))
            if (!list.length) return null
            return (
              <div key={region} className="ms-region">
                <h2 className="ms-sub-title">{c.regions[region]}</h2>
                <ul className="ms-country-grid">
                  {list.map((country) => (
                    <li key={country.code}>
                      <CountryLink code={country.code} className="ms-country-tile" glow>
                        <span className="ms-country-tile-top">
                          <b>{country.code}</b>
                          <small className="ms-num">{country.currency}</small>
                        </span>
                        <strong>{c.list[country.code].name}</strong>
                        <span>{c.list[country.code].keep}</span>
                        {country.code === home && <i aria-hidden="true" />}
                      </CountryLink>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
          {!anyMatch && <p className="ms-search-empty" role="status">{copy.nav.search.empty}</p>}
          <p className="ms-country-other">
            {c.other}{' '}
            <PageLink className="ms-link" page="contact">{c.otherCta}<ArrowRight size={16} aria-hidden="true" /></PageLink>
          </p>
        </div>
      </section>
    </>
  )
}

export function CountryPage({ code }: { code: CountryCode }) {
  const { copy, locale } = useSite()
  const c = copy.countries
  const facts = countryFacts(code)
  const info = c.list[code]
  const integrations = copy.integrations.groups
  return (
    <>
      <PageHeader page="countries" heading={info.name} lead={c.pageLead} eyebrow={<PageLink page="countries" className="ms-crumb"><ArrowLeft size={14} aria-hidden="true" />{c.back}</PageLink>}>
        <div className="ms-page-head-actions">
          <PageLink page="contact" className="ms-btn ms-btn--accent">{copy.ui.bookCta}<ArrowRight size={18} aria-hidden="true" /></PageLink>
        </div>
      </PageHeader>
      <section className="ms-section" aria-label={info.name}>
        <div className="ms-wrap ms-country">
          <div className="ms-country-card" data-rv>
            <div className="ms-country-head">
              <h2>{c.keepLabel}</h2>
              <span className="ms-country-code">{code} · {facts.currency}</span>
            </div>
            <dl className="ms-country-rows">
              <div><dt>{c.currencyLabel}</dt><dd className="ms-num">{facts.currency}</dd></div>
              <div><dt>{c.runsLabel}</dt><dd>{c.runs}</dd></div>
              <div>
                <dt>{integrations[5].title}</dt>
                <dd>{info.keep}{facts.till && <span className="ms-country-till">{facts.till}</span>}</dd>
              </div>
              <div><dt>{c.payLabel}</dt><dd>{facts.pay === 'razorpay' ? c.payRazorpay : c.payStripe}</dd></div>
              {facts.marketplaces.length > 0 && (
                <div>
                  <dt>{c.marketplacesLabel}</dt>
                  <dd>
                    <span className="ms-brandrow">{facts.marketplaces.map((name) => <b key={name}>{name}</b>)}</span>
                    {c.marketplacesNote}
                  </dd>
                </div>
              )}
              <div>
                <dt>{c.languagesLabel}</dt>
                <dd>
                  <span className="ms-brandrow">
                    {facts.locales.filter(isSiteLocale).map((code2) => (
                      <Link key={code2} to={countryPath(code2, code)} lang={SITE_LOCALE_TAGS[code2]} hrefLang={SITE_LOCALE_TAGS[code2]} aria-current={code2 === locale ? 'true' : undefined}>
                        {SITE_LOCALE_NAMES[code2]}
                      </Link>
                    ))}
                  </span>
                </dd>
              </div>
            </dl>
            <p className="ms-country-foot">{c.disclaimer}</p>
          </div>
          <aside className="ms-country-side">
            <h2 className="ms-sub-title">{copy.areas.title}</h2>
            <ul>
              {PRODUCT_AREAS.map((area) => {
                const Icon = PAGE_ICONS[area] ?? Sparkles
                return (
                  <li key={area}>
                    <PageLink page={area}>
                      <Icon size={18} aria-hidden="true" />
                      <span><strong>{copy.areas.items[area].label}</strong><small>{copy.areas.items[area].tagline}</small></span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </PageLink>
                  </li>
                )
              })}
            </ul>
          </aside>
        </div>
      </section>
    </>
  )
}

/* ---------- Compliance, security, integrations ---------- */

const COMPLIANCE_ICONS: LucideIcon[] = [Wheat, UserCheck, Eye, ListChecks]

export function CompliancePage() {
  const { copy } = useSite()
  const c = copy.compliance
  return (
    <>
      <PageHeader page="compliance" />
      <section className="ms-section" aria-label={copy.pages.compliance.heading}>
        <div className="ms-wrap">
          <ul className="ms-pillars">
            {c.blocks.map((block, i) => {
              const Icon = COMPLIANCE_ICONS[i] ?? BadgeCheck
              return (
                <li key={block.title} data-glow data-rv>
                  <span className="ms-app-icon"><Icon size={20} aria-hidden="true" /></span>
                  <h2>{block.title}</h2>
                  <p>{block.text}</p>
                  <ul className="ms-checks">
                    {block.points.map((point) => <li key={point}><Check size={17} aria-hidden="true" /><span>{point}</span></li>)}
                  </ul>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
      <section className="ms-section ms-section--alt" aria-labelledby="ms-allergens-title">
        <div className="ms-wrap">
          <h2 className="ms-h2 ms-h2--sm" id="ms-allergens-title">{c.allergensTitle}</h2>
          <ol className="ms-allergens" data-rv>
            {c.allergens.map((name, i) => <li key={name}><span className="ms-num">{String(i + 1).padStart(2, '0')}</span>{name}</li>)}
          </ol>
        </div>
      </section>
      <section className="ms-section" aria-labelledby="ms-tills-title">
        <div className="ms-wrap ms-callout" data-rv>
          <div>
            <h2 className="ms-h2 ms-h2--sm" id="ms-tills-title">{c.tillsTitle}</h2>
            <p className="ms-lead">{c.tillsText}</p>
          </div>
          <PageLink page="countries" className="ms-btn ms-btn--primary">{c.tillsCta}<ArrowRight size={18} aria-hidden="true" /></PageLink>
        </div>
      </section>
    </>
  )
}

const SECURITY_ICONS: LucideIcon[] = [CreditCard, UserCheck, Lock, KeyRound, ShieldCheck, Sparkles, ListChecks, FileText]

export function SecurityPage() {
  const { copy } = useSite()
  const s = copy.security
  return (
    <>
      <PageHeader page="security" />
      <section className="ms-section" aria-label={copy.pages.security.heading}>
        <div className="ms-wrap">
          <ul className="ms-grid-4">
            {s.items.map((item, i) => {
              const Icon = SECURITY_ICONS[i] ?? ShieldCheck
              return (
                <li key={item.title} data-glow data-rv style={{ '--rv-delay': `${(i % 4) * 60}ms` } as React.CSSProperties}>
                  <Icon size={22} aria-hidden="true" />
                  <h2>{item.title}</h2>
                  <p>{item.text}</p>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
      <section className="ms-section ms-section--alt" aria-labelledby="ms-docs-title">
        <div className="ms-wrap ms-docs">
          <div data-rv>
            <h2 className="ms-h2 ms-h2--sm" id="ms-docs-title">{s.docsTitle}</h2>
            <p className="ms-lead">{s.docsText}</p>
            <ul className="ms-doclist">
              {s.docs.map((doc) => <li key={doc}><FileText size={17} aria-hidden="true" />{doc}</li>)}
            </ul>
          </div>
          <div className="ms-rules-card" data-rv>
            <h2 className="ms-sub-title">{s.reportTitle}</h2>
            <p>{s.reportText}</p>
            <SupportEmailLink to="security" />
          </div>
        </div>
      </section>
    </>
  )
}

export function IntegrationsPage() {
  const { copy } = useSite()
  const g = copy.integrations
  return (
    <>
      <PageHeader page="integrations" />
      <section className="ms-section" aria-label={copy.pages.integrations.heading}>
        <div className="ms-wrap">
          <ul className="ms-integrations">
            {g.groups.map((group, i) => (
              <li key={group.title} data-glow data-rv>
                <h2>{group.title}</h2>
                <p>{group.text}</p>
                <span className="ms-brandrow">{INTEGRATION_BRANDS[i]?.map((brand) => <b key={brand}>{brand}</b>)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="ms-section ms-section--alt" aria-labelledby="ms-roadmap-title">
        <div className="ms-wrap">
          <SectionHead id="ms-roadmap-title" title={g.roadmapTitle} lead={g.roadmapText} />
          <ul className="ms-principles ms-principles--3">
            {g.roadmap.map((item) => <li key={item.title} data-rv><strong>{item.title}</strong><span>{item.text}</span></li>)}
          </ul>
          <div className="ms-callout" data-rv>
            <div>
              <h2 className="ms-h2 ms-h2--sm">{g.askTitle}</h2>
              <p className="ms-lead">{g.askText}</p>
            </div>
            <PageLink page="contact" className="ms-btn ms-btn--primary">{copy.ui.bookCta}<ArrowRight size={18} aria-hidden="true" /></PageLink>
          </div>
        </div>
      </section>
    </>
  )
}

/* ---------- Pricing, pilot, FAQ, about ---------- */

export function PricingPage() {
  const { copy } = useSite()
  const p = copy.pricing
  return (
    <>
      <PageHeader page="pricing" />
      <section className="ms-section" aria-label={copy.pages.pricing.heading}>
        <div className="ms-wrap">
          <ul className="ms-principles">
            {p.principles.map((item) => <li key={item.title} data-rv><strong>{item.title}</strong><span>{item.text}</span></li>)}
          </ul>
          <div className="ms-price">
            <div className="ms-price-card" data-rv>
              <h2>{p.includedTitle}</h2>
              <ul className="ms-checks">
                {p.included.map((line) => <li key={line}><Check size={18} aria-hidden="true" /><span>{line}</span></li>)}
              </ul>
              <PageLink page="contact" className="ms-btn ms-btn--accent">{copy.ui.bookCta}<ArrowRight size={18} aria-hidden="true" /></PageLink>
            </div>
            <div data-rv>
              <h2 className="ms-sub-title">{p.othersTitle}</h2>
              <dl className="ms-price-lines">
                {p.others.map((line) => <div key={line.title}><dt>{line.title}</dt><dd>{line.text}</dd></div>)}
              </dl>
              <div className="ms-price-pilot">
                <h3>{p.pilotTitle}</h3>
                <p>{p.pilotText}</p>
                <PageLink page="pilot" className="ms-link">{p.pilotCta}<ArrowRight size={16} aria-hidden="true" /></PageLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export function PilotPage() {
  const { copy } = useSite()
  const p = copy.pilot
  return (
    <>
      <PageHeader page="pilot">
        <p className="ms-page-head-note">{p.fit}</p>
      </PageHeader>
      <section className="ms-section" aria-label={copy.pages.pilot.heading}>
        <div className="ms-wrap">
          <ol className="ms-timeline">
            {p.steps.map((step, i) => (
              <li key={step.title} data-rv style={{ '--rv-delay': `${i * 70}ms` } as React.CSSProperties}>
                <span className="ms-timeline-dot ms-num" aria-hidden="true">{i === p.steps.length - 1 ? <Check size={15} /> : i + 1}</span>
                <small>{step.when}</small>
                <strong>{step.title}</strong>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="ms-section ms-section--alt" aria-labelledby="ms-measures-title">
        <div className="ms-wrap ms-measures">
          <div data-rv>
            <h2 className="ms-h2 ms-h2--sm" id="ms-measures-title">{p.measuresTitle}</h2>
            <p className="ms-lead">{p.measuresText}</p>
            <ul className="ms-measure-list">
              {p.measures.map((measure, i) => <li key={measure}><span className="ms-num">{String(i + 1).padStart(2, '0')}</span>{measure}</li>)}
            </ul>
          </div>
          <div className="ms-duo" data-rv>
            <div>
              <h3 className="ms-sub-title">{p.weTitle}</h3>
              <ul className="ms-checks">{p.we.map((line) => <li key={line}><Check size={17} aria-hidden="true" /><span>{line}</span></li>)}</ul>
            </div>
            <div>
              <h3 className="ms-sub-title">{p.youTitle}</h3>
              <ul className="ms-checks">{p.you.map((line) => <li key={line}><Check size={17} aria-hidden="true" /><span>{line}</span></li>)}</ul>
            </div>
          </div>
        </div>
      </section>
      <section className="ms-section" aria-labelledby="ms-support-title">
        <div className="ms-wrap">
          <h2 className="ms-h2 ms-h2--sm" id="ms-support-title">{p.supportTitle}</h2>
          <ul className="ms-principles ms-principles--3">
            {p.support.map((item) => <li key={item.title} data-rv><strong>{item.title}</strong><span>{item.text}</span></li>)}
          </ul>
          <div className="ms-callout" data-rv>
            <div>
              <h2 className="ms-h2 ms-h2--sm">{p.exitTitle}</h2>
              <p className="ms-lead">{p.exitText}</p>
            </div>
            <PageLink page="pricing" className="ms-btn ms-btn--outline">{copy.pages.pricing.eyebrow}<ArrowRight size={18} aria-hidden="true" /></PageLink>
          </div>
        </div>
      </section>
    </>
  )
}

export function FaqPage() {
  const { copy } = useSite()
  return (
    <>
      <PageHeader page="faq" />
      <section className="ms-section" aria-label={copy.pages.faq.heading}>
        <div className="ms-wrap ms-faq-wrap">
          <nav className="ms-faq-nav" aria-label={copy.pages.faq.eyebrow}>
            {copy.faq.groups.map((group, g) => <a key={group.title} href={`#q${g + 1}`}>{group.title}</a>)}
          </nav>
          <div>
            {copy.faq.groups.map((group, g) => (
              <div key={group.title} id={`q${g + 1}`} className="ms-faq-group">
                <h2 className="ms-sub-title" data-section-anchor>{group.title}</h2>
                <div className="ms-faq">
                  {group.items.map((item) => (
                    <details key={item.q}>
                      <summary>{item.q}<Plus size={20} aria-hidden="true" /></summary>
                      <p>{item.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export function AboutPage() {
  const { copy } = useSite()
  const about = copy.about
  return (
    <>
      <PageHeader page="about" />
      <section className="ms-section" aria-labelledby="ms-about-story">
        <div className="ms-wrap ms-about">
          <div className="ms-about-story" data-rv>
            <h2 className="ms-h2 ms-h2--sm" id="ms-about-story">{about.storyTitle}</h2>
            {about.story.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <figure className="ms-about-media" data-rv>
            <img src="/site/restaurant-exterior.webp" alt={about.imageAlt} width={1200} height={800} loading="lazy" decoding="async" />
          </figure>
        </div>
      </section>
      <section className="ms-section ms-section--alt" aria-labelledby="ms-about-facts">
        <div className="ms-wrap">
          <h2 className="ms-sub-title" id="ms-about-facts">{about.factsTitle}</h2>
          <ul className="ms-about-facts">
            {about.facts.map((fact) => <li key={fact.label} data-rv><strong className="ms-num"><CountUp value={fact.value} /></strong><span>{fact.label}</span></li>)}
          </ul>
          <h2 className="ms-sub-title ms-gap-top">{about.principlesTitle}</h2>
          <ul className="ms-principles">
            {about.principles.map((principle) => <li key={principle.title} data-rv><strong>{principle.title}</strong><span>{principle.text}</span></li>)}
          </ul>
        </div>
      </section>
    </>
  )
}
