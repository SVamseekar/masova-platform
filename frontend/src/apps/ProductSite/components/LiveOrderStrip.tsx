import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, Bike, CheckCircle2, Clock } from 'lucide-react'
import { colors } from '../tokens'

type Stage = 'placed' | 'kitchen' | 'delivery' | 'delivered'

const STAGE_META: Record<Stage, { label: string; icon: typeof ChefHat; color: string }> = {
  placed: { label: 'Placed', icon: Clock, color: colors.textMuted },
  kitchen: { label: 'Kitchen', icon: ChefHat, color: colors.warning },
  delivery: { label: 'Out for delivery', icon: Bike, color: colors.info },
  delivered: { label: 'Delivered', icon: CheckCircle2, color: colors.success },
}

const STAGE_ORDER: Stage[] = ['placed', 'kitchen', 'delivery', 'delivered']

interface LiveOrder {
  id: string
  item: string
  stage: Stage
}

const INITIAL_ORDERS: LiveOrder[] = [
  { id: '#2041', item: 'Wiener Schnitzel', stage: 'kitchen' },
  { id: '#2042', item: 'Margherita ×2', stage: 'delivery' },
  { id: '#2043', item: 'Ratatouille', stage: 'placed' },
  { id: '#2038', item: 'Sea Bass', stage: 'delivered' },
]

const ADVANCE_INTERVAL_MS = 2600

export default function LiveOrderStrip({ compact = false }: { compact?: boolean }) {
  const [orders, setOrders] = useState<LiveOrder[]>(INITIAL_ORDERS)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setOrders((prev) =>
        prev.map((order) => {
          const currentIndex = STAGE_ORDER.indexOf(order.stage)
          const nextIndex = (currentIndex + 1) % STAGE_ORDER.length
          return { ...order, stage: STAGE_ORDER[nextIndex] }
        }),
      )
    }, ADVANCE_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <div
      className={`flex ${compact ? 'gap-1.5' : 'gap-2'} flex-wrap justify-center`}
      aria-hidden="true"
    >
      {orders.map((order) => {
        const meta = STAGE_META[order.stage]
        const Icon = meta.icon
        return (
          <div
            key={order.id}
            className="flex items-center gap-1.5 rounded-full"
            style={{
              background: colors.bgElevated,
              border: `1px solid ${colors.border}`,
              padding: compact ? '4px 10px' : '6px 12px',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={order.stage}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                <Icon size={compact ? 10 : 12} style={{ color: meta.color }} />
              </motion.span>
            </AnimatePresence>
            <span style={{ color: colors.textPrimary, fontSize: compact ? 10 : 11, fontWeight: 600 }}>{order.id}</span>
            <span style={{ color: colors.textMuted, fontSize: compact ? 9 : 10 }}>{order.item}</span>
            <span style={{ color: meta.color, fontSize: compact ? 9 : 10, fontWeight: 600 }}>{meta.label}</span>
          </div>
        )
      })}
    </div>
  )
}
