import './i18n'; // initialise i18next before rendering
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { preloadSitePage } from './apps/ProductSite/lazyPages'

const root = createRoot(document.getElementById('root')!)

// Site pages arrive prerendered. Load their code first so the first render shows the same
// page straight away rather than the loading spinner. Other paths render at once.
// The wait is capped: on a stalled network the app still mounts, and React.lazy takes over the load.
const PRELOAD_DEADLINE_MS = 3000
let deadlineTimer: number | undefined
const deadline = new Promise<void>((resolve) => {
  deadlineTimer = window.setTimeout(() => {
    console.warn(`[main] page code still loading after ${PRELOAD_DEADLINE_MS} ms; rendering without it`)
    resolve()
  }, PRELOAD_DEADLINE_MS)
})
Promise.race([preloadSitePage(window.location.pathname), deadline]).then(() => {
  window.clearTimeout(deadlineTimer)
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
