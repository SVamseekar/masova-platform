import { useEffect } from 'react'
import { scrollToSection } from '../utils/scrollToSection'

/** Scroll to hash once after lazy mount; nudge IntersectionObservers for framer-motion. */
export function useLandingScrollRestore() {
  useEffect(() => {
    const kickObservers = () => window.dispatchEvent(new Event('scroll'))

    const hash = window.location.hash
    if (!hash) {
      kickObservers()
      return
    }

    const align = () => {
      scrollToSection(hash, 'instant')
      kickObservers()
    }

    align()
    const raf = window.requestAnimationFrame(align)
    const timer = window.setTimeout(align, 350)

    return () => {
      window.cancelAnimationFrame(raf)
      window.clearTimeout(timer)
    }
  }, [])
}