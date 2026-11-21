import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PRODUCT_AREAS } from '../locales'
import { AppPreview, AreaPreview, AreaThumb, DashboardPreview, DriverPhone, KdsPreview, ReviewsPreview, SupportPhone } from './Previews'

const FRAME = '.dv-laptop, .dv-tablet, .dv-kitchen, .dv-phone, .dv-kiosk, .sc'
const GROUPS = 4
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

describe('product previews', () => {
  const original = window.matchMedia
  beforeEach(() => setReducedMotion(true))
  afterEach(() => { window.matchMedia = original })

  it('puts every area preview on realistic hardware, never the old flat frames', () => {
    for (const area of PRODUCT_AREAS) {
      for (let group = 0; group < GROUPS; group++) {
        const { container, unmount } = render(<AreaPreview area={area} group={group} />)
        expect(container.querySelector(FRAME), `${area} ${group}`).not.toBeNull()
        expect(container.querySelector('.pv-window, .pv-phone, .pv-panel, .pv-tablet'), `${area} ${group}`).toBeNull()
        unmount()
      }
      const { container, unmount } = render(<AreaThumb area={area} />)
      expect(container.querySelector(FRAME), `thumb ${area}`).not.toBeNull()
      unmount()
    }
  })

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
    const { unmount: a } = render(<AreaPreview area="stock" group={0} />)
    expect(screen.getByText('Mozzarella')).toBeInTheDocument()
    expect(screen.getAllByText('Low').length).toBeGreaterThan(0)
    a()

    const { unmount: b } = render(<DashboardPreview />)
    expect(screen.getByText('Stock reorder')).toBeInTheDocument()
    b()

    const { unmount: c } = render(<AreaPreview area="counter" group={0} />)
    expect(screen.getByText('Send to kitchen')).toBeInTheDocument()
    c()

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

    render(<ReviewsPreview />)
    expect(screen.getByText(/sorry the delivery ran late/)).toBeInTheDocument()
  })
})
