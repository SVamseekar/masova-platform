import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppPreview, DashboardPreview, DriverPhone, KdsPreview, SupportPhone } from './Previews'

const FRAME = '.dv-laptop, .dv-tablet, .dv-kitchen, .dv-phone, .dv-kiosk'
const APPS = ['web', 'counter', 'kiosk', 'kds', 'driver', 'manager', 'agents', 'support', 'customer-app', 'staff-app', 'copilot', 'voice']

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

describe('app previews', () => {
  const original = window.matchMedia
  beforeEach(() => setReducedMotion(true))
  afterEach(() => { window.matchMedia = original })

  it('puts every app preview on realistic hardware', () => {
    for (const app of APPS) {
      const { container, unmount } = render(<AppPreview app={app} />)
      expect(container.querySelector(FRAME), app).not.toBeNull()
      unmount()
    }
    const { container } = render(<AppPreview app="kiosk" />)
    expect(container.querySelector('.dv-kiosk')).not.toBeNull()
  })

  it('shows the finished state with reduced motion', () => {
    const { unmount: b } = render(<DashboardPreview />)
    expect(screen.getByText('Stock reorder')).toBeInTheDocument()
    b()

    const { unmount: d } = render(<KdsPreview />)
    expect(screen.getAllByText('Ready').length).toBeGreaterThan(0)
    d()

    const { container, unmount: e } = render(<DriverPhone />)
    expect([...container.querySelectorAll('.pv-otp span')].map((s) => s.textContent).join('')).toBe('4817')
    e()

    const { unmount: f } = render(<SupportPhone />)
    expect(screen.getByText(/Raj is about 12 minutes away/)).toBeInTheDocument()
    expect(screen.getByText(/It contains milk and celery/)).toBeInTheDocument()
    f()
  })
})
