import React from 'react'
import { MARQUEE_ITEMS } from '../constants'

export default function MarqueeStrip() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <div className="border-y border-white/5 bg-[#0D0D0D] py-4 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map(({ label, icon: Icon }, i) => (
          <span key={i} className="inline-flex items-center gap-2 mx-8 text-sm text-gray-500">
            <Icon size={14} style={{ color: '#E53E3E' }} className="flex-shrink-0" />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
