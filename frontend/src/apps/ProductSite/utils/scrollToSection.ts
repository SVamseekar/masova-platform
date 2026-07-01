/** Fixed navbar is h-16 (64px); add breathing room for section labels. */
export const NAVBAR_OFFSET = 80

export function scrollToSection(
  hash: string,
  behavior: ScrollBehavior = 'instant',
): boolean {
  const id = hash.replace(/^#/, '')
  if (!id) return false

  const section = document.getElementById(id)
  if (!section) return false

  const anchor =
    section.querySelector<HTMLElement>('[data-section-anchor]') ??
    section.querySelector<HTMLElement>('h2') ??
    section

  const top = anchor.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET
  window.scrollTo({ top: Math.max(0, top), behavior })
  return true
}

export function scrollToTop(behavior: ScrollBehavior = 'instant') {
  window.scrollTo({ top: 0, left: 0, behavior })
}