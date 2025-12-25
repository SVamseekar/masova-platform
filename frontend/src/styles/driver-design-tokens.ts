/**
 * Driver App Design Tokens
 * Hybrid Uber-Neumorphic Design System
 *
 * Philosophy:
 * - Primary: Clean, minimal Uber-style interface
 * - Accent: Strategic neumorphic elements for interactivity
 * - Goal: Professional, polished, premium delivery platform
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const colors = {
  // Primary Colors (Uber-inspired)
  primary: {
    black: '#000000',      // Deep black for text
    white: '#FFFFFF',      // Pure white for backgrounds
    green: '#00B14F',      // Uber green for CTAs
    greenDark: '#009640',  // Darker green for hover/active
    greenLight: '#E8F5E9', // Light green for backgrounds
  },

  // Muted/Surface Colors
  surface: {
    background: '#FFFFFF',
    backgroundAlt: '#F6F6F6',
    backgroundMuted: '#FAFAFA',
    border: '#E8E8E8',
    borderDark: '#D0D0D0',
    disabled: '#AFAFAF',
  },

  // Text Colors
  text: {
    primary: '#000000',
    secondary: '#5E5E5E',
    tertiary: '#8E8E8E',
    disabled: '#AFAFAF',
    inverse: '#FFFFFF',
  },

  // Semantic Colors
  semantic: {
    success: '#00B14F',
    successBg: '#E8F5E9',
    warning: '#FFA726',
    warningBg: '#FFF3E0',
    error: '#F44336',
    errorBg: '#FFEBEE',
    info: '#2196F3',
    infoBg: '#E3F2FD',
  },

  // Status Colors
  status: {
    online: '#00B14F',
    offline: '#AFAFAF',
    delivering: '#2196F3',
    idle: '#FFA726',
  },

  // Gradient Backgrounds
  gradients: {
    heroBackground: 'linear-gradient(180deg, #FFFFFF 0%, #F6F6F6 100%)',
    greenGlow: 'linear-gradient(135deg, #00B14F 0%, #00D45E 100%)',
    profileHeader: 'linear-gradient(180deg, #FFFFFF 0%, #E8F5E9 100%)',
  },
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  fontFamily: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    mono: "'SF Mono', 'Monaco', 'Inconsolata', 'Courier New', monospace",
  },

  fontSize: {
    hero: '32px',       // Big numbers (earnings, stats)
    h1: '24px',         // Page titles
    h2: '18px',         // Section headers
    body: '16px',       // Default text
    caption: '14px',    // Secondary info
    small: '12px',      // Timestamps, labels
    tiny: '10px',       // Tags, badges
  },

  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.75',
  },
};

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  base: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  xxxl: '64px',
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: '0px',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
};

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  none: 'none',
  subtle: '0 2px 8px rgba(0, 0, 0, 0.08)',
  card: '0 4px 12px rgba(0, 0, 0, 0.1)',
  elevated: '0 8px 24px rgba(0, 0, 0, 0.12)',

  // Neumorphic shadows (for interactive elements)
  neumorphic: {
    inset: 'inset 2px 2px 5px rgba(0, 0, 0, 0.1), inset -2px -2px 5px rgba(255, 255, 255, 0.7)',
    outset: '4px 4px 10px rgba(0, 0, 0, 0.1), -4px -4px 10px rgba(255, 255, 255, 0.7)',
    pressed: 'inset 4px 4px 10px rgba(0, 0, 0, 0.15), inset -4px -4px 10px rgba(255, 255, 255, 0.5)',
  },

  // Green glow for online toggle
  greenGlow: '0 0 20px rgba(0, 177, 79, 0.4), 0 0 40px rgba(0, 177, 79, 0.2)',
};

// ============================================================================
// ANIMATIONS
// ============================================================================

export const animations = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },

  easing: {
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

// ============================================================================
// COMPONENT-SPECIFIC TOKENS
// ============================================================================

export const components = {
  button: {
    height: {
      small: '36px',
      medium: '48px',
      large: '56px',
    },
    padding: {
      horizontal: spacing.base,
    },
  },

  card: {
    padding: spacing.base,
    borderRadius: borderRadius.md,
  },

  avatar: {
    size: {
      small: '32px',
      medium: '48px',
      large: '64px',
      hero: '120px',
    },
  },

  statusBadge: {
    height: '32px',
    borderRadius: borderRadius.full,
    dotSize: '8px',
  },

  bottomNav: {
    height: '64px',
  },

  topBar: {
    height: '64px',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a neumorphic surface style
 * @param variant - 'flat' | 'raised' | 'pressed'
 * @param color - Background color
 */
export const createNeumorphicSurface = (
  variant: 'flat' | 'raised' | 'pressed' = 'raised',
  color: string = colors.surface.background
) => {
  const baseStyle = {
    background: color,
    borderRadius: borderRadius.md,
  };

  switch (variant) {
    case 'raised':
      return {
        ...baseStyle,
        boxShadow: shadows.neumorphic.outset,
      };
    case 'pressed':
      return {
        ...baseStyle,
        boxShadow: shadows.neumorphic.pressed,
      };
    case 'flat':
    default:
      return {
        ...baseStyle,
        boxShadow: shadows.subtle,
      };
  }
};

/**
 * Creates a clean Uber-style card
 */
export const createCard = () => ({
  background: colors.surface.background,
  borderRadius: borderRadius.md,
  boxShadow: shadows.subtle,
  padding: spacing.base,
});

/**
 * Creates a pulse animation for online status
 */
export const createPulseAnimation = (color: string = colors.primary.green) => ({
  '@keyframes pulse': {
    '0%, 100%': {
      opacity: 1,
      transform: 'scale(1)',
    },
    '50%': {
      opacity: 0.8,
      transform: 'scale(1.05)',
    },
  },
  animation: `pulse 2s ${animations.easing.standard} infinite`,
});

/**
 * Creates a shimmer loading animation
 */
export const createShimmerAnimation = () => ({
  '@keyframes shimmer': {
    '0%': {
      backgroundPosition: '-1000px 0',
    },
    '100%': {
      backgroundPosition: '1000px 0',
    },
  },
  background: `linear-gradient(
    90deg,
    ${colors.surface.backgroundAlt} 0%,
    ${colors.surface.border} 20%,
    ${colors.surface.backgroundAlt} 40%,
    ${colors.surface.backgroundAlt} 100%
  )`,
  backgroundSize: '1000px 100%',
  animation: `shimmer 2s ${animations.easing.standard} infinite`,
});

/**
 * Creates a slide-up animation
 */
export const createSlideUpAnimation = () => ({
  '@keyframes slideUp': {
    from: {
      transform: 'translateY(100%)',
      opacity: 0,
    },
    to: {
      transform: 'translateY(0)',
      opacity: 1,
    },
  },
  animation: `slideUp ${animations.duration.normal} ${animations.easing.decelerate}`,
});

/**
 * Creates a fade-in animation
 */
export const createFadeInAnimation = () => ({
  '@keyframes fadeIn': {
    from: {
      opacity: 0,
    },
    to: {
      opacity: 1,
    },
  },
  animation: `fadeIn ${animations.duration.normal} ${animations.easing.standard}`,
});

/**
 * Creates a scale animation
 */
export const createScaleAnimation = (scale: number = 0.95) => ({
  transition: `transform ${animations.duration.fast} ${animations.easing.standard}`,
  '&:active': {
    transform: `scale(${scale})`,
  },
});

// ============================================================================
// BREAKPOINTS (for responsive design)
// ============================================================================

export const breakpoints = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
};

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

export const zIndex = {
  base: 0,
  card: 10,
  dropdown: 100,
  sticky: 500,
  overlay: 1000,
  modal: 1100,
  toast: 1200,
};

// ============================================================================
// EXPORT DEFAULT THEME
// ============================================================================

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  components,
  breakpoints,
  zIndex,
};

export default theme;
