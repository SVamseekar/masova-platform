import React from 'react'
import { motion } from 'framer-motion'
import { Smartphone, CreditCard, ChefHat, Car, MapPin, Star } from 'lucide-react'

type FlowNode = {
  icon: React.ComponentType<{ size?: number; color?: string }>
  title: string
  description: string
  color: string
}

const FLOW_NODES: FlowNode[] = [
  {
    icon: Smartphone,
    title: 'Customer Orders',
    description: 'Taps from web or mobile app. Instant confirmation sent.',
    color: '#3B82F6',
  },
  {
    icon: CreditCard,
    title: 'Payment Confirmed',
    description: 'Stripe processes in <2s. Receipt sent automatically.',
    color: '#8B5CF6',
  },
  {
    icon: ChefHat,
    title: 'Kitchen Notified',
    description: 'KDS lights up. Prep timer starts. No phone calls.',
    color: '#F59E0B',
  },
  {
    icon: Car,
    title: 'Driver Dispatched',
    description: 'Nearest driver assigned. Route optimised by Driver Agent.',
    color: '#10B981',
  },
  {
    icon: MapPin,
    title: 'Live Tracking',
    description: 'Customer watches on map. Driver sees turn-by-turn nav.',
    color: '#EC4899',
  },
  {
    icon: Star,
    title: 'Delivered & Rated',
    description: 'Order closed. Review prompted. Analytics updated.',
    color: '#D4AF37',
  },
]

export default function OrderFlowSection() {
  return (
    <section id="order-flow" className="py-32 px-6" style={{ background: '#080808' }}>
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p
            className="text-sm font-medium mb-4 tracking-widest uppercase"
            style={{ color: '#E53E3E' }}
          >
            Order Flow
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            From tap to doorstep.
            <br />
            <span style={{ color: '#555' }}>in 30 minutes.</span>
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-0 md:gap-0">
          {FLOW_NODES.map((node, index) => (
            <React.Fragment key={node.title}>
              <TimelineNode node={node} index={index} />
              {index < FLOW_NODES.length - 1 && (
                <ConnectorLine color={node.color} index={index} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}

function TimelineNode({ node, index }: { node: FlowNode; index: number }) {
  const Icon = node.icon

  return (
    <motion.div
      className="flex flex-col items-center text-center"
      style={{ minWidth: 0, flexShrink: 1, maxWidth: '140px' }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
    >
      {/* Circle */}
      <motion.div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4 relative"
        style={{
          background: 'linear-gradient(135deg, #1a1a1a, #222)',
          border: `2px solid ${node.color}`,
          boxShadow: `0 0 18px ${node.color}33`,
          flexShrink: 0,
        }}
        whileHover={{ scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Icon size={22} color={node.color} />
        {/* Step number badge */}
        <span
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
          style={{ background: node.color, color: '#080808' }}
        >
          {index + 1}
        </span>
      </motion.div>

      {/* Text */}
      <p className="text-white text-sm font-semibold mb-1 leading-snug">{node.title}</p>
      <p className="text-gray-500 text-xs leading-relaxed">{node.description}</p>
    </motion.div>
  )
}

function ConnectorLine({ color, index }: { color: string; index: number }) {
  return (
    <>
      {/* Desktop: horizontal line */}
      <div
        className="hidden md:flex items-center"
        style={{ flex: 1, minWidth: '16px', marginTop: '28px', alignSelf: 'flex-start' }}
      >
        <div
          className="w-full relative overflow-hidden"
          style={{ height: '2px', background: '#1e1e1e' }}
        >
          <motion.div
            className="absolute inset-0 origin-left"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.15 + 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Mobile: vertical line */}
      <div
        className="flex md:hidden flex-col items-center"
        style={{ height: '32px' }}
      >
        <div
          className="w-px relative overflow-hidden"
          style={{ flex: 1, background: '#1e1e1e' }}
        >
          <motion.div
            className="absolute inset-0 origin-top"
            style={{ background: `linear-gradient(180deg, ${color}, ${color}88)` }}
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.15 + 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>
    </>
  )
}
