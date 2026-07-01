import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

export const REVEAL_VIEWPORT = { once: true, amount: 0.08 } as const

interface RevealProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  delay?: number
}

/** Scroll-reveal wrapper with a low intersection threshold so hash jumps still animate in. */
export default function Reveal({ children, delay = 0, className, ...rest }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={{ duration: 0.5, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}