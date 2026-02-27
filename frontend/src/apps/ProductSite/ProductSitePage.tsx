import React from 'react'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import MarqueeStrip from './components/MarqueeStrip'
import ProblemSection from './components/ProblemSection'
import ProductTour from './components/ProductTour'
import FeaturesGrid from './components/FeaturesGrid'
import AIAgentsSection from './components/AIAgentsSection'
import PricingSection from './components/PricingSection'
import TestimonialsSection from './components/TestimonialsSection'
import FAQSection from './components/FAQSection'
import Footer from './components/Footer'

export default function ProductSitePage() {
  return (
    <div id="product-site" style={{ background: '#080808', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Navbar />
      <HeroSection />
      <MarqueeStrip />
      <ProblemSection />
      <ProductTour />
      <FeaturesGrid />
      <AIAgentsSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <Footer />
    </div>
  )
}
