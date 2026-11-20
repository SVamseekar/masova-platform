/** Height of the fixed site navigation (72px). */
export const NAVBAR_OFFSET = 72

export function scrollToSection(
  hash: string,
  behavior: ScrollBehavior = 'instant',
): boolean {
  const id = hash.replace(/^#/, '')
  if (!id) return false

  const section = document.getElementById(id)
  if (!section) return false

  const anchor = section.querySelector<HTMLElement>('[data-section-anchor]') ?? section

  const top = anchor.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET
  window.scrollTo({ top: Math.max(0, top), behavior })
  return true
}
