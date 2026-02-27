import React from 'react'
import { motion } from 'framer-motion'
import { FEATURES } from '../constants'

export default function FeaturesGrid() {
  return (
    <section id="features" className="bg-[#080808] py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-sm font-medium mb-4 tracking-wide uppercase" style={{ color: '#E53E3E' }}>Capabilities</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">Built for the full operation</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, size, screenshot }, i) => (
            <motion.div
              key={title}
              className={`rounded-2xl bg-[#111111] transition-all duration-300 group overflow-hidden ${
                size === 'large' ? 'md:col-span-2' : ''
              }`}
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              whileHover={{ y: -2 }}
            >
              <div className="p-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors group-hover:opacity-100" style={{ background: 'rgba(229,62,62,0.1)' }}>
                  <Icon size={20} style={{ color: '#E53E3E' }} />
                </div>
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
              {screenshot && (
                <img
                  src={screenshot}
                  alt={title}
                  loading="lazy"
                  style={{
                    width: '100%',
                    display: 'block',
                    maxHeight: 200,
                    objectFit: 'cover',
                    borderRadius: '0 0 12px 12px',
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
