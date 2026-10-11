import React from 'react'
import { SUPPORT_EMAIL } from '../constants'

interface SupportEmailLinkProps {
  className?: string
}

export default function SupportEmailLink({ className }: SupportEmailLinkProps) {
  return (
    <a href={`mailto:${SUPPORT_EMAIL}`} className={className}>
      {SUPPORT_EMAIL}
    </a>
  )
}