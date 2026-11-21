import { useEffect, useState, type CSSProperties } from 'react'
import { ArrowRight, Clock3, Mic, Sparkles, Volume2 } from 'lucide-react'
import { useSite } from '../SiteContext'
import { Aurora, SparkRibbon } from './Aurora'
import { ASSISTANT_ICONS, PageLink, StatusChip } from './Layout'
import { BrandMark } from './Brand'
import { usePrefersReducedMotion } from './Effects'

/**
 * The eight assistants on an orbit around your own data. Signals travel in along each spoke,
 * one assistant at a time lights up, the way proposals arrive through the day.
 */
export function AgentConstellation() {
  const { copy } = useSite()
  const assistants = copy.ai.assistants
  const reduced = usePrefersReducedMotion()
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => setActive((i) => (i + 1) % assistants.length), 1600)
    return () => window.clearInterval(id)
  }, [reduced, assistants.length])

  return (
    <div className="ms-constellation" aria-hidden="true">
      <svg className="ms-constellation-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
        <circle cx="50" cy="50" r="38" />
        <circle cx="50" cy="50" r="24" />
        {assistants.map((assistant, i) => {
          const angle = (i / assistants.length) * Math.PI * 2 - Math.PI / 2
          const x = 50 + Math.cos(angle) * 38
          const y = 50 + Math.sin(angle) * 38
          return <line key={assistant.name} x1={x} y1={y} x2="50" y2="50" data-active={i === active} />
        })}
      </svg>
      <div className="ms-constellation-core">
        <BrandMark size={64} />
      </div>
      {assistants.map((assistant, i) => {
        const Icon = ASSISTANT_ICONS[i]
        const angle = (i / assistants.length) * Math.PI * 2 - Math.PI / 2
        const style = { left: `${50 + Math.cos(angle) * 38}%`, top: `${50 + Math.sin(angle) * 38}%` } as CSSProperties
        return (
          <div key={assistant.name} className="ms-constellation-node" style={style} data-active={i === active} data-side={Math.cos(angle) < -0.1 ? 'left' : Math.cos(angle) > 0.1 ? 'right' : 'mid'}>
            <span className="ms-constellation-orb"><Icon size={18} /></span>
            <span className="ms-constellation-label">{assistant.name}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Header of the AI page: the promise, and the constellation of assistants around your data. */
export function AiHero() {
  const { copy } = useSite()
  const p = copy.pages.ai
  return (
    <header className="ms-ai-hero ms-on-dark">
      <Aurora tone="forest" />
      <div className="ms-wrap ms-ai-hero-grid">
        <div className="ms-ai-hero-copy">
          <p className="ms-hero-eyebrow"><b>MaSoVa</b><span>{p.eyebrow}</span></p>
          <h1 className="ms-page-title">{p.heading}</h1>
          <p className="ms-lead">{p.lead}</p>
          <div className="ms-page-head-actions">
            <PageLink page="contact" className="ms-btn ms-btn--accent">
              {copy.ui.bookCta}
              <ArrowRight size={18} aria-hidden="true" />
            </PageLink>
            <a className="ms-btn ms-btn--outline-dark" href="#voice">{copy.ai.voice.eyebrow}</a>
          </div>
        </div>
        <AgentConstellation />
      </div>
      <div className="ms-ai-hero-ribbon">
        <SparkRibbon items={copy.ai.home.chips} label={copy.ai.team.eyebrow} />
      </div>
    </header>
  )
}

/** One card per assistant: what it does, what it reads, and a sample of what it proposes. */
export function AgentGrid() {
  const { copy } = useSite()
  const ai = copy.ai
  return (
    <section className="ms-section ms-section--alt" id="team" aria-labelledby="ms-team-title">
      <div className="ms-wrap">
        <div className="ms-head" data-section-anchor data-rv>
          <p className="ms-eyebrow">{ai.team.eyebrow}</p>
          <h2 className="ms-h2" id="ms-team-title">{ai.team.title}</h2>
          <p className="ms-lead">{ai.team.lead}</p>
        </div>
        <ul className="ms-agent-grid">
          {ai.assistants.map((assistant, i) => {
            const Icon = ASSISTANT_ICONS[i]
            return (
              <li key={assistant.name} className="ms-agent" data-glow data-rv style={{ '--rv-delay': `${(i % 4) * 60}ms` } as CSSProperties}>
                <div className="ms-agent-head">
                  <span className="ms-agent-orb"><Icon size={20} aria-hidden="true" /></span>
                  <div>
                    <h3>{assistant.name}</h3>
                    <small><Clock3 size={13} aria-hidden="true" />{assistant.when}</small>
                  </div>
                </div>
                <p className="ms-agent-does">{assistant.does}</p>
                <div className="ms-agent-reads">
                  <span className="ms-agent-reads-label">{ai.team.readsLabel}</span>
                  <ul>{assistant.reads.split(', ').map((source) => <li key={source}>{source}</li>)}</ul>
                </div>
                {/* The proposal as it lands on the manager's phone */}
                <div className="ms-notif">
                  <div className="ms-notif-head">
                    <BrandMark size={18} />
                    <b>MaSoVa</b>
                    <span>{ai.team.proposalLabel}</span>
                  </div>
                  <p>{assistant.example}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/** MaSoVa Voice: a spoken exchange that alternates between a guest and a manager. */
export function VoiceSection() {
  const { copy } = useSite()
  const voice = copy.ai.voice
  const reduced = usePrefersReducedMotion()
  // Each tick moves the exchange on: guest asks, MaSoVa answers, then the manager, and round again.
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => setTick((t) => t + 1), 3200)
    return () => window.clearInterval(id)
  }, [reduced])

  const turn = reduced ? 0 : Math.floor(tick / 2) % voice.talks.length
  const phase: 'ask' | 'answer' = reduced || tick % 2 === 1 ? 'answer' : 'ask'
  const talk = voice.talks[turn]
  return (
    <section className="ms-section ms-voice" id="voice" aria-labelledby="ms-voice-title">
      <div className="ms-wrap ms-voice-grid">
        <div data-section-anchor data-rv>
          <p className="ms-eyebrow">{voice.eyebrow}</p>
          <h2 className="ms-h2" id="ms-voice-title">{voice.title}</h2>
          <p className="ms-lead">{voice.lead}</p>
          <p className="ms-voice-status"><StatusChip status="preview" /><span>{voice.note}</span></p>
        </div>
        <figure className="ms-voice-console ms-on-dark" data-rv data-phase={phase} aria-hidden="true">
          <div className="ms-voice-orb">
            <span className="ms-voice-ring" />
            <span className="ms-voice-ring" />
            <span className="ms-voice-core">{phase === 'ask' ? <Mic size={26} /> : <Volume2 size={26} />}</span>
          </div>
          <div className="ms-voice-wave">
            {Array.from({ length: 28 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}
          </div>
          <p className="ms-voice-state">{phase === 'ask' ? voice.listening : voice.answering}</p>
          <div className="ms-voice-talk" key={turn}>
            <small>{talk.who}</small>
            <p className="ms-voice-ask">{talk.ask}</p>
            <p className="ms-voice-answer" data-shown={phase === 'answer'}>
              <Sparkles size={14} />
              {talk.answer}
            </p>
          </div>
        </figure>
      </div>
    </section>
  )
}
