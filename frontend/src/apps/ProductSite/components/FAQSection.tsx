import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import { FAQS } from '../constants'

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="bg-[#080808] py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-sm font-medium mb-4 tracking-wide uppercase" style={{ color: '#E53E3E' }}>FAQ</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">Common questions</h2>
        </motion.div>

        <div className="space-y-2">
          {FAQS.map(({ q, a }, i) => (
            <motion.div
              key={i}
              className="rounded-xl overflow-hidden bg-[#111111]"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-white text-sm font-medium">{q}</span>
                {open === i
                  ? <Minus size={16} style={{ color: '#E53E3E' }} className="flex-shrink-0" />
                  : <Plus size={16} className="text-gray-500 flex-shrink-0" />
                }
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-gray-500 text-sm leading-relaxed">{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
