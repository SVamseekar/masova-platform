/** Product-page scenes for guests and insights, plus the AI page's two assistant scenes. */
import { ArrowUp, Check, Download, FileArchive, MessageCircle, Search, Send } from 'lucide-react'
import { BrandMark } from '../Brand'
import { Avatar, Caret, Photo, Scene, cyc, eur, prog, typed, useScene, whole } from './kit'

/* ---------- Guests ---------- */

/** Elena's loyalty card, tilted, with points counting toward Platinum. */
export function GuestCardScene() {
  const { tick, ref, still } = useScene(700)
  const p = prog(tick, still, 14, 6)
  const points = 3900 + 220 * p
  return (
    <Scene kind="object" name="g-card" sceneRef={ref}>
      <div className="sc-loyalty">
        <header><b>Riverside Kitchen</b><span>Gold</span></header>
        <strong className="ms-num">{whole(points)}</strong>
        <small>points · {whole(5000 - points)} to Platinum</small>
        <div className="sc-loyalty-bar"><i style={{ width: `${(points / 5000) * 100}%` }} /></div>
        <footer><span>Elena L.</span><span>Member since 2025</span></footer>
      </div>
      <span className="sc-card sc-chip sc-tag-a">Office orders</span>
      <span className="sc-card sc-chip sc-tag-b">Vegetarian</span>
      <span className="sc-card sc-chip sc-tag-c">Margherita × 11</span>
    </Scene>
  )
}

const CAMPAIGN = 'We miss you, Elena! Enjoy 10% off your next order this weekend at Riverside Kitchen.'

/** A win-back message is written, aimed at quiet guests and scheduled for Friday. */
export function GuestCampaignScene() {
  const { tick, ref, still } = useScene(70)
  const text = typed(CAMPAIGN, tick, still, 40)
  const done = text.length === CAMPAIGN.length
  return (
    <Scene kind="composer" name="g-camp" sceneRef={ref}>
      <div className="sc-card sc-compose-card">
        <header><span className="sc-aud">Quiet for 30 days · <b>42 guests</b></span><span className="sc-chans"><i data-on="true">SMS</i><i data-on="true">Email</i><i>Push</i></span></header>
        <div className="sc-bubble">{text}<Caret on={!done} /></div>
        <footer><span className="sc-when">Friday · 17:00</span><span className="sc-send" data-on={done}>{done ? <><Check size={14} strokeWidth={3} /> Scheduled</> : 'Schedule'}</span></footer>
      </div>
    </Scene>
  )
}

const REPLY = 'Thank you, Marco, and sorry the delivery ran late. We have added a driver on Friday evenings so it does not happen again.'

/** A three-star review and the reply an assistant drafts for the manager to check. */
export function GuestReviewScene() {
  const { tick, ref, still } = useScene(60)
  const text = typed(REPLY, tick, still, 50)
  const done = text.length === REPLY.length
  return (
    <Scene kind="thread" name="g-review" sceneRef={ref}>
      <div className="sc-card sc-review">
        <header><Avatar name="Marco Testa" i={1} /><div><b>Marco T.</b><small>Old Town · delivery · yesterday</small></div><span className="sc-stars-3">★★★<i>★★</i></span></header>
        <p>“Lovely pasta, but the delivery took 40 minutes longer than promised.”</p>
      </div>
      <div className="sc-card sc-reply">
        <small><BrandMark size={14} /> Drafted by the review assistant · check before sending</small>
        <p>{text}<Caret on={!done} /></p>
        <span className="sc-send" data-on={done}><Send size={13} /> Send reply</span>
      </div>
    </Scene>
  )
}

const LEDGER: [string, string][] = [['12 Mar 2025', 'Agreed to order updates'], ['02 Jun 2025', 'Agreed to offers by email'], ['21 Nov 2026', 'Asked for a copy of her data']]

