import { useEffect } from 'react'

const GA_MEASUREMENT_ID =
  import.meta.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || ''

export function GoogleAnalytics() {
  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !import.meta.env.PROD) return

    const loadGa = () => {
      const consentStr = localStorage.getItem('cookie_consent')
      if (!consentStr) return

      try {
        const consent = JSON.parse(consentStr)
        if (!consent.analytics) return
      } catch {
        return
      }

      const src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
      if (document.querySelector(`script[src="${src}"]`)) return

      const gtagScript = document.createElement('script')
      gtagScript.async = true
      gtagScript.src = src
      document.head.appendChild(gtagScript)

      const configScript = document.createElement('script')
      configScript.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_MEASUREMENT_ID}');
      `
      document.head.appendChild(configScript)
    }

    // Check on initial load
    loadGa()

    // Listen for updates from cookie consent banner
    window.addEventListener('cookie_consent_updated', loadGa)
    return () => {
      window.removeEventListener('cookie_consent_updated', loadGa)
    }
  }, [])

  return null
}