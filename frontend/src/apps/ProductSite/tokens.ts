// MaSoVa Product Site — Design Tokens
// Single source of truth for all colours, typography, spacing, and motion.
// Every ProductSite component should import from here — no hardcoded hex values.

export const colors = {
  // Backgrounds
  bg: '#080808',
  bgAlt: '#0C0C0C',
  bgElevated: '#111111',
  bgSurface: '#1A1A1A',

  // Brand
  gold: '#D4AF37',
  goldLight: '#F0CC6A',
  goldMuted: 'rgba(212,175,55,0.15)',
  goldBorder: 'rgba(212,175,55,0.3)',
  goldBorderStrong: 'rgba(212,175,55,0.5)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textSubtle: '#4B5563',

  // Borders
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.15)',

  // Semantic (use sparingly — only for actual meaning)
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const

export const typography = {
  fontDisplay: "'Playfair Display', Georgia, serif",
  fontBody: "'Inter', system-ui, -apple-system, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",

  // Scale
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
  '6xl': '3.75rem',
  '7xl': '4.5rem',
} as const

export const spacing = {
  sectionY: '128px',      // py-32 equivalent
  sectionYSm: '96px',     // py-24 equivalent
  sectionX: '24px',       // px-6 equivalent
  sectionXLg: '80px',     // max-width padding on large screens
} as const

export const motion = {
  // Standard entrance
  fadeUp: { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } },
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 } },
  fadeLeft: { initial: { opacity: 0, x: -24 }, animate: { opacity: 1, x: 0 } },
  fadeRight: { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 } },

  // Transitions
  spring: { type: 'spring' as const, stiffness: 300, damping: 24 },
  ease: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  easefast: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
} as const

// Shared card style — use as spread: style={{ ...cardStyle }}
export const cardStyle = {
  background: '#111111',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
} as const

// Gold gradient text — for Playfair Display logo/display text
export const goldGradientText = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontWeight: 700,
  background: 'linear-gradient(135deg, #D4AF37 0%, #F0CC6A 50%, #D4AF37 100%)',
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text' as const,
} as const
