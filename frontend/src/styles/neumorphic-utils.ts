/**
 * Neumorphic Design System Utilities
 * Helper functions for consistent neumorphic styling
 */

import { colors, shadows, borderRadius, spacing, animation } from './design-tokens';

// Neumorphic surface generator
export const createNeumorphicSurface = (
  variant: 'raised' | 'inset' | 'flat' = 'raised',
  size: 'sm' | 'base' | 'md' | 'lg' | 'xl' = 'base',
  radius: keyof typeof borderRadius = 'md'
) => ({
  backgroundColor: colors.surface.primary,
  borderRadius: borderRadius[radius],
  boxShadow: variant === 'flat' ? 'none' : shadows[variant][size],
  border: 'none',
  outline: 'none',
});

// Interactive neumorphic states
export const createNeumorphicStates = (
  baseRadius: keyof typeof borderRadius = 'md',
  shadowSize: 'sm' | 'base' | 'md' | 'lg' = 'base'
) => ({
  base: {
    ...createNeumorphicSurface('raised', shadowSize, baseRadius),
    transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
    cursor: 'pointer',
  },
  
  hover: {
    transform: 'translateY(-2px)',
    boxShadow: shadows.raised[shadowSize === 'sm' ? 'base' : shadowSize === 'base' ? 'md' : 'lg'],
  },
  
  active: {
    transform: 'scale(0.98)',
    boxShadow: shadows.inset[shadowSize],
  },
  
  focus: {
    boxShadow: `${shadows.raised[shadowSize]}, 0 0 0 3px ${colors.shadow.brand}`,
  },
  
  disabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none',
    boxShadow: shadows.raised.sm,
  }
});