/** A guest asks for her data; the export is built and sent, next to her consent record. */
export function GuestPrivacyScene() {
  const { tick, ref, still } = useScene(500)
  const p = prog(tick, still, 16, 8)
  const ready = p >= 1
  return (
    <Scene kind="export" name="g-privacy" sceneRef={ref}>
      <div className="sc-card sc-ledger">
        <header className="sc-head"><b>Consent · Elena L.</b></header>
        <ol>{LEDGER.map(([when, what]) => <li key={when}><time>{when}</time><span>{what}</span></li>)}</ol>
      </div>
      <div className="sc-card sc-file" data-ready={ready}>
        <span className="sc-file-icon"><FileArchive size={22} /></span>
        <div><b>elena-l-data.zip</b><small>{ready ? '48 KB · sent to elena@… · 19:51' : `Preparing · ${Math.round(p * 100)}%`}</small><div className="sc-file-bar"><i style={{ width: `${p * 100}%` }} /></div></div>
        <span className="sc-file-state">{ready ? <Check size={16} strokeWidth={3} /> : <Download size={16} />}</span>
      </div>
    </Scene>
  )
}

/* ---------- Insights ---------- */

/** Four live numbers for right now, ticking. */
export function InsightLiveScene() {
  const { tick, ref, still } = useScene(1500)
  const load = still ? 72 : 64 + Math.round(Math.sin(tick / 2) * 10)
  const r = 34
  const len = 2 * Math.PI * r
  return (
    <Scene kind="kpis" name="i-live" sceneRef={ref}>
      <div className="sc-card sc-kpi"><small>Orders today</small><strong className="ms-num" key={tick}>{214 + tick}</strong><em>+12% vs last Fri</em></div>
      <div className="sc-card sc-kpi"><small>Sales</small><strong className="ms-num">{eur(6920 + tick * 23, 0)}</strong><em>3 sites</em></div>
      <div className="sc-card sc-kpi sc-kpi--ring">
        <small>Kitchen load</small>
        <span className="sc-mini-ring"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r={r} className="sc-ring-track" /><circle cx="40" cy="40" r={r} className="sc-ring-fill" strokeDasharray={len} strokeDashoffset={len * (1 - load / 100)} /></svg><b className="ms-num">{load}%</b></span>
      </div>
      <div className="sc-card sc-kpi"><small>Drivers out</small><strong className="ms-num">{4 + (Math.floor(tick / 4) % 2)}</strong><em>avg 24 min</em></div>
    </Scene>
  )
}

const MARGINS: [string, number, string][] = [['Margherita', 73, '€8.76'], ['Greek salad', 70, '€6.65'], ['Mushroom risotto', 69, '€10.00'], ['Chicken tikka masala', 61, '€9.15']]

/** Margin per dish, ranked; each one gets its moment. */
export function InsightMarginScene() {
  const { tick, ref, still } = useScene(1300)
  const p = prog(tick, still, 20, 5)
  const on = still ? 0 : Math.floor(tick / 2) % MARGINS.length
  return (
    <Scene kind="bars" name="i-margin" sceneRef={ref}>
      <header className="sc-bars-head"><small>Gross margin by dish · this month</small><strong>Old Town</strong></header>
      {MARGINS.map(([dish, m, per], i) => (
        <div key={dish} className="sc-rank" data-on={i === on}>
          <span>{dish}</span>
          <div className="sc-rank-bar"><i style={{ width: `${m * p}%` }} /></div>
          <em className="ms-num">{Math.round(m * p)}%</em>
          <small className="sc-rank-tip">{per} kept per dish</small>
        </div>
      ))}
    </Scene>
  )
}

const STORE_CARDS = [['Old Town', 'Berlin', 'EUR'], ['Riverside', 'Amsterdam', 'EUR'], ['Station', 'London', 'GBP']]

