import { useState } from 'react'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { useSite } from '../SiteContext'
import { PRODUCT_AREAS } from '../locales'
import { APP_GROUPS, APP_STATUS, AREA_META } from '../content/shared'
import { APP_ICONS, PAGE_ICONS, PageLink, SectionHead, StatusChip } from './Layout'
import { APP_PREVIEW_WIDE, AppPreview } from './Previews'

/** Pick an app on the left; its screen, what it does and where it is used appear on the right. */
export function AppShowcase() {
  const { copy } = useSite()
  const [active, setActive] = useState('web')
  const byKey = new Map(copy.apps.items.map((item) => [item.key, item]))
  const app = byKey.get(active) ?? copy.apps.items[0]
  const Icon = APP_ICONS[app.key] ?? Sparkles
  const areas = PRODUCT_AREAS.filter((area) => AREA_META[area].apps.includes(app.key))

  return (
    <div className="ms-show">
      <div className="ms-show-nav">
        {APP_GROUPS.map((keys, g) => (
          <div key={copy.apps.audiences[g]} role="group" aria-labelledby={`ms-show-g${g}`}>
            <h3 id={`ms-show-g${g}`}>{copy.apps.audiences[g]}</h3>
            {keys.map((key) => {
              const item = byKey.get(key)
              if (!item) return null
              const ItemIcon = APP_ICONS[key] ?? Sparkles
              return (
                <button key={key} type="button" aria-pressed={key === active} onClick={() => setActive(key)}>
                  <ItemIcon size={18} aria-hidden="true" />
                  <span>{item.name}</span>
                  <i data-status={APP_STATUS[key]} aria-hidden="true" />
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className="ms-show-panel ms-on-dark" key={app.key}>
        <div className="ms-show-copy" aria-live="polite">
          <div className="ms-show-top">
            <span className="ms-app-icon"><Icon size={20} aria-hidden="true" /></span>
            <StatusChip status={APP_STATUS[app.key]} />
          </div>
          <h3>{app.name}</h3>
          <p className="ms-show-who">{copy.ui.forLabel}: <b>{app.who}</b></p>
          <p>{app.text}</p>
          <ul className="ms-checks">
            {app.points.map((point) => <li key={point}><Check size={17} aria-hidden="true" /><span>{point}</span></li>)}
          </ul>
          {areas.length > 0 && (
            <div className="ms-show-areas">
              <small>{copy.apps.usedIn}</small>
              <div>
                {areas.map((area) => (
                  <PageLink key={area} page={area} className="ms-world-chip">{copy.areas.items[area].label}<ArrowRight size={14} aria-hidden="true" /></PageLink>
                ))}
              </div>
            </div>
          )}
        </div>
        <figure className="ms-show-stage" data-wide={APP_PREVIEW_WIDE[app.key]} aria-hidden="true">
          <AppPreview app={app.key} />
          <figcaption className="pv-sample">{copy.ui.sampleData}</figcaption>
        </figure>
      </div>
    </div>
  )
}

/** Apps down the side, product areas across the top: a mark where an app is used. */
export function AppMatrix() {
  const { copy } = useSite()
  const byKey = new Map(copy.apps.items.map((item) => [item.key, item]))
  return (
    <section className="ms-section ms-section--alt" aria-labelledby="ms-matrix-title">
      <div className="ms-wrap">
        <SectionHead id="ms-matrix-title" title={copy.apps.matrixTitle} lead={copy.apps.matrixLead} />
        <div className="ms-matrix-scroll" data-rv tabIndex={0} role="region" aria-labelledby="ms-matrix-title">
          <table className="ms-matrix">
            <thead>
              <tr>
                <td />
                {PRODUCT_AREAS.map((area) => {
                  const AreaIcon = PAGE_ICONS[area] ?? Sparkles
                  return (
                    <th key={area} scope="col">
                      <PageLink page={area}><AreaIcon size={17} aria-hidden="true" /><span>{copy.areas.items[area].label}</span></PageLink>
                    </th>
                  )
                })}
              </tr>
            </thead>
            {APP_GROUPS.map((keys, g) => (
              <tbody key={copy.apps.audiences[g]}>
                <tr className="ms-matrix-group"><th colSpan={PRODUCT_AREAS.length + 1} scope="rowgroup">{copy.apps.audiences[g]}</th></tr>
                {keys.map((key) => {
                  const item = byKey.get(key)
                  if (!item) return null
                  return (
                    <tr key={key}>
                      <th scope="row">{item.name}</th>
                      {PRODUCT_AREAS.map((area) => (
                        <td key={area}>
                          {AREA_META[area].apps.includes(key) && <Check size={16} role="img" aria-label={copy.areas.items[area].label} />}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            ))}
          </table>
        </div>
      </div>
    </section>
  )
}
