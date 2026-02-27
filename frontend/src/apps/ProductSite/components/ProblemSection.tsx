import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react'

const chaosOrders = [
  { id: '#1042', label: 'MISSED', color: '#E53E3E', bg: 'rgba(229,62,62,0.15)', icon: AlertCircle },
  { id: '#1043', label: 'DELAYED', color: '#DD6B20', bg: 'rgba(221,107,32,0.15)', icon: Clock },
  { id: '#1044', label: 'WRONG ADDRESS', color: '#E53E3E', bg: 'rgba(229,62,62,0.15)', icon: AlertCircle },
  { id: '#1045', label: 'BOTTLENECK', color: '#DD6B20', bg: 'rgba(221,107,32,0.15)', icon: Clock },
  { id: '#1046', label: 'UNREACHABLE', color: '#E53E3E', bg: 'rgba(229,62,62,0.15)', icon: AlertCircle },
  { id: '#1047', label: 'REFUND REQUESTED', color: '#E53E3E', bg: 'rgba(229,62,62,0.15)', icon: AlertCircle },
]

const pipeline = [
  { step: 'ORDER IN', desc: 'instantly received' },
  { step: 'KITCHEN NOTIFIED', desc: 'prep begins' },
  { step: 'DRIVER ASSIGNED', desc: 'en route' },
  { step: 'CUSTOMER UPDATED', desc: 'live tracking' },
  { step: 'DELIVERED', desc: 'rated & closed' },
]

export default function ProblemSection() {
  return (
    <section id="problem" className="bg-[#080808] py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="mb-16 text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            Running a restaurant is chaos.{' '}
            <span style={{ color: '#E53E3E' }}>Until now.</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Every shift, the same firefighting. MaSoVa ends it.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* LEFT PANEL — The Old Way */}
          <motion.div
            className="rounded-2xl overflow-hidden"
            style={{ background: '#1a0a0a', border: '1px solid rgba(229,62,62,0.2)' }}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Panel header */}
            <div
              className="px-6 py-4 flex items-center gap-3"
              style={{ borderBottom: '1px solid rgba(229,62,62,0.15)' }}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ background: '#E53E3E', boxShadow: '0 0 8px #E53E3E' }}
              />
              <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: '#E53E3E' }}>
                The Old Way
              </span>
            </div>

            {/* Scrolling order list */}
            <div className="p-6 overflow-hidden" style={{ height: '360px' }}>
              <motion.div
                animate={{ y: [0, -168, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              >
                {chaosOrders.map(({ id, label, color, bg, icon: Icon }, i) => (
                  <div
                    key={id}
                    className="flex items-center gap-4 mb-4 rounded-xl px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {/* Pulsing red dot */}
                    <motion.span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: '#E53E3E' }}
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.25 }}
                    />

                    {/* Order ID */}
                    <span className="text-gray-300 text-sm font-mono w-16 flex-shrink-0">
                      Order {id}
                    </span>

                    {/* Status badge */}
                    <span
                      className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ color, background: bg }}
                    >
                      <Icon size={12} />
                      {label}
                    </span>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* RIGHT PANEL — With MaSoVa */}
          <motion.div
            className="rounded-2xl overflow-hidden"
            style={{ background: '#0a1a0a', border: '1px solid rgba(72,187,120,0.2)' }}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Panel header */}
            <div
              className="px-6 py-4 flex items-center gap-3"
              style={{ borderBottom: '1px solid rgba(72,187,120,0.15)' }}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ background: '#48BB78', boxShadow: '0 0 8px #48BB78' }}
              />
              <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: '#48BB78' }}>
                With MaSoVa
              </span>
            </div>

            {/* Pipeline steps */}
            <div className="p-6 flex flex-col gap-0" style={{ height: '360px', justifyContent: 'center' }}>
              {pipeline.map(({ step, desc }, i) => (
                <div key={step} className="flex items-stretch gap-4">
                  {/* Icon + connecting line column */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.3 }}
                    >
                      <CheckCircle2 size={22} style={{ color: '#48BB78' }} />
                    </motion.div>
                    {i < pipeline.length - 1 && (
                      <motion.div
                        className="w-px flex-1 mt-1 mb-1"
                        style={{ background: 'rgba(72,187,120,0.25)', minHeight: '28px' }}
                        initial={{ scaleY: 0, originY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: i * 0.3 + 0.2 }}
                      />
                    )}
                  </div>

                  {/* Text column */}
                  <motion.div
                    className="pb-4"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.3 }}
                  >
                    <span className="text-sm font-bold tracking-wide" style={{ color: '#48BB78' }}>
                      {step}
                    </span>
                    <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                  </motion.div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