/** The autumn menu flies from one store to the other two. */
export function InsightStoresScene() {
  const { tick, ref, still } = useScene(900)
  const t = still ? 99 : cyc(tick, 10)
  return (
    <Scene kind="stores" name="i-stores" sceneRef={ref}>
      <div className="sc-stores">
        {STORE_CARDS.map(([name, city, cur], i) => {
          const has = i === 0 || t >= 3 + i * 2
          return (
            <div key={name} className="sc-card sc-store-card" data-has={has}>
              <b>{name}</b><small>{city} · {cur}</small>
              <span className="sc-menu-chip" data-on={has}>{has ? <><Check size={12} strokeWidth={3} /> Autumn menu</> : 'Summer menu'}</span>
            </div>
          )
        })}
        {!still && t >= 2 && t < 8 && <span className="sc-flying" data-to={t < 5 ? 1 : 2} key={t < 5 ? 'a' : 'b'}>Autumn menu</span>}
      </div>
    </Scene>
  )
}

const QUESTION = 'Which dishes should we prep more of on Friday?'
const ANSWER: [string, number][] = [['Margherita', 92], ['Tikka masala', 74], ['Greek salad', 58]]

/** A question typed into the manager chat, answered with Friday's forecast. */
export function InsightAskScene() {
  const { tick, ref, still } = useScene(80)
  const asked = typed(QUESTION, tick, still, 70)
  const done = asked.length === QUESTION.length
  const after = still ? 99 : (tick % (QUESTION.length + 70)) - QUESTION.length
  return (
    <Scene kind="ask" name="i-ask" sceneRef={ref}>
      <div className="sc-card sc-askbar"><Search size={18} /><span>{asked}<Caret on={!done} /></span><i><ArrowUp size={15} /></i></div>
      <div className="sc-card sc-answer" data-on={done && after > 6}>
        <p>Friday looks <b>25% busier</b> than a usual Friday. Prep more of these:</p>
        {ANSWER.map(([dish, v], i) => (
          <div key={dish} className="sc-answer-row"><span>{dish}</span><div><i style={{ width: done && after > 10 + i * 4 ? `${v}%` : 0 }} /></div><b className="ms-num">+{Math.round(v / 3)}%</b></div>
        ))}
        <small>From orders over the last 8 Fridays</small>
      </div>
    </Scene>
  )
}

/* ---------- AI page ---------- */

const COPILOT = 'Orders are up 12% across three stores. Old Town’s kitchen is three minutes slower than usual, mostly on pizzas. Two proposals are waiting for you.'
const SOURCES = ['Orders', 'Kitchen timers', 'Proposals']

/** The Copilot answers, and the sources light up as it uses them. */
export function AiCopilotScene() {
  const { tick, ref, still } = useScene(55)
  const text = typed(COPILOT, tick, still, 60)
  const frac = text.length / COPILOT.length
  return (
    <Scene kind="thread" name="a-copilot" sceneRef={ref}>
      <div className="sc-card sc-q"><Avatar name="Sara Rossi" i={3} /><p>How are we doing tonight compared with last Friday?</p></div>
      <div className="sc-card sc-a">
        <header><BrandMark size={18} /><b>Copilot</b><small>All stores</small></header>
        <p>{text}<Caret on={frac < 1} /></p>
        <div className="sc-sources">{SOURCES.map((s, i) => <span key={s} data-on={frac > (i + 1) / (SOURCES.length + 1)}>{s}</span>)}</div>
      </div>
    </Scene>
  )
}

/** The guest chat on the restaurant's own site, over the dish the guest is asking about. */
export function AiGuestChatScene() {
  const { tick, ref, still } = useScene(1100)
  const t = still ? 99 : cyc(tick, 10)
  return (
    <Scene kind="photo" name="a-guest" sceneRef={ref}>
      <Photo src="/site/menu/mushroom-risotto.webp" />
      <div className="sc-card sc-widget">
        <header><BrandMark size={18} /><b>Riverside Kitchen</b><small>Usually replies at once</small></header>
        <div className="sc-widget-body">
          <p className="sc-me">Is the risotto gluten free?</p>
          {t >= 2 && <p className="sc-bot">Yes. It contains milk and celery.</p>}
          {t >= 4 && <p className="sc-me">Can I collect at 19:45?</p>}
          {t >= 6 && <p className="sc-bot">Yes, 19:45 is free. Shall I start the order?</p>}
        </div>
        <footer><MessageCircle size={14} /> Message</footer>
      </div>
    </Scene>
  )
}
