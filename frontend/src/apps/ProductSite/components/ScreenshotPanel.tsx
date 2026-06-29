import { motion } from 'framer-motion'
import type { ComponentType, CSSProperties } from 'react'
import { colors } from '../tokens'

interface ScreenshotPanelProps {
  src: string | null
  alt: string
  label: string
  accentColor: string
  icon: ComponentType<{ size?: number; style?: CSSProperties }>
  comingSoon?: boolean
}

export default function ScreenshotPanel({
  src,
  alt,
  label,
  accentColor,
  icon: Icon,
  comingSoon = !src,
}: ScreenshotPanelProps) {
  if (src) {
    return (
      <motion.div
        className="rounded-2xl overflow-hidden aspect-[4/3] relative"
        style={{ border: `1px solid ${colors.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.45)' }}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-8 flex items-center gap-2 px-3 z-10"
          style={{ background: 'rgba(17,17,17,0.92)', borderBottom: `1px solid ${colors.border}` }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
          <span className="text-[10px] text-gray-500 font-mono">{label}</span>
        </div>
        <img src={src} alt={alt} className="w-full h-full object-cover object-top pt-8" loading="lazy" />
      </motion.div>
    )
  }

  return (
    <motion.div
      className="rounded-2xl aspect-[4/3] relative overflow-hidden flex flex-col"
      style={{
        border: `1px solid ${colors.border}`,
        background: `linear-gradient(145deg, ${colors.bgElevated} 0%, ${colors.bg} 55%, ${accentColor}12 100%)`,
      }}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.03) 40px)',
        }}
      />
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-8 text-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: `${accentColor}22`, border: `1px solid ${accentColor}44` }}
        >
          <Icon size={28} style={{ color: accentColor }} />
        </div>
        <div>
          <p className="text-white font-semibold text-lg mb-1">{label}</p>
          <p className="text-gray-500 text-sm">
            {comingSoon ? 'Screenshot & demo coming soon' : 'Preview'}
          </p>
        </div>
        {comingSoon && (
          <span
            className="text-[11px] font-medium px-3 py-1 rounded-full"
            style={{ background: colors.goldMuted, color: colors.gold, border: `1px solid ${colors.goldBorder}` }}
          >
            Gallery update in progress
          </span>
        )}
      </div>
    </motion.div>
  )
}