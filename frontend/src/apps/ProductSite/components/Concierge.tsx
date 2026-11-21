import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, CalendarCheck, Mail, Sparkles, X } from 'lucide-react'
import { CONTACT_EMAILS } from '../../../config/contact'
import { useSite } from '../SiteContext'
import { sitePath } from '../locales'
import { BrandMark } from './Brand'
import { PageLink } from './Layout'

/** Same order as `concierge.topics` in the copy. */
const CONCIERGE_TOPICS = ['ai', 'pilot', 'sales', 'question'] as const
type Topic = (typeof CONCIERGE_TOPICS)[number]

const SEEN_KEY = 'masova-concierge-seen'
const AUTO_OPEN_MS = 12_000
const TYPING_MS = 650

function readSeen(): boolean {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

function markSeen() {
  try {
    window.sessionStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Private mode or blocked storage: the guide may open again next visit, which is harmless.
  }
}

/**
 * A small guide in the corner of every page except contact, for visitors who want a person or a next step.
 * Every answer is pre-written copy and every action is a link: nothing is sent anywhere until the visitor uses
 * the contact form or their own email.
 *
 * It opens by itself once per browser session, after a pause, on wide screens only.
 */
export default function Concierge() {
  const { copy, locale } = useSite()
  const c = copy.concierge
  const navigate = useNavigate()
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const [topic, setTopic] = useState<Topic | null>(null)
  const [typing, setTyping] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (readSeen() || !window.matchMedia?.('(min-width: 861px)').matches) return
    const id = window.setTimeout(() => {
      if (readSeen()) return
      markSeen()
      setOpen(true)
    }, AUTO_OPEN_MS)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    if (!open) return
    panelRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      markSeen()
      setOpen(false)
      launcherRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!typing) return
    const id = window.setTimeout(() => setTyping(false), TYPING_MS)
    return () => window.clearTimeout(id)
  }, [typing])

  function close() {
    markSeen()
    setOpen(false)
    launcherRef.current?.focus()
  }

  function toggle() {
    if (open) {
      close()
      return
    }
    markSeen()
    setOpen(true)
  }

  function choose(next: Topic | null) {
    setTopic(next)
    setTyping(next !== null && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  }

  function toContact(sitesIndex?: number) {
    markSeen()
    setOpen(false)
    const query = sitesIndex === undefined ? '' : `?sites=${sitesIndex}`
    navigate(`${sitePath(locale, 'contact')}${query}#contact-form`)
  }

  const book = (
    <button type="button" className="ms-concierge-action ms-concierge-action--primary" onClick={() => toContact()}>
      <CalendarCheck size={17} aria-hidden="true" />
      {c.bookAction}
    </button>
  )

  return (
    <div className="ms-concierge">
      {open && (
        <div
          ref={panelRef}
          className="ms-concierge-panel ms-on-dark"
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          tabIndex={-1}
        >
          <div className="ms-concierge-head">
            <BrandMark size={34} />
            <h2 id={titleId}>{c.title}</h2>
            <button type="button" className="ms-concierge-close" onClick={close} aria-label={c.close}>
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="ms-concierge-body">
            {topic === null ? (
              <>
                <p className="ms-concierge-bubble"><strong>{c.greeting}</strong> {c.intro}</p>
                <ul className="ms-concierge-topics">
                  {c.topics.map((label, i) => (
                    <li key={label}>
                      <button type="button" onClick={() => choose(CONCIERGE_TOPICS[i])}>
                        <Sparkles size={15} aria-hidden="true" />
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <button type="button" className="ms-concierge-back" onClick={() => choose(null)}>
                  <ArrowLeft size={15} aria-hidden="true" />
                  {c.back}
                </button>
                <p className="ms-concierge-you">{c.topics[CONCIERGE_TOPICS.indexOf(topic)]}</p>
                {typing ? (
                  <p className="ms-concierge-bubble ms-concierge-typing" aria-hidden="true"><i /><i /><i /></p>
                ) : (
                  <div className="ms-concierge-answer" aria-live="polite">
                    {topic === 'ai' && (
                      <>
                        <p className="ms-concierge-bubble">{c.aiAnswer}</p>
                        <div className="ms-concierge-actions">
                          <PageLink page="ai" hash="inbox" className="ms-concierge-action ms-concierge-action--primary" onClick={close}>
                            <Sparkles size={17} aria-hidden="true" />
                            {c.aiAction}
                          </PageLink>
                          {book}
                        </div>
                      </>
                    )}
                    {topic === 'pilot' && (
                      <>
                        <p className="ms-concierge-bubble">{c.pilotAnswer}</p>
                        <p className="ms-concierge-bubble">{c.sitesQuestion}</p>
                        <div className="ms-concierge-chips">
                          {copy.contact.form.sitesOptions.map((option, i) => (
                            <button key={option} type="button" onClick={() => toContact(i)}>{option}</button>
                          ))}
                        </div>
                      </>
                    )}
                    {topic === 'sales' && (
                      <>
                        <p className="ms-concierge-bubble">{c.salesAnswer}</p>
                        <div className="ms-concierge-actions">
                          {book}
                          <a className="ms-concierge-action" href={`mailto:${CONTACT_EMAILS.sales}`}>
                            <Mail size={17} aria-hidden="true" />
                            {c.salesEmail}
                          </a>
                        </div>
                      </>
                    )}
                    {topic === 'question' && (
                      <>
                        <p className="ms-concierge-bubble">{c.questionAnswer}</p>
                        <div className="ms-concierge-actions">
                          <PageLink page="faq" className="ms-concierge-action ms-concierge-action--primary" onClick={close}>
                            <BookOpen size={17} aria-hidden="true" />
                            {c.questionAction}
                          </PageLink>
                          <a className="ms-concierge-action" href={`mailto:${CONTACT_EMAILS.hello}`}>
                            <Mail size={17} aria-hidden="true" />
                            {CONTACT_EMAILS.hello}
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <p className="ms-concierge-note">{c.note}</p>
        </div>
      )}

      <button
        ref={launcherRef}
        type="button"
        className="ms-concierge-launcher"
        aria-expanded={open}
        onClick={toggle}
      >
        <BrandMark size={26} />
        <span>{c.open}</span>
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
