import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { PRODUCT_TOUR_TABS } from '../constants'

export default function ProductTour() {
  const [active, setActive] = useState(0)
  const tab = PRODUCT_TOUR_TABS[active]

  return (
    <section id="features" className="bg-[#080808] py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-sm font-medium mb-4 tracking-wide uppercase" style={{ color: '#E53E3E' }}>Product tour</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">Everything your restaurant needs</h2>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Tab list */}
          <div className="lg:w-64 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {PRODUCT_TOUR_TABS.map(({ id, label, icon: Icon }, i) => (
              <button
                key={id}
                onClick={() => setActive(i)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 text-left"
                style={
                  active === i
                    ? { background: '#E53E3E', color: 'white' }
                    : { color: '#6B7280' }
                }
                onMouseEnter={e => {
                  if (active !== i) {
                    e.currentTarget.style.color = 'white'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  }
                }}
                onMouseLeave={e => {
                  if (active !== i) {
                    e.currentTarget.style.color = '#6B7280'
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 grid md:grid-cols-2 gap-8 items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">{tab.headline}</h3>
                <p className="text-gray-400 leading-relaxed mb-6">{tab.desc}</p>
                <ul className="space-y-3">
                  {tab.bullets.map(b => (
                    <li key={b} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle2 size={16} style={{ color: '#E53E3E' }} className="flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>

            {/* Screenshot placeholder */}
            <AnimatePresence mode="wait">
              <motion.div
                key={tab.id + '-img'}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.35 }}
                className="rounded-2xl bg-[#111111] aspect-[4/3] flex items-center justify-center overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <p className="text-gray-600 text-sm">[ {tab.label} Screenshot ]</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