// Button variant generator
export const createButtonVariant = (
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary',
  size: 'sm' | 'base' | 'lg' | 'xl' = 'base'
) => {
  const baseStates = createNeumorphicStates('lg', size === 'sm' ? 'sm' : size === 'xl' ? 'lg' : 'base');
  
  const variants = {
    primary: {
      ...baseStates.base,
      background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.primaryLight} 100%)`,
      color: colors.text.inverse,
      fontWeight: 600,
      
      '&:hover': {
        ...baseStates.hover,
        background: `linear-gradient(135deg, ${colors.brand.primaryDark} 0%, ${colors.brand.primary} 100%)`,
      },
      
      '&:active': {
        ...baseStates.active,
        background: `linear-gradient(135deg, ${colors.brand.primaryDark} 0%, ${colors.brand.primary} 100%)`,
      },
      
      '&:focus': baseStates.focus,
      '&:disabled': baseStates.disabled,
    },
    
    secondary: {
      ...baseStates.base,
      background: `linear-gradient(135deg, ${colors.brand.secondary} 0%, ${colors.brand.secondaryLight} 100%)`,
      color: colors.text.inverse,
      fontWeight: 600,
      
      '&:hover': {
        ...baseStates.hover,
        background: `linear-gradient(135deg, ${colors.brand.secondaryDark} 0%, ${colors.brand.secondary} 100%)`,
      },
      
      '&:active': {
        ...baseStates.active,
        background: `linear-gradient(135deg, ${colors.brand.secondaryDark} 0%, ${colors.brand.secondary} 100%)`,
      },
      
      '&:focus': baseStates.focus,
      '&:disabled': baseStates.disabled,
    },
    
    ghost: {
      ...baseStates.base,
      backgroundColor: colors.surface.primary,
      color: colors.brand.primary,
      fontWeight: 600,
      
      '&:hover': {
        ...baseStates.hover,
        color: colors.brand.primaryDark,
      },
      
      '&:active': baseStates.active,
      '&:focus': baseStates.focus,
      '&:disabled': baseStates.disabled,
    },
    
    danger: {
      ...baseStates.base,
      background: `linear-gradient(135deg, ${colors.semantic.error} 0%, ${colors.semantic.errorLight} 100%)`,
      color: colors.text.inverse,
      fontWeight: 600,
      
      '&:hover': {
        ...baseStates.hover,
        background: `linear-gradient(135deg, ${colors.semantic.errorDark} 0%, ${colors.semantic.error} 100%)`,
      },
      
      '&:active': {
        ...baseStates.active,
        background: `linear-gradient(135deg, ${colors.semantic.errorDark} 0%, ${colors.semantic.error} 100%)`,
      },
      
      '&:focus': {
        ...baseStates.focus,
        boxShadow: `${shadows.raised[size === 'sm' ? 'sm' : 'base']}, 0 0 0 3px ${colors.shadow.error}`,
      },
      '&:disabled': baseStates.disabled,
    }
  };
  
  return variants[variant];
};

// Input field styling - ENHANCED for prominent inset effects
export const createInputField = (
  size: 'sm' | 'base' | 'lg' = 'base',
  state: 'default' | 'error' | 'success' = 'default'
) => {
  // Enhanced shadow size for more visible inset
  const shadowSize = size === 'sm' ? 'base' : size === 'lg' ? 'lg' : 'md';

  const baseField = {
    ...createNeumorphicSurface('inset', shadowSize, 'lg'),
    width: '100%',
    fontFamily: 'inherit',
    fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1.125rem' : '1rem',
    fontWeight: 500,
    color: colors.text.primary,
    padding: size === 'sm' ? '0.5rem 0.75rem' : size === 'lg' ? '1rem 1.25rem' : '0.75rem 1rem',
    transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,

    '&::placeholder': {
      color: colors.text.tertiary,
      fontWeight: 400,
    },

    '&:focus': {
      boxShadow: `${shadows.inset[shadowSize]}, 0 0 0 4px ${
        state === 'error' ? colors.shadow.error :
        state === 'success' ? colors.shadow.success :
        colors.shadow.brand
      }`,
    }
  };

  return baseField;
};

// Card component styling
export const createCard = (
  elevation: 'sm' | 'base' | 'md' | 'lg' = 'base',
  padding: 'sm' | 'base' | 'lg' | 'xl' = 'base',
  interactive: boolean = false
) => {
  const baseCard = {
    ...createNeumorphicSurface('raised', elevation, 'xl'),
    padding: spacing[padding === 'sm' ? '4' : padding === 'lg' ? '8' : padding === 'xl' ? '10' : '6'],
    overflow: 'hidden' as const,
  };
  
  if (interactive) {
    return {
      ...baseCard,
      cursor: 'pointer',
      transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
      
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: shadows.raised[elevation === 'sm' ? 'base' : elevation === 'lg' ? 'xl' : 'lg'],
      }
    };
  }
  
  return baseCard;
};

// Loading skeleton with neumorphic effect
export const createSkeleton = (
  width: string = '100%',
  height: string = '1rem'
) => ({
  width,
  height,
  backgroundColor: colors.surface.secondary,
  borderRadius: borderRadius.base,
  boxShadow: shadows.inset.sm,
  position: 'relative' as const,
  overflow: 'hidden' as const,
  
  '&::after': {
    content: '""',
    position: 'absolute' as const,
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${colors.shadow.light}, transparent)`,
    animation: 'skeleton-loading 1.5s infinite ease-in-out',
  }
});

// Progress bar with neumorphic styling
export const createProgressBar = (
  progress: number,
  color: 'primary' | 'success' | 'warning' | 'error' = 'primary'
) => {
  const colorMap = {
    primary: colors.brand.primary,
    success: colors.semantic.success,
    warning: colors.semantic.warning,
    error: colors.semantic.error,
  };
  
  return {
    track: {
      width: '100%',
      height: '8px',
      backgroundColor: colors.surface.primary,
      borderRadius: borderRadius.base,
      boxShadow: shadows.inset.sm,
      overflow: 'hidden' as const,
    },
    
    fill: {
      width: `${Math.min(100, Math.max(0, progress))}%`,
      height: '100%',
      background: `linear-gradient(90deg, ${colorMap[color]}, ${colorMap[color]}dd)`,
      borderRadius: borderRadius.base,
      boxShadow: `0 2px 4px ${colors.shadow[color] || colors.shadow.primary}`,
      transition: `width ${animation.duration.slow} ${animation.easing.smooth}`,
    }
  };
};

// Badge/chip styling
export const createBadge = (
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' = 'primary',
  size: 'sm' | 'base' = 'base'
) => {
  const variants = {
    primary: { bg: colors.brand.primary, text: colors.text.inverse },
    secondary: { bg: colors.brand.secondary, text: colors.text.inverse },
    success: { bg: colors.semantic.success, text: colors.text.inverse },
    warning: { bg: colors.semantic.warning, text: colors.text.inverse },
    error: { bg: colors.semantic.error, text: colors.text.inverse },
  };
  
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: size === 'sm' ? '0.25rem 0.5rem' : '0.375rem 0.75rem',
    backgroundColor: variants[variant].bg,
    color: variants[variant].text,
    fontSize: size === 'sm' ? '0.75rem' : '0.875rem',
    fontWeight: 600,
    borderRadius: borderRadius.full,
    boxShadow: shadows.brand[variant] || shadows.brand.primary,
    whiteSpace: 'nowrap' as const,
  };
};

