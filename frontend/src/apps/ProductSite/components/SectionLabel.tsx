import type { ReactNode } from 'react'
import { colors } from '../tokens'

interface SectionLabelProps {
  children: ReactNode
}

export default function SectionLabel({ children }: SectionLabelProps) {
  return (
    <p
      className="text-sm font-medium mb-4 tracking-widest uppercase"
      style={{ color: colors.gold }}
    >
      <span style={{ color: colors.gold }}>{children}</span>
    </p>
  )
}