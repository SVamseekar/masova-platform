import React from 'react'
import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
import { TESTIMONIALS } from '../constants'
import SectionLabel from './SectionLabel'
import { colors } from '../tokens'

export default function TestimonialsSection() {
  return (
    <section className="bg-[#080808] py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <SectionLabel>Testimonials</SectionLabel>
          <h2
            className="text-4xl md:text-5xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Loved by restaurant owners
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ quote, name, role, restaurant, avatar }, i) => (
            <motion.div
              key={name}
              className="p-6 rounded-2xl flex flex-col"
              style={{ border: `1px solid ${colors.border}`, background: colors.bgElevated }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Quote size={24} style={{ color: colors.red }} className="mb-4 opacity-60" />
              <p className="text-gray-300 text-sm leading-relaxed flex-1 mb-6">&ldquo;{quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
                  style={{ background: colors.red }}
                >
                  {avatar}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{name}</p>
                  <p className="text-gray-500 text-xs">{role} · {restaurant}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}