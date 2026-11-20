import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { scrollToSection } from '../utils/scrollToSection'

/**
 * On every navigation between site pages: scroll to the URL hash if there is one,
 * otherwise to the top. Runs on pathname and hash, because every site route renders
 * the same page component and React Router keeps that instance between routes.
 */
export function useLandingScrollRestore() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    const kickObservers = () => window.dispatchEvent(new Event('scroll'))

    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
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
  }, [pathname, hash])
}
