import type { ReactNode } from 'react'
import { colors } from '../tokens'

interface SectionLabelProps {
  children: ReactNode
}

/** Red uppercase label — action accent rhythm between gold brand moments */
export default function SectionLabel({ children }: SectionLabelProps) {
  return (
    <p
      className="text-sm font-medium mb-4 tracking-widest uppercase"
      style={{ color: colors.red }}
    >
      {children}
    </p>
  )
}