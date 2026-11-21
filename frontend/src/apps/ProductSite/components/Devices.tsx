/**
 * Realistic hardware for the site's product previews: phone, laptop, counter tablet,
 * kitchen screen and kiosk, plus the app bar each MaSoVa screen carries. The frames are
 * decoration (aria-hidden); the caller describes the screen in text.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { BrandMark } from './Brand'
import { usePrefersReducedMotion } from './Effects'

type FrameRef = (node: HTMLElement | null) => void

/**
 * A step counter for a preview's animation. It counts only while the preview is on screen
 * and the tab is visible, so a page with many previews runs only the ones in view.
 * With reduced motion it stays at 0 and `still` is true: the preview should then show its
 * finished state.
 */
export function usePreviewClock(intervalMs = 1000): { tick: number; ref: FrameRef; still: boolean } {
  const still = usePrefersReducedMotion()
  const [tick, setTick] = useState(0)
  const [node, setNode] = useState<HTMLElement | null>(null)
  const [onScreen, setOnScreen] = useState(false)

  useEffect(() => {
    if (!node || still || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => setOnScreen(entries.some((e) => e.isIntersecting)), { threshold: 0.15 })
    observer.observe(node)
    return () => {
      observer.disconnect()
      setOnScreen(false)
    }
  }, [node, still])

  useEffect(() => {
    if (!onScreen || still) return
    const id = window.setInterval(() => {
      if (!document.hidden) setTick((t) => t + 1)
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [onScreen, still, intervalMs])

  return { tick: still ? 0 : tick, ref: setNode, still }
}

/** Status bar icons drawn like iOS: signal, wifi, battery. */
export function StatusIcons() {
  return (
    <span className="dv-status-icons">
      <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="4.5" y="5" width="3" height="6" rx="1" /><rect x="9" y="2.5" width="3" height="8.5" rx="1" /><rect x="13.5" y="0" width="3" height="11" rx="1" /></svg>
      <svg width="15" height="11" viewBox="0 0 15 11"><path d="M7.5 2.2c2.1 0 4 .8 5.4 2.1l1.1-1.1A9.3 9.3 0 0 0 7.5.6 9.3 9.3 0 0 0 1 3.2l1.1 1.1a7.7 7.7 0 0 1 5.4-2.1Zm0 3.2c1.2 0 2.3.5 3.1 1.2l1.1-1.1a6 6 0 0 0-8.4 0l1.1 1.1a4.4 4.4 0 0 1 3.1-1.2Zm0 3.2c-.5 0-.9.2-1.2.5l1.2 1.2 1.2-1.2c-.3-.3-.7-.5-1.2-.5Z" /></svg>
      <svg width="25" height="12" viewBox="0 0 25 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" fill="none" stroke="currentColor" strokeOpacity="0.4" /><rect x="2" y="2" width="16" height="8" rx="2" /><rect x="22.5" y="4" width="1.6" height="4" rx="0.8" fillOpacity="0.4" /></svg>
    </span>
  )
}

function cls(base: string, extra?: string): string {
  return extra ? `${base} ${extra}` : base
}

/**
 * A phone with a thin metal frame, side keys, Dynamic Island, status bar and home indicator.
 * `fit` makes it fill its container (previews); without it the phone keeps its showcase size.
 */
export function PhoneFrame({ children, className, frameRef, fit, time = '9:41' }: { children: ReactNode; className?: string; frameRef?: FrameRef; fit?: boolean; time?: string }) {
  return (
    <div ref={frameRef} className={cls(fit ? 'dv-phone dv-phone--fit' : 'dv-phone', className)} aria-hidden="true">
      <div className="dv-phone-screen">
        <div className="dv-status">
          <span>{time}</span>
          <span className="dv-island" />
          <StatusIcons />
        </div>
        {children}
        <span className="dv-home" />
      </div>
    </div>
  )
}

/** A laptop: dark bezel with camera, the screen, and an aluminium base with a thumb notch. */
export function LaptopFrame({ children, className, frameRef }: { children: ReactNode; className?: string; frameRef?: FrameRef }) {
  return (
    <div ref={frameRef} className={cls('dv-laptop', className)} aria-hidden="true">
      <div className="dv-laptop-lid">
        <span className="dv-cam" />
        <div className="dv-laptop-screen">{children}</div>
      </div>
      <div className="dv-laptop-base"><span /></div>
    </div>
  )
}

/** A landscape tablet; with `stand` it sits on a counter stand like a till. */
export function TabletFrame({ children, className, frameRef, stand }: { children: ReactNode; className?: string; frameRef?: FrameRef; stand?: boolean }) {
  return (
    <div ref={frameRef} className={cls(stand ? 'dv-tablet dv-tablet--stand' : 'dv-tablet', className)} aria-hidden="true">
      <div className="dv-tablet-body">
        <span className="dv-cam" />
        <div className="dv-tablet-screen">{children}</div>
      </div>
      {stand && <div className="dv-stand"><i /><b /></div>}
    </div>
  )
}

/** A wall-mounted kitchen screen: thick bezel, a chin with a power light, and a bracket. */
export function KitchenScreen({ children, className, frameRef }: { children: ReactNode; className?: string; frameRef?: FrameRef }) {
  return (
    <div ref={frameRef} className={cls('dv-kitchen', className)} aria-hidden="true">
      <span className="dv-kitchen-mount" />
      <div className="dv-kitchen-body">
        <div className="dv-kitchen-screen">{children}</div>
        <span className="dv-kitchen-led" />
      </div>
    </div>
  )
}

/** A self-order kiosk: tall portrait screen in a light housing, a card reader, and a plinth. */
export function KioskFrame({ children, className, frameRef }: { children: ReactNode; className?: string; frameRef?: FrameRef }) {
  return (
    <div ref={frameRef} className={cls('dv-kiosk', className)} aria-hidden="true">
      <div className="dv-kiosk-body">
        <div className="dv-kiosk-screen">{children}</div>
        <div className="dv-kiosk-panel"><i /><b /></div>
      </div>
      <span className="dv-kiosk-neck" />
      <span className="dv-kiosk-foot" />
    </div>
  )
}

/** The top bar of a MaSoVa screen: mark, screen title, store, live status and the signed-in person. */
export function AppBar({ title, store, user, live, dark }: { title: string; store?: string; user?: string; live?: boolean; dark?: boolean }) {
  const initials = user ? user.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() : ''
  return (
    <div className={dark ? 'dv-appbar dv-appbar--dark' : 'dv-appbar'}>
      <BrandMark size={16} />
      <b>{title}</b>
      {store && <span className="dv-store">{store}<svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 3l2.5 2.5L6.5 3" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg></span>}
      <span className="dv-appbar-end">
        {live && <span className="pv-live">Live</span>}
        {user && <span className="dv-user" title={user}>{initials}</span>}
      </span>
    </div>
  )
}
