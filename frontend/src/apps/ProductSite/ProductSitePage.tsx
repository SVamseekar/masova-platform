import { useLandingScrollRestore } from './hooks/useLandingScrollRestore'
import { SiteFooter, SiteNav, SiteShell } from './components/SiteChrome'
import { PlatformTour, SiteHero } from './components/SiteHero'
import {
  AssistantsSection, ChannelsSection, GettingStartedSection, MobileAppsSection, OperationsSection, WalkthroughSection,
} from './components/SiteSections'
import PricingSection from './components/PricingSection'

/** Marketing site in the approved visual system: boards 00 to 03. */
export default function ProductSitePage() {
  useLandingScrollRestore()

  return (
    <SiteShell>
      <SiteNav />
      <main>
        <SiteHero />
        <PlatformTour />
        <ChannelsSection />
        <AssistantsSection />
        <MobileAppsSection />
        <OperationsSection />
        <PricingSection />
        <GettingStartedSection />
        <WalkthroughSection />
      </main>
      <SiteFooter />
    </SiteShell>
  )
}
