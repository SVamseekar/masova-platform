import React from 'react'
import { SUPPORT_EMAIL } from '../constants'

interface SupportEmailLinkProps {
  className?: string
}

export default function SupportEmailLink({ className = 'text-gray-400 hover:text-white transition-colors underline-offset-2 hover:underline' }: SupportEmailLinkProps) {
  return (
    <a href={`mailto:${SUPPORT_EMAIL}`} className={className}>
      {SUPPORT_EMAIL}
    </a>
  )
}