import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { PRODUCT_AREAS, SITE_LOCALES } from '../../locales'
import { getSiteCopy } from '../../content'
import { AiCopilotScene, AiGuestChatScene, AreaScene, AreaThumbScene, HeroTonightScene, JourneyAiScene, JourneyDriverScene, JourneyKitchenScene, JourneyManagerScene, JourneyOrderScene, RoleScene, areaSceneCount } from '.'

const COPY = getSiteCopy('en')

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
  for (let i = 0; i < COPY.apps.roles.length; i++) list.push([`role ${i}`, <RoleScene index={i} />])
  for (const area of PRODUCT_AREAS) {
    list.push([`thumb ${area}`, <AreaThumbScene area={area} />])
    for (let g = 0; g < COPY.areas.items[area].groups.length; g++) list.push([`${area} ${g}`, <AreaScene area={area} group={g} />])
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
      expect(root, `${where} renders no scene`).not.toBeNull()
      const name = root!.classList[2]
      expect(seen.get(name), `${where} repeats ${name} from ${seen.get(name)}`).toBeUndefined()
      seen.set(name, where)
      unmount()
    }
    expect(seen.size).toBeGreaterThanOrEqual(45)
  })

  it('has exactly one scene for every feature group and role in every language', () => {
    for (const locale of SITE_LOCALES) {
      const copy = getSiteCopy(locale)
      for (const area of PRODUCT_AREAS) {
        expect(areaSceneCount(area), `${locale} ${area} groups`).toBe(copy.areas.items[area].groups.length)
      }
      expect(copy.apps.roles.length, `${locale} roles`).toBe(6)
    }
  })

  it('refuses a group or role that has no scene instead of rendering a blank stage', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<AreaScene area="ordering" group={areaSceneCount('ordering')} />)).toThrow(/no scene for ordering group 3/)
    expect(() => render(<RoleScene index={6} />)).toThrow(/no scene for role 6/)
    quiet.mockRestore()
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
      expect(root, where).not.toBeNull()
      expect(root!.getAttribute('aria-hidden'), where).toBe('true')
      unmount()
    }
  })
})