// Tooltip styling
export const createTooltip = () => ({
  backgroundColor: colors.text.primary,
  color: colors.text.inverse,
  padding: `${spacing[2]} ${spacing[3]}`,
  borderRadius: borderRadius.base,
  fontSize: '0.875rem',
  fontWeight: 500,
  maxWidth: '200px',
  boxShadow: shadows.floating.md,
  zIndex: 1800,
  
  // Arrow styling
  '&[data-popper-placement^="top"] > .tooltip-arrow': {
    bottom: '-4px',
    borderTopColor: colors.text.primary,
  },
  
  '&[data-popper-placement^="bottom"] > .tooltip-arrow': {
    top: '-4px',
    borderBottomColor: colors.text.primary,
  },
  
  '&[data-popper-placement^="left"] > .tooltip-arrow': {
    right: '-4px',
    borderLeftColor: colors.text.primary,
  },
  
  '&[data-popper-placement^="right"] > .tooltip-arrow': {
    left: '-4px',
    borderRightColor: colors.text.primary,
  }
});

// Responsive helper
export const createResponsive = (styles: Record<string, any>) => {
  const breakpointMap = {
    xs: '0px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  };

  const breakpointKeys = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
  const result: Record<string, any> = {};

  breakpointKeys.forEach(bp => {
    if (styles[bp]) {
      if (bp === 'xs') {
        Object.assign(result, styles[bp]);
      } else {
        result[`@media (min-width: ${breakpointMap[bp]})`] = styles[bp];
      }
    }
  });

  return result;
};

// Prominent pressed button - for customer-facing pages with VISIBLE neumorphic effects
export const createPressedButton = (
  variant: 'primary' | 'secondary' = 'primary',
  size: 'sm' | 'base' | 'lg' | 'xl' = 'base'
): {
  base: React.CSSProperties;
  hover: React.CSSProperties;
  active: React.CSSProperties;
  disabled: React.CSSProperties;
} => {
  const paddingMap = {
    sm: `${spacing[2]} ${spacing[4]}`,
    base: `${spacing[4]} ${spacing[6]}`,
    lg: `${spacing[4]} ${spacing[8]}`,
    xl: `${spacing[5]} ${spacing[10]}`,
  };

  const fontSizeMap = {
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
  };

  const shadowSize: 'sm' | 'base' | 'md' | 'lg' | 'xl' =
    size === 'sm' ? 'base' :
    size === 'xl' ? 'xl' :
    'lg';

  return {
    base: {
      ...createNeumorphicSurface('raised', shadowSize, 'xl'),
      background: variant === 'primary'
        ? `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.primaryLight})`
        : `linear-gradient(135deg, ${colors.brand.secondary}, ${colors.brand.secondaryLight})`,
      color: colors.text.inverse,
      padding: paddingMap[size],
      fontSize: fontSizeMap[size],
      fontWeight: 700,
      border: 'none',
      cursor: 'pointer',
      transition: `all ${animation.duration.normal} ${animation.easing.smooth}`,
      fontFamily: 'inherit',
    },
    hover: {
      transform: 'translateY(-4px)',
      boxShadow: shadows.raised.xl,
    },
    active: {
      transform: 'scale(0.96)',
      boxShadow: shadows.inset.lg, // DEEP press effect
    },
    disabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none',
    }
  };
};

// Animation keyframes
export const keyframes = {
  'skeleton-loading': {
    '0%': { left: '-100%' },
    '100%': { left: '100%' }
  },
  
  'pulse': {
    '0%, 100%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.05)' }
  },
  
  'bounce': {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-4px)' }
  },
  
  'fadeIn': {
    '0%': { opacity: 0, transform: 'translateY(10px)' },
    '100%': { opacity: 1, transform: 'translateY(0)' }
  },
  
  'slideIn': {
    '0%': { opacity: 0, transform: 'translateX(-20px)' },
    '100%': { opacity: 1, transform: 'translateX(0)' }
  }
};