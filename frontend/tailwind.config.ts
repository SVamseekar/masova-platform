import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  important: '#product-site',
  theme: {
    extend: {
      colors: {
        masova: {
          red: '#E53E3E',
          redDark: '#C0392B',
          black: '#080808',
          surface: '#111111',
          surface2: '#1A1A1A',
          border: 'rgba(255,255,255,0.08)',
          muted: '#6B7280',
          subtle: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
        'count-up': 'count-up 2s ease-out forwards',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
