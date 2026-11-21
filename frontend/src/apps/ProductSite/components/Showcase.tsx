import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowUp, Check, Image as ImageIcon, MessageSquare, Mic, Pause, Search, Plus, Bell } from 'lucide-react'
import { useSite } from '../SiteContext'
import { Aurora, SparkRibbon, type AuroraTone } from './Aurora'
import { BrandMark } from './Brand'
import { SectionHead } from './Layout'
import { usePrefersReducedMotion } from './Effects'

/** A rounded product card: soft backdrop, a title and line of text, and a screen that runs off the edge. */
function Card({ tone, title, text, dark, children }: { tone: AuroraTone; title: string; text: string; dark?: boolean; children: ReactNode }) {
  return (
    <li className={dark ? 'ms-prep-card ms-on-dark' : 'ms-prep-card'} data-rv>
      <Aurora tone={tone} />
      <div className="ms-prep-copy">
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      <div className="ms-prep-stage" aria-hidden="true">{children}</div>
    </li>
  )
}

/** Status bar icons drawn like iOS: signal, wifi, battery. */
function StatusIcons() {
  return (
    <span className="dv-status-icons">
      <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="4.5" y="5" width="3" height="6" rx="1" /><rect x="9" y="2.5" width="3" height="8.5" rx="1" /><rect x="13.5" y="0" width="3" height="11" rx="1" /></svg>
      <svg width="15" height="11" viewBox="0 0 15 11"><path d="M7.5 2.2c2.1 0 4 .8 5.4 2.1l1.1-1.1A9.3 9.3 0 0 0 7.5.6 9.3 9.3 0 0 0 1 3.2l1.1 1.1a7.7 7.7 0 0 1 5.4-2.1Zm0 3.2c1.2 0 2.3.5 3.1 1.2l1.1-1.1a6 6 0 0 0-8.4 0l1.1 1.1a4.4 4.4 0 0 1 3.1-1.2Zm0 3.2c-.5 0-.9.2-1.2.5l1.2 1.2 1.2-1.2c-.3-.3-.7-.5-1.2-.5Z" /></svg>
      <svg width="25" height="12" viewBox="0 0 25 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" fill="none" stroke="currentColor" strokeOpacity="0.4" /><rect x="2" y="2" width="16" height="8" rx="2" /><rect x="22.5" y="4" width="1.6" height="4" rx="0.8" fillOpacity="0.4" /></svg>
    </span>
  )
}

/** A realistic phone: thin metal frame, side keys, Dynamic Island, status bar and home indicator. */
export function Device({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className ? `dv-phone ${className}` : 'dv-phone'}>
      <div className="dv-phone-screen">
        <div className="dv-status">
          <span>9:41</span>
          <span className="dv-island" />
          <StatusIcons />
        </div>
        {children}
        <span className="dv-home" />
      </div>
    </div>
  )
}

function Avatar({ name, tint }: { name: string; tint: string }) {
  return <span className="dv-avatar" style={{ '--tint': tint } as CSSProperties}>{name.slice(0, 1)}</span>
}

/** Ask in plain words: a manager asks the Copilot; it checks, then answers. */
function ChatScreen() {
  const { copy } = useSite()
  const chat = copy.showcase.chat
  const reduced = usePrefersReducedMotion()
  const [stage, setStage] = useState(0)

  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => setStage((s) => (s + 1) % 4), 2200)
    return () => window.clearInterval(id)
  }, [reduced])

  // stage 0: question only · 1: checking · 2 and 3: answer shown
  const shown = reduced ? 3 : stage
  return (
    <Device className="ms-prep-phone">
      <div className="dv-app-bar">
        <BrandMark size={22} />
        <span className="dv-app-actions"><i><Search size={13} /></i><i><Plus size={13} /></i><i><Bell size={13} /></i></span>
      </div>
      <div className="dv-chat">
        <div className="dv-msg">
          <Avatar name={chat.name} tint="#c9a27a" />
          <div>
            <p className="dv-msg-meta"><b>{chat.name}</b> {chat.role} · 21:04</p>
            <p>{chat.ask}</p>
          </div>
        </div>
        <div className="dv-msg" data-hidden={shown < 1}>
          <span className="dv-avatar dv-avatar--brand"><BrandMark size={26} /></span>
          <div>
            <p className="dv-msg-meta"><b>MaSoVa</b> 21:04</p>
            {shown === 1 ? <p className="dv-thinking">{chat.thinking}<span><i /><i /><i /></span></p> : <p>{chat.answer}</p>}
          </div>
        </div>
      </div>
      <div className="dv-input">
        <span>{chat.input}</span>
        <i className="dv-input-mic"><Mic size={13} /></i>
        <i className="dv-input-send"><ArrowUp size={13} /></i>
      </div>
    </Device>
  )
}

/** Hear it as it is said: a live transcript, typed as it is heard, with the recorder bar below. */
function VoiceScreen() {
  const { copy } = useSite()
  const talk = copy.ai.voice.talks[0]
  const answer = talk.answer
  const reduced = usePrefersReducedMotion()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (reduced) return
    // types the answer, holds it for a moment, then starts again
    const id = window.setInterval(() => setTick((c) => (c >= answer.length + 24 ? 0 : c + 1)), 55)
    return () => window.clearInterval(id)
  }, [reduced, answer])

  const chars = reduced ? answer.length : tick

  const seconds = Math.min(59, Math.floor(chars / 5) + 3)
  return (
    <div className="dv-transcript">
      <div className="dv-line">
        <Avatar name={talk.who} tint="#9fb4a6" />
        <span className="dv-time">0:01</span>
        <p>{talk.ask}</p>
      </div>
      <div className="dv-line dv-line--live">
        <span className="dv-avatar dv-avatar--brand"><BrandMark size={26} /></span>
        <span className="dv-time">0:03</span>
        <p>{answer.slice(0, chars)}<span className="dv-caret" /></p>
      </div>
      <div className="dv-recorder">
        <i><Mic size={15} /></i>
        <i><MessageSquare size={15} /></i>
        <i><ImageIcon size={15} /></i>
        <span className="dv-timer">00:{String(seconds).padStart(2, '0')}</span>
        <span className="dv-mini-wave">{Array.from({ length: 9 }, (_, i) => <b key={i} style={{ '--i': i } as CSSProperties} />)}</span>
        <i className="dv-pause"><Pause size={15} /></i>
        <i className="dv-stop"><span /></i>
      </div>
    </div>
  )
}

/** Approve in one tap: the day's proposals, checked off one by one with who approved them. */
function ApprovalScreen() {
  const { copy } = useSite()
  const items = copy.ai.inbox.items.slice(0, 4)
  const tints = ['#c9a27a', '#9fb4a6', '#d7a08a', '#a9b7c9']
  const reduced = usePrefersReducedMotion()
  const [step, setStep] = useState(1)
  const done = reduced ? 2 : step

  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => setStep((d) => (d >= items.length ? 0 : d + 1)), 1500)
    return () => window.clearInterval(id)
  }, [reduced, items.length])

  return (
    <ul className="dv-tasks">
      {items.map((item, i) => (
        <li key={item.title} data-done={i < done} style={{ '--i': i } as CSSProperties}>
          <span className="dv-check">{i < done && <Check size={13} strokeWidth={3} />}</span>
          <span className="dv-task-text">{item.action}</span>
          <span className="dv-impact">{item.impact}</span>
          <Avatar name={['A', 'M', 'L', 'R'][i]} tint={tints[i]} />
        </li>
      ))}
    </ul>
  )
}

/** "What MaSoVa prepares": four cards, each with a screen you could mistake for the real thing. */
export function ShowcaseSection() {
  const { copy } = useSite()
  const s = copy.showcase
  return (
    <section className="ms-section ms-prep" aria-labelledby="ms-prep-title">
      <div className="ms-wrap">
        <SectionHead id="ms-prep-title" eyebrow={s.eyebrow} title={s.title} lead={s.lead} />
        <ul className="ms-prep-grid">
          <Card tone="forest" dark title={s.cards[0].title} text={s.cards[0].text}>
            <SparkRibbon items={copy.ai.home.chips} />
          </Card>
          <Card tone="sand" title={s.cards[1].title} text={s.cards[1].text}>
            <ChatScreen />
          </Card>
          <Card tone="sage" title={s.cards[2].title} text={s.cards[2].text}>
            <VoiceScreen />
          </Card>
          <Card tone="clay" title={s.cards[3].title} text={s.cards[3].text}>
            <ApprovalScreen />
          </Card>
        </ul>
        <p className="ms-prep-note">{copy.ui.sampleData}</p>
      </div>
    </section>
  )
}
