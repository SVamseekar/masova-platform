/**
 * Neumorphic Design System Tokens
 * Following the soft UI philosophy with systematic approach
 */

// ============================================
// MaSoVa Dark Premium — Customer Design Tokens
// These must stay in sync with .dark-premium-theme in index.css.
// ============================================
export const darkColors = {
  bg: '#0A0908',
  surface: '#141210',
  surface2: '#1C1916',
  surface3: '#242018',
  gold: '#D4A843',
  goldLight: '#E8C060',
  red: '#C62A09',
  redLight: '#E53E3E',
  success: '#2E7D32',
  successLight: '#388E3C',
  successRgb: '46, 125, 50',
  info: '#1565C0',
  infoLight: '#1976D2',
  infoRgb: '21, 101, 192',
  warning: '#E65100',
  warningLight: '#EF6C00',
  warningRgb: '230, 81, 0',
  border: 'rgba(212, 168, 67, 0.15)',
  borderStrong: 'rgba(212, 168, 67, 0.35)',
  text1: '#FDFCF8',
  text2: '#B0A898',
  text3: '#6C6458',
  overlay: 'rgba(10, 9, 8, 0.85)',
};

export const darkFonts = {
  display: "'Playfair Display', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
};

export const darkRadii = {
  card: '16px',
  pill: '999px',
};

// ============================================
// Legacy: Neumorphic (kept for staff/manager pages)
// ============================================

// Core Color Palette - Neumorphic Base
export const colors = {
  // Primary neumorphic surface
  surface: {
    primary: '#f0f0f0',
    secondary: '#e8e8e8',
    tertiary: '#d0d0d0',
    background: '#f1f5f9',
    elevated: '#fafafa',
    border: '#e5e7eb',
  },
  
  // Brand colors
  brand: {
    primary: '#e53e3e', // MaSoVa red
    primaryLight: '#ff6b6b',
    primaryDark: '#c0392b',
    secondary: '#0066cc', // Blue accent  
    secondaryLight: '#3399ff',
    secondaryDark: '#004499',
  },
  
  // Semantic colors
  semantic: {
    success: '#10b981',
    successLight: '#34d399',
    successDark: '#059669',
    warning: '#f59e0b',
    warningLight: '#fbbf24',
    warningDark: '#d97706',
    error: '#ef4444',
    errorLight: '#f87171',
    errorDark: '#dc2626',
    info: '#3b82f6',
    infoLight: '#60a5fa',
    infoDark: '#2563eb',
  },
  
  // Text colors
  text: {
    primary: '#1f2937',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    inverse: '#ffffff',
    disabled: '#d1d5db',
  },
  
  // Shadow colors for neumorphic effects
  shadow: {
    light: 'rgba(255, 255, 255, 0.6)',      // Reduced white light intensity
    lightStrong: 'rgba(255, 255, 255, 0.7)',
    dark: 'rgba(163, 163, 163, 0.5)',     // Enhanced from 0.3 for visibility
    darkIntense: 'rgba(163, 163, 163, 0.6)',
    darkStrong: 'rgba(100, 100, 100, 0.7)', // NEW - for deep inset shadows
    brand: 'rgba(229, 62, 62, 0.3)',
    primary: 'rgba(229, 62, 62, 0.3)',
    success: 'rgba(16, 185, 129, 0.3)',
    warning: 'rgba(245, 158, 11, 0.3)',
    error: 'rgba(239, 68, 68, 0.3)',
  },

  // Management theme for professional pages
  management: {
    header: {
      background: '#ffffff',
      backgroundDark: '#1a1a1a',
      border: '#e5e7eb',
      shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    },
    button: {
      primary: '#2563eb',
      primaryHover: '#1d4ed8',
      ghost: 'transparent',
      ghostHover: '#f3f4f6',
    }
  },

  // Backward-compatible aliases (for components using old structure)
  primary: {
    main: '#e53e3e',
    light: '#ff6b6b',
    dark: '#c0392b',
  },
  success: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
  },
  error: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
  },
  warning: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
  },
  info: {
    main: '#3b82f6',
    light: '#60a5fa',
    dark: '#2563eb',
  },
} as const;

// Typography Scale
export const typography = {
  fontFamily: {
    primary: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    secondary: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px - Uber Eats hero titles
    '7xl': '4.5rem',  // 72px - Large landing pages
  },
  
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  }
} as const;

