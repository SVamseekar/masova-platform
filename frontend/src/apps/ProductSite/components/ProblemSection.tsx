import React from 'react'
import { motion } from 'framer-motion'
import { PAIN_POINTS } from '../constants'

export default function ProblemSection() {
  return (
    <section className="bg-[#080808] py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="mb-16 max-w-3xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-medium mb-4 tracking-wide uppercase" style={{ color: '#E53E3E' }}>The problem</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Most restaurant platforms give you a POS.
            <span className="text-gray-500"> MaSoVa gives you the whole operation.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {PAIN_POINTS.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              className="p-6 rounded-2xl bg-[#111111] transition-colors duration-300"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ borderColor: 'rgba(229,62,62,0.3)' } as any}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(229,62,62,0.1)' }}>
                <Icon size={20} style={{ color: '#E53E3E' }} />
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
