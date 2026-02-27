import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { STATS } from '../constants'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden bg-[#080808]">
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px]" style={{ background: 'rgba(229,62,62,0.08)' }} />
      </div>

      {/* Badge */}
      <motion.div
        className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium"
        style={{ borderColor: 'rgba(229,62,62,0.3)', background: 'rgba(229,62,62,0.1)', color: '#E53E3E' }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#E53E3E] animate-pulse" />
        Now available in Europe
      </motion.div>

      {/* Headline */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="text-center max-w-5xl"
      >
        <motion.h1
          variants={item}
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight mb-6"
        >
          The Restaurant OS
          <br />
          <span style={{ color: '#E53E3E' }}>Built for Growth.</span>
        </motion.h1>

        <motion.p
          variants={item}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          MaSoVa gives multi-location restaurants in Europe a complete operating system —
          from the first order to the last delivery report. One platform. Zero gaps.
        </motion.p>

        <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#pricing"
            className="group flex items-center gap-2 text-white px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:gap-3"
            style={{ background: '#E53E3E' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#C0392B')}
            onMouseLeave={e => (e.currentTarget.style.background = '#E53E3E')}
          >
            Start free trial
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href="#features"
            className="flex items-center gap-2 text-gray-400 hover:text-white px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20 text-sm font-medium transition-all duration-200"
          >
            <Play size={14} fill="currentColor" />
            See how it works
          </a>
        </motion.div>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden max-w-3xl w-full"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        {STATS.map(({ value, label, icon: Icon }) => (
          <div key={label} className="bg-[#080808] px-6 py-5 flex flex-col items-center gap-1">
            <Icon size={18} style={{ color: '#E53E3E' }} className="mb-1" />
            <span className="text-2xl font-bold text-white">{value}</span>
            <span className="text-xs text-gray-500 text-center">{label}</span>
          </div>
        ))}
      </motion.div>

      {/* Dashboard preview */}
      <motion.div
        className="mt-16 w-full max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        initial={{ opacity: 0, y: 48, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Fake browser chrome */}
        <div className="bg-[#111111] border-b border-white/5 px-4 py-3 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
          </div>
          <div className="flex-1 mx-4 bg-white/5 rounded-md h-6 flex items-center px-3">
            <span className="text-xs text-gray-500">app.masova.eu/manager/dashboard</span>
          </div>
        </div>
        {/* Dashboard image placeholder */}
        <div className="bg-[#0D0D0D] aspect-[16/9] flex items-center justify-center">
          <p className="text-gray-600 text-sm">[ Manager Dashboard Screenshot ]</p>
        </div>
      </motion.div>
    </section>
  )
}
