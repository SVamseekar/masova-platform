import React, { useEffect } from 'react'
import './product-site.css'
import { useLandingScrollRestore } from './hooks/useLandingScrollRestore'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import MarqueeStrip from './components/MarqueeStrip'
import ProblemSection from './components/ProblemSection'
import ProductTour from './components/ProductTour'
import AgentCommandCenter from './components/AgentCommandCenter'
import AgentDemoTheater from './components/AgentDemoTheater'
import AgentScrollStory from './components/AgentScrollStory'
import MobileEcosystemSection from './components/MobileEcosystemSection'
import AggregatorHubSection from './components/AggregatorHubSection'
import OrderFlowSection from './components/OrderFlowSection'
import FeaturesGrid from './components/FeaturesGrid'
import DeveloperSection from './components/DeveloperSection'
import PricingSection from './components/PricingSection'
import FAQSection from './components/FAQSection'
import ContactSection from './components/ContactSection'
import Footer from './components/Footer'

export default function ProductSitePage() {
  useLandingScrollRestore()

  // Safety net: framer-motion whileInView can miss after lazy mount / hash jumps
  useEffect(() => {
    const revealStuck = () => {
      document.querySelectorAll<HTMLElement>('#product-site [style*="opacity: 0"]').forEach((el) => {
        if (el.style.opacity === '0') {
          el.style.opacity = '1'
          el.style.transform = 'none'
        }
      })
    }
    const timers = [600, 1200, 2000].map((ms) => window.setTimeout(revealStuck, ms))
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [])

  return (
    <div id="product-site" style={{ background: '#080808', minHeight: '100vh' }}>
      <Navbar />
      <HeroSection />
      <MarqueeStrip />
      <ProblemSection />
      <ProductTour />
      <AgentCommandCenter />
      <AgentDemoTheater />
      <AgentScrollStory />
      <MobileEcosystemSection />
      <AggregatorHubSection />
      <OrderFlowSection />
      <FeaturesGrid />
      <DeveloperSection />
      <PricingSection />
      <ContactSection />
      <FAQSection />
      <Footer />
    </div>
  )
}