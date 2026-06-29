import { motion } from 'framer-motion'
import { Layers } from 'lucide-react'
import { AGGREGATOR_CHANNELS } from '../constants'
import SectionLabel from './SectionLabel'
import { colors } from '../tokens'

const MOCK_ORDERS = [
  { id: '#2041', source: 'MASOVA', item: 'Butter Chicken ×2', time: '2m ago', urgent: false },
  { id: '#2042', source: 'WOLT', item: 'Margherita Pizza', time: '4m ago', urgent: true },
  { id: '#2043', source: 'DELIVEROO', item: 'Lamb Biryani', time: '5m ago', urgent: false },
  { id: '#2044', source: 'JUST_EAT', item: 'Paneer Tikka Wrap', time: '7m ago', urgent: false },
  { id: '#2045', source: 'UBER_EATS', item: 'Family Feast Box', time: '9m ago', urgent: true },
]

export default function AggregatorHubSection() {
  return (
    <section id="channels" className="py-32 px-6" style={{ background: colors.bg }}>
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <SectionLabel>Delivery channels</SectionLabel>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Five tablets.
            <br />
            <span style={{ color: colors.gold }}>One kitchen screen.</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed mb-8">
            Wolt, Deliveroo, Just Eat, and Uber Eats — plus your own website and app — all land on
            one kitchen screen. No more juggling tablets. Commission tracked per channel.
          </p>
          <div className="flex flex-wrap gap-2">
            {AGGREGATOR_CHANNELS.map(ch => (
              <span
                key={ch.id}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: `${ch.color}18`, color: ch.color, border: `1px solid ${ch.color}44` }}
              >
                {ch.label}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl overflow-hidden"
          style={{ border: `1px solid ${colors.border}`, background: colors.bgElevated }}
        >
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${colors.border}` }}
          >
            <div className="flex items-center gap-2">
              <Layers size={16} style={{ color: colors.gold }} />
              <span className="text-sm font-semibold text-white">Unified order queue</span>
            </div>
            <span className="text-xs text-green-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          </div>
          <ul className="divide-y divide-white/5">
            {MOCK_ORDERS.map((order, i) => {
              const channel = AGGREGATOR_CHANNELS.find(c => c.id === order.source) ?? AGGREGATOR_CHANNELS[0]
              return (
                <motion.li
                  key={order.id}
                  className="px-5 py-4 flex items-center justify-between gap-4"
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white text-sm">{order.id}</span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: `${channel.color}22`, color: channel.color }}
                      >
                        {channel.label}
                      </span>
                      {order.urgent && (
                        <span className="text-[10px] text-amber-400 font-medium">RUSH</span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm truncate">{order.item}</p>
                  </div>
                  <span className="text-gray-600 text-xs whitespace-nowrap">{order.time}</span>
                </motion.li>
              )
            })}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}