/**
 * Animation Utilities for Driver App
 * Provides reusable animation configurations and helper functions
 */

import { CSSProperties } from 'react';
import { animations } from '../../../styles/driver-design-tokens';

// ============================================================================
// KEYFRAME ANIMATIONS
// ============================================================================

export const keyframes = {
  // Pulse animation for online status
  pulse: `
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.8;
        transform: scale(1.05);
      }
    }
  `,

  // Shimmer loading animation
  shimmer: `
    @keyframes shimmer {
      0% {
        background-position: -1000px 0;
      }
      100% {
        background-position: 1000px 0;
      }
    }
  `,

  // Slide up from bottom
  slideUp: `
    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,

  // Slide down
  slideDown: `
    @keyframes slideDown {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,

  // Slide in from right
  slideInRight: `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `,

  // Slide in from left
  slideInLeft: `
    @keyframes slideInLeft {
      from {
        transform: translateX(-100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `,

  // Fade in
  fadeIn: `
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `,

  // Fade out
  fadeOut: `
    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }
  `,

  // Scale in
  scaleIn: `
    @keyframes scaleIn {
      from {
        transform: scale(0.8);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
  `,

  // Bounce
  bounce: `
    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }
  `,

  // Shake (for errors)
  shake: `
    @keyframes shake {
      0%, 100% {
        transform: translateX(0);
      }
      10%, 30%, 50%, 70%, 90% {
        transform: translateX(-5px);
      }
      20%, 40%, 60%, 80% {
        transform: translateX(5px);
      }
    }
  `,

  // Checkmark draw animation
  checkmarkDraw: `
    @keyframes checkmarkDraw {
      0% {
        stroke-dashoffset: 100;
      }
      100% {
        stroke-dashoffset: 0;
      }
    }
  `,

  // Spin (for loaders)
  spin: `
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `,

  // Ripple effect
  ripple: `
    @keyframes ripple {
      0% {
        transform: scale(0);
        opacity: 1;
      }
      100% {
        transform: scale(4);
        opacity: 0;
      }
    }
  `,
};

// ============================================================================
// ANIMATION STYLES
// ============================================================================

export const animationStyles = {
  pulse: {
    animation: `pulse 2s ${animations.easing.standard} infinite`,
  },

  shimmer: (backgroundColor: string = '#f0f0f0', highlightColor: string = '#e0e0e0') => ({
    background: `linear-gradient(90deg, ${backgroundColor} 0%, ${highlightColor} 20%, ${backgroundColor} 40%, ${backgroundColor} 100%)`,
    backgroundSize: '1000px 100%',
    animation: `shimmer 2s ${animations.easing.standard} infinite`,
  }),

  slideUp: (duration: string = animations.duration.normal) => ({
    animation: `slideUp ${duration} ${animations.easing.decelerate}`,
  }),

  slideDown: (duration: string = animations.duration.normal) => ({
    animation: `slideDown ${duration} ${animations.easing.decelerate}`,
  }),

  slideInRight: (duration: string = animations.duration.normal) => ({
    animation: `slideInRight ${duration} ${animations.easing.decelerate}`,
  }),

  slideInLeft: (duration: string = animations.duration.normal) => ({
    animation: `slideInLeft ${duration} ${animations.easing.decelerate}`,
  }),

  fadeIn: (duration: string = animations.duration.normal) => ({
    animation: `fadeIn ${duration} ${animations.easing.standard}`,
  }),

  fadeOut: (duration: string = animations.duration.normal) => ({
    animation: `fadeOut ${duration} ${animations.easing.standard}`,
  }),

  scaleIn: (duration: string = animations.duration.normal) => ({
    animation: `scaleIn ${duration} ${animations.easing.spring}`,
  }),

  bounce: {
    animation: `bounce 1s ${animations.easing.standard} infinite`,
  },

  shake: {
    animation: `shake 0.5s ${animations.easing.standard}`,
  },

  spin: {
    animation: `spin 1s linear infinite`,
  },

  ripple: {
    animation: `ripple 0.6s ${animations.easing.standard}`,
  },
};

// ============================================================================
// TRANSITION STYLES
// ============================================================================

export const transitions = {
  // Button press effect
  buttonPress: {
    transition: `transform ${animations.duration.fast} ${animations.easing.standard}`,
    '&:active': {
      transform: 'scale(0.95)',
    },
  },

  // Card elevation on hover/press
  cardElevation: {
    transition: `all ${animations.duration.normal} ${animations.easing.standard}`,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    },
    '&:active': {
      transform: 'translateY(0)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
  },

  // Smooth opacity
  opacity: (duration: string = animations.duration.normal) => ({
    transition: `opacity ${duration} ${animations.easing.standard}`,
  }),

  // Smooth color
  color: (duration: string = animations.duration.normal) => ({
    transition: `color ${duration} ${animations.easing.standard}`,
  }),

  // Smooth background
  background: (duration: string = animations.duration.normal) => ({
    transition: `background ${duration} ${animations.easing.standard}`,
  }),

  // Smooth transform
  transform: (duration: string = animations.duration.normal) => ({
    transition: `transform ${duration} ${animations.easing.standard}`,
  }),

  // All properties
  all: (duration: string = animations.duration.normal) => ({
    transition: `all ${duration} ${animations.easing.standard}`,
  }),
};

// ============================================================================
// SWIPE GESTURES
// ============================================================================

export interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export const useSwipe = (handlers: SwipeHandlers) => {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  const threshold = handlers.threshold || 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX = e.touches[0].clientX;
    touchEndY = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }
    }
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
};

// ============================================================================
// SKELETON LOADER STYLES
// ============================================================================

export const skeletonStyles = {
  base: {
    borderRadius: '8px',
    background: 'linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 20%, #f0f0f0 40%, #f0f0f0 100%)',
    backgroundSize: '1000px 100%',
    animation: `shimmer 2s ${animations.easing.standard} infinite`,
  },

  text: (width: string = '100%', height: string = '16px') => ({
    ...skeletonStyles.base,
    width,
    height,
  }),

  avatar: (size: string = '48px') => ({
    ...skeletonStyles.base,
    width: size,
    height: size,
    borderRadius: '50%',
  }),

  card: (height: string = '100px') => ({
    ...skeletonStyles.base,
    height,
    width: '100%',
  }),
};

// ============================================================================
// PAGE TRANSITION VARIANTS (for react-router)
// ============================================================================

export const pageTransitions = {
  slideRight: {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
    transition: { duration: 0.3, ease: 'easeInOut' },
  },

  slideLeft: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 },
    transition: { duration: 0.3, ease: 'easeInOut' },
  },

  fadeScale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
    transition: { duration: 0.3, ease: 'easeInOut' },
  },

  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },
};

// ============================================================================
// STAGGER CHILDREN ANIMATION
// ============================================================================

export const staggerChildren = (delayBetween: number = 0.1) => ({
  animate: {
    transition: {
      staggerChildren: delayBetween,
    },
  },
});

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// ============================================================================
// INJECT KEYFRAMES (for use in styled components or inline styles)
// ============================================================================

export const injectKeyframes = () => {
  if (typeof document === 'undefined') return;

  // Check if keyframes are already injected
  if (document.getElementById('driver-app-keyframes')) return;

  const styleSheet = document.createElement('style');
  styleSheet.id = 'driver-app-keyframes';
  styleSheet.textContent = Object.values(keyframes).join('\n');
  document.head.appendChild(styleSheet);
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a spring animation style
 */
export const createSpringStyle = (
  property: string = 'transform',
  duration: string = animations.duration.normal
): CSSProperties => ({
  transition: `${property} ${duration} ${animations.easing.spring}`,
});

/**
 * Creates a staggered animation delay for list items
 */
export const getStaggerDelay = (index: number, baseDelay: number = 50): string => {
  return `${index * baseDelay}ms`;
};

/**
 * Debounce function for animations
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Request animation frame wrapper
 */
export const requestAnimFrame = (callback: () => void) => {
  return window.requestAnimationFrame(callback);
};

/**
 * Cancel animation frame wrapper
 */
export const cancelAnimFrame = (id: number) => {
  return window.cancelAnimationFrame(id);
};

export default {
  keyframes,
  animationStyles,
  transitions,
  useSwipe,
  skeletonStyles,
  pageTransitions,
  staggerChildren,
  staggerItem,
  injectKeyframes,
  createSpringStyle,
  getStaggerDelay,
  debounce,
  requestAnimFrame,
  cancelAnimFrame,
};
