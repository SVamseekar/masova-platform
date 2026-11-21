import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePreviewClock } from './Devices'

type Callback = (entries: { isIntersecting: boolean }[]) => void
let observers: Callback[] = []

class StubObserver {
  private readonly cb: Callback
  constructor(cb: Callback) {
    this.cb = cb
    observers.push(cb)
  }
  observe() {}
  disconnect() {
    observers = observers.filter((o) => o !== this.cb)
  }
  takeRecords() { return [] }
  unobserve() {}
}

function trigger(isIntersecting: boolean) {
  act(() => observers.forEach((cb) => cb([{ isIntersecting }])))
}

function setReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

function Probe() {
  const { tick, ref, still } = usePreviewClock(1000)
  return <div ref={ref} data-testid="probe" data-still={still}>{tick}</div>
}

describe('usePreviewClock', () => {
  const original = { io: globalThis.IntersectionObserver, mm: window.matchMedia }

  beforeEach(() => {
    vi.useFakeTimers()
    observers = []
    globalThis.IntersectionObserver = StubObserver as unknown as typeof IntersectionObserver
    setReducedMotion(false)
  })

  afterEach(() => {
    vi.useRealTimers()
    globalThis.IntersectionObserver = original.io
    window.matchMedia = original.mm
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  })

  it('stays at 0 and reports still with reduced motion', () => {
    setReducedMotion(true)
    render(<Probe />)
    trigger(true)
    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getByTestId('probe').textContent).toBe('0')
    expect(screen.getByTestId('probe').dataset.still).toBe('true')
  })

  it('does not tick until the preview is on screen', () => {
    render(<Probe />)
    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getByTestId('probe').textContent).toBe('0')
  })

  it('ticks while on screen and stops when scrolled away', () => {
    render(<Probe />)
    trigger(true)
    act(() => { vi.advanceTimersByTime(3000) })
    expect(screen.getByTestId('probe').textContent).toBe('3')
    trigger(false)
    act(() => { vi.advanceTimersByTime(3000) })
    expect(screen.getByTestId('probe').textContent).toBe('3')
  })

  it('pauses while the tab is hidden', () => {
    render(<Probe />)
    trigger(true)
    act(() => { vi.advanceTimersByTime(2000) })
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    act(() => { vi.advanceTimersByTime(3000) })
    expect(screen.getByTestId('probe').textContent).toBe('2')
  })
})
