import React from 'react'
import './product-site.css'
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
import TestimonialsSection from './components/TestimonialsSection'
import FAQSection from './components/FAQSection'
import Footer from './components/Footer'

export default function ProductSitePage() {
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
      <TestimonialsSection />
      <FAQSection />
      <Footer />
    </div>
  )
}