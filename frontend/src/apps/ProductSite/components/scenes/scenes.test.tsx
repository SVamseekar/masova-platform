import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { PRODUCT_AREAS } from '../../locales'
import { AiCopilotScene, AiGuestChatScene, AreaScene, AreaThumbScene, HeroTonightScene, JourneyAiScene, JourneyDriverScene, JourneyKitchenScene, JourneyManagerScene, JourneyOrderScene, RoleScene } from '.'

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

/** Every place on the site that shows a scene. */
function placements(): [string, ReactNode][] {
  const list: [string, ReactNode][] = [
    ['hero', <HeroTonightScene />],
    ['journey 1', <JourneyOrderScene />],
    ['journey 2', <JourneyKitchenScene />],
    ['journey 3', <JourneyDriverScene />],
    ['journey 4', <JourneyManagerScene />],
    ['journey 5', <JourneyAiScene />],
    ['ai copilot', <AiCopilotScene />],
    ['ai guest chat', <AiGuestChatScene />],
  ]
  for (let i = 0; i < 6; i++) list.push([`role ${i}`, <RoleScene index={i} />])
  for (const area of PRODUCT_AREAS) {
    list.push([`thumb ${area}`, <AreaThumbScene area={area} />])
    for (let g = 0; g < 4; g++) list.push([`${area} ${g}`, <AreaScene area={area} group={g} />])
  }
  return list
}

describe('product scenes', () => {
  const original = window.matchMedia
  beforeEach(() => setReducedMotion(true))
  afterEach(() => { window.matchMedia = original })

  it('never shows the same scene in two places', () => {
    const seen = new Map<string, string>()
    for (const [where, node] of placements()) {
      const { container, unmount } = render(<>{node}</>)
      const root = container.querySelector('.sc')
      if (root) {
        const name = root.classList[2]
        expect(seen.get(name), `${where} repeats ${name} from ${seen.get(name)}`).toBeUndefined()
        seen.set(name, where)
      }
      unmount()
    }
    expect(seen.size).toBeGreaterThanOrEqual(45)
  })

  it('gives every product-page feature group a scene', () => {
    const groups: Record<string, number> = { ordering: 3, counter: 3, kitchen: 3, delivery: 3, stock: 3, team: 4, guests: 4, insights: 4 }
    for (const [area, count] of Object.entries(groups)) {
      for (let g = 0; g < count; g++) {
        const { container, unmount } = render(<AreaScene area={area as (typeof PRODUCT_AREAS)[number]} group={g} />)
        expect(container.querySelector('.sc'), `${area} ${g}`).not.toBeNull()
        unmount()
      }
    }
  })

  it('shows finished states with reduced motion', () => {
    const { unmount: a } = render(<JourneyDriverScene />)
    expect(screen.getByText(/Delivery confirmed/)).toBeInTheDocument()
    a()
    const { unmount: b } = render(<AreaScene area="stock" group={0} />)
    expect(screen.getByText('Mozzarella below reorder point')).toBeInTheDocument()
    b()
    render(<AreaScene area="guests" group={2} />)
    expect(screen.getByText(/added a driver on Friday evenings/)).toBeInTheDocument()
  })

  it('keeps scenes out of the accessibility tree', () => {
    for (const [where, node] of placements()) {
      const { container, unmount } = render(<>{node}</>)
      const root = container.querySelector('.sc')
      if (root) expect(root.getAttribute('aria-hidden'), where).toBe('true')
      unmount()
    }
  })
})

