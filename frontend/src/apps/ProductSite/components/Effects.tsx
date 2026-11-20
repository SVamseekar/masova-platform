import { useEffect, useRef, useState } from 'react'
import { useSite } from '../SiteContext'
import type { ProductArea } from '../locales'

function prefersReducedMotion(): boolean {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}

/** Counts a whole number up from zero the first time it scrolls into view. Other values are shown as they are. */
export function CountUp({ value }: { value: string }) {
  const target = /^\d+$/.test(value) ? Number(value) : null
  const ref = useRef<HTMLSpanElement>(null)
  const [shown, setShown] = useState(value)

  useEffect(() => {
    const node = ref.current
    if (target === null || !node || typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) {
      setShown(value)
      return
    }
    let frame = 0
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 900)
        setShown(String(Math.round(target * (1 - (1 - t) ** 3))))
        if (t < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }, { threshold: 0.6 })
    observer.observe(node)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [target, value])

  return <span ref={ref} aria-label={value}>{shown}</span>
}

/**
 * Cards marked `data-glow` get a soft highlight that follows the pointer.
 * One listener on the site root keeps the position in two CSS variables.
 */
export function usePointerGlow() {
  useEffect(() => {
    const root = document.getElementById('product-site')
    if (!root || !window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) return
    const onMove = (event: PointerEvent) => {
      const card = (event.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-glow]')
      if (!card) return
      const box = card.getBoundingClientRect()
      card.style.setProperty('--gx', `${event.clientX - box.left}px`)
      card.style.setProperty('--gy', `${event.clientY - box.top}px`)
    }
    root.addEventListener('pointermove', onMove, { passive: true })
    return () => root.removeEventListener('pointermove', onMove)
  }, [])
}

/** Tilts an element a few degrees towards the pointer. Returns the ref to attach. */
export function useTilt<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const node = ref.current
    if (!node || prefersReducedMotion() || !window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) return
    const onMove = (event: PointerEvent) => {
      const box = node.getBoundingClientRect()
      const x = (event.clientX - box.left) / box.width - 0.5
      const y = (event.clientY - box.top) / box.height - 0.5
      node.style.setProperty('--tilt-x', `${(-y * 5).toFixed(2)}deg`)
      node.style.setProperty('--tilt-y', `${(x * 6).toFixed(2)}deg`)
    }
    const onLeave = () => {
      node.style.setProperty('--tilt-x', '0deg')
      node.style.setProperty('--tilt-y', '0deg')
    }
    node.addEventListener('pointermove', onMove, { passive: true })
    node.addEventListener('pointerleave', onLeave)
    return () => {
      node.removeEventListener('pointermove', onMove)
      node.removeEventListener('pointerleave', onLeave)
    }
  }, [])
  return ref
}

/** On wide screens, a rail of dots beside a product page that shows which feature group is on screen. */
export function SectionRail({ area }: { area: ProductArea }) {
  const { copy } = useSite()
  const groups = copy.areas.items[area].groups
  const [active, setActive] = useState(-1)

  useEffect(() => {
    setActive(-1)
    if (typeof IntersectionObserver === 'undefined') return
    const visible = new Set<number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).id.slice(1)) - 1
          if (entry.isIntersecting) visible.add(index)
          else visible.delete(index)
        }
        setActive(visible.size ? Math.min(...visible) : -1)
      },
      { rootMargin: '-40% 0px -40% 0px' },
    )
    groups.forEach((_, g) => {
      const node = document.getElementById(`g${g + 1}`)
      if (node) observer.observe(node)
    })
    return () => observer.disconnect()
  }, [area, groups])

  return (
    <nav className="ms-rail" data-shown={active >= 0} aria-label={copy.areas.items[area].label}>
      {groups.map((group, g) => (
        <a key={group.title} href={`#g${g + 1}`} aria-current={g === active ? 'true' : undefined} tabIndex={active >= 0 ? 0 : -1}>
          <span>{group.title}</span>
          <i aria-hidden="true" />
        </a>
      ))}
    </nav>
  )
}
