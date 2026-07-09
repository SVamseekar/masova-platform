// Exact values from masova-mobile/src/styles/tokens.ts `colors.dark` + `colors.brand`.
// masova-mobile/CLAUDE.md describes this as "glassmorphism" but the actual tokens.ts
// is a flat "Blinkit-inspired dark/light" system — the `glass` export there is explicitly
// dead ("kept for backward compat, not used in new design"). This file mirrors the real
// code, not the stale doc.
export const realCustomerApp = {
  bg: '#0F0F0F',
  surface1: '#1A1A1A',
  surface2: '#242424',
  surface3: '#2E2E2E',
  surface4: '#383838',
  text1: '#FFFFFF',
  text2: '#A0A0A0',
  text3: '#606060',
  border: 'rgba(255,255,255,0.08)',
  accent: '#FFD000',
  onAccent: '#000000',
  error: '#FF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  radiusCard: 16,
  radiusPill: 9999,
} as const
