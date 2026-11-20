import { useMemo, useState, type ReactNode } from 'react'
import { Check, RotateCcw, X } from 'lucide-react'
import { useSite } from '../SiteContext'
import { SITE_LOCALE_TAGS } from '../locales'
import { ASSISTANT_SCHEDULE, INBOX_ASSISTANTS } from '../content/shared'
import { ASSISTANT_ICONS } from './Layout'

type Verdict = 'approved' | 'dismissed'

const FILTER_GROUPS = ['all', 'stock', 'team', 'guests', 'prices'] as const

/**
 * A working copy of the manager's proposal inbox with sample proposals.
 * Approving or dismissing moves a proposal into the decision record, the way it does in the product.
 */
export default function DecisionInbox({ extra }: { extra?: ReactNode }) {
  const { copy, locale } = useSite()
  const inbox = copy.ai.inbox
  const [filter, setFilter] = useState(0)
  const [decisions, setDecisions] = useState<{ index: number; verdict: Verdict; time: string }[]>([])

  const timeFormat = useMemo(() => new Intl.DateTimeFormat(SITE_LOCALE_TAGS[locale], { hour: '2-digit', minute: '2-digit' }), [locale])
  const decided = new Set(decisions.map((d) => d.index))
  const open = inbox.items
    .map((item, index) => ({ item, index, assistant: INBOX_ASSISTANTS[index] }))
    .filter(({ index, assistant }) => !decided.has(index) && (filter === 0 || ASSISTANT_SCHEDULE[assistant].group === FILTER_GROUPS[filter]))

  const decide = (index: number, verdict: Verdict) =>
    setDecisions((prev) => [{ index, verdict, time: timeFormat.format(new Date()) }, ...prev])

  return (
    <div className="ms-inbox">
      <div className="ms-inbox-main">
        <div className="ms-inbox-filters" role="group" aria-label={inbox.title}>
          {inbox.filters.map((name, i) => (
            <button key={name} type="button" className="ms-pill" aria-pressed={i === filter} onClick={() => setFilter(i)}>
              {name}
            </button>
          ))}
          <span className="ms-inbox-sample">{copy.ui.sampleData}</span>
        </div>

        <ul className="ms-inbox-list">
          {open.map(({ item, index, assistant }) => {
            const Icon = ASSISTANT_ICONS[assistant]
            return (
              <li key={item.title} className="ms-proposal">
                <div className="ms-proposal-top">
                  <span className="ms-proposal-agent"><i><Icon size={17} aria-hidden="true" /></i>{copy.ai.assistants[assistant].name}</span>
                  <span className="ms-proposal-impact">
                    <small>{inbox.impactLabel}</small>
                    <strong className="ms-num">{item.impact}</strong>
                  </span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <p className="ms-proposal-action">{item.action}</p>
                <p className="ms-proposal-sources"><b>{inbox.sourcesLabel}:</b> {item.sources}</p>
                <div className="ms-proposal-buttons">
                  <button type="button" className="ms-btn ms-btn--forest ms-btn--sm" onClick={() => decide(index, 'approved')}>
                    <Check size={16} aria-hidden="true" />
                    {inbox.approve}
                  </button>
                  <button type="button" className="ms-btn ms-btn--outline ms-btn--sm" onClick={() => decide(index, 'dismissed')}>
                    <X size={16} aria-hidden="true" />
                    {inbox.dismiss}
                  </button>
                </div>
              </li>
            )
          })}
          {extra && filter === 0 && <li>{extra}</li>}
        </ul>
        {decisions.length === inbox.items.length && (
          <div className="ms-inbox-done">
            <Check size={22} aria-hidden="true" />
            <p>{inbox.done}</p>
          </div>
        )}
      </div>

      <aside className="ms-inbox-log" aria-labelledby="ms-inbox-log-title">
        <div className="ms-inbox-log-head">
          <h3 id="ms-inbox-log-title">{inbox.logTitle}</h3>
          {decisions.length > 0 && (
            <button type="button" className="ms-inbox-reset" onClick={() => setDecisions([])}>
              <RotateCcw size={14} aria-hidden="true" />
              {inbox.reset}
            </button>
          )}
        </div>
        <ol aria-live="polite">
          {decisions.map((decision) => (
            <li key={decision.index} data-verdict={decision.verdict}>
              <i aria-hidden="true">{decision.verdict === 'approved' ? <Check size={13} /> : <X size={13} />}</i>
              <span>
                <strong>{inbox.items[decision.index].action}</strong>
                <small>{decision.verdict === 'approved' ? inbox.approved : inbox.dismissed} · <span className="ms-num">{decision.time}</span></small>
              </span>
            </li>
          ))}
        </ol>
        {decisions.length === 0 && <p className="ms-inbox-empty">{inbox.logEmpty}</p>}
      </aside>
    </div>
  )
}