// Spacing Scale (8px base unit)
export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  14: '3.5rem',  // 56px - Uber Eats hero sections
  16: '4rem',    // 64px
  18: '4.5rem',  // 72px - Large gaps
  20: '5rem',    // 80px
  24: '6rem',    // 96px
  28: '7rem',    // 112px - Section spacing
  32: '8rem',    // 128px
  36: '9rem',    // 144px - Hero padding
} as const;

// Border Radius - Soft, rounded aesthetic
export const borderRadius = {
  none: '0',
  sm: '0.375rem',   // 6px
  base: '0.5rem',   // 8px
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '2rem',    // 32px
  full: '9999px',
} as const;

// Neumorphic Shadow Presets - ENHANCED for prominent visibility
export const shadows = {
  // Outset (raised) shadows - for buttons, cards
  raised: {
    sm: `6px 6px 12px ${colors.shadow.dark}, -6px -6px 12px ${colors.shadow.light}`,
    base: `8px 8px 16px ${colors.shadow.dark}, -8px -8px 16px ${colors.shadow.light}`,
    md: `12px 12px 24px ${colors.shadow.darkStrong}, -12px -12px 24px ${colors.shadow.lightStrong}`,
    lg: `16px 16px 32px ${colors.shadow.darkStrong}, -16px -16px 32px ${colors.shadow.lightStrong}`,
    xl: `24px 24px 48px ${colors.shadow.darkStrong}, -24px -24px 48px ${colors.shadow.lightStrong}`,
  },

  // Inset (pressed) shadows - Moderate depth for visible but not excessive effect
  inset: {
    sm: `inset 3px 3px 6px ${colors.shadow.dark}, inset -3px -3px 6px ${colors.shadow.light}`,
    base: `inset 4px 4px 8px ${colors.shadow.dark}, inset -4px -4px 8px ${colors.shadow.light}`,
    md: `inset 5px 5px 10px ${colors.shadow.dark}, inset -5px -5px 10px ${colors.shadow.light}`,
    lg: `inset 6px 6px 12px ${colors.shadow.dark}, inset -6px -6px 12px ${colors.shadow.light}`,
    xl: `inset 8px 8px 16px ${colors.shadow.darkStrong}, inset -8px -8px 16px ${colors.shadow.lightStrong}`,
  },
  
  // Floating shadows - for modals, tooltips
  floating: {
    sm: `0 2px 8px ${colors.shadow.dark}`,
    base: `0 4px 16px ${colors.shadow.dark}`,
    md: `0 8px 24px ${colors.shadow.dark}`,
    lg: `0 16px 32px ${colors.shadow.dark}`,
    xl: `0 24px 48px ${colors.shadow.dark}`,
  },
  
  // Brand colored shadows
  brand: {
    primary: `0 6px 16px ${colors.shadow.brand}`,
    secondary: `0 6px 16px rgba(0, 102, 204, 0.3)`,
    success: `0 4px 12px ${colors.shadow.success}`,
    warning: `0 4px 12px ${colors.shadow.warning}`,
    error: `0 4px 12px ${colors.shadow.error}`,
  }
} as const;

// Animation & Transitions
export const animation = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    slower: '500ms',
  },
  
  easing: {
    default: 'ease',
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }
} as const;

// Breakpoints
export const breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Z-Index Scale
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// Component-specific tokens
export const components = {
  header: {
    height: {
      compact: '60px',
      comfortable: '72px',
    },
    padding: {
      horizontal: '1.5rem',
      vertical: '1rem',
    }
  },

  button: {
    height: {
      sm: '2rem',     // 32px
      base: '2.5rem', // 40px
      lg: '3rem',     // 48px
      xl: '3.5rem',   // 56px
    },
    padding: {
      sm: '0.5rem 1rem',
      base: '0.75rem 1.5rem',
      lg: '1rem 2rem',
      xl: '1.25rem 2.5rem',
    }
  },

  input: {
    height: {
      sm: '2rem',
      base: '2.5rem',
      lg: '3rem',
    },
    padding: {
      sm: '0.5rem 0.75rem',
      base: '0.75rem 1rem',
      lg: '1rem 1.25rem',
    }
  },

  card: {
    padding: {
      sm: '1rem',
      base: '1.5rem',
      lg: '2rem',
      xl: '2.5rem',
    }
  }
} as const;

// Export type definitions for TypeScript
export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type Animation = typeof animation;
export type Breakpoints = typeof breakpoints;
export type ZIndex = typeof zIndex;
export type Components = typeof components;