/**
 * Building blocks for product scenes. A scene shows one moment of the product at real
 * reading size: floating cards, a photo with a live card, a cropped screen, big type or a
 * chart. Every scene on the site is different; these pieces only keep the details consistent.
 */
import type { CSSProperties, ReactNode } from 'react'
import { usePreviewClock } from '../Devices'

export const useScene = usePreviewClock

export function Scene({ kind, name, sceneRef, children }: { kind: string; name: string; sceneRef: (node: HTMLElement | null) => void; children: ReactNode }) {
  return (
    <div ref={sceneRef} className={`sc sc-${kind} sc-${name}`} aria-hidden="true">
      {children}
    </div>
  )
}

export function Photo({ src }: { src: string }) {
  return <img className="sc-bg" src={src} alt="" loading="lazy" decoding="async" />
}

const TINTS = ['#c9a27a', '#9fb4a6', '#d7a08a', '#a9b7c9', '#b6a6c4', '#c7b98a']

export function Avatar({ name, i = 0, size }: { name: string; i?: number; size?: number }) {
  const initials = name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase()
  const style = { '--tint': TINTS[i % TINTS.length], ...(size ? { '--size': `${size}px` } : {}) } as CSSProperties
  return <span className="sc-avatar" style={style}>{initials}</span>
}

/** Step within a cycle. */
export function cyc(tick: number, length: number): number {
  return tick % length
}

/** 0 → 1 over the first `steps` ticks of each `length`-tick cycle; 1 when still. */
export function prog(tick: number, still: boolean, length: number, steps: number): number {
  if (still) return 1
  const t = Math.min(1, (tick % length) / steps)
  return 1 - (1 - t) ** 2
}

export function eur(value: number, decimals = 2): string {
  return `€${value.toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

export function whole(value: number): string {
  return Math.round(value).toLocaleString('en-GB')
}

export function clock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** The part of `text` typed so far; holds the full text, then starts again. */
export function typed(text: string, tick: number, still: boolean, hold = 30): string {
  return still ? text : text.slice(0, tick % (text.length + hold))
}

export function Caret({ on }: { on: boolean }) {
  return on ? <span className="sc-caret" /> : null
}
