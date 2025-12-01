import React, { forwardRef, HTMLAttributes } from 'react';
import { colors, borderRadius, shadows } from '../../../styles/design-tokens';

export interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'base' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'neutral';
  speed?: 'slow' | 'normal' | 'fast';
}

const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(({
  size = 'base',
  variant = 'primary',
  speed = 'normal',
  className = '',
  style,
  ...props
}, ref) => {
  const sizeMap = {
    sm: '1rem',
    base: '1.5rem',
    lg: '2rem',
    xl: '3rem',
  };
  
  const speedMap = {
    slow: '2s',
    normal: '1s',
    fast: '0.5s',
  };
  
  const variantMap = {
    primary: colors.brand.primary,
    secondary: colors.brand.secondary,
    neutral: colors.text.secondary,
  };
  
  const spinnerSize = sizeMap[size];
  const animationDuration = speedMap[speed];
  const color = variantMap[variant];
  
  const spinnerStyles: React.CSSProperties = {
    width: spinnerSize,
    height: spinnerSize,
    border: `2px solid ${colors.surface.secondary}`,
    borderTop: `2px solid ${color}`,
    borderRadius: '50%',
    display: 'inline-block',
    animation: `spin ${animationDuration} linear infinite`,
    ...style
  };

  return (
    <div
      ref={ref}
      className={`neumorphic-spinner ${className}`}
      style={spinnerStyles}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export { LoadingSpinner };
export default LoadingSpinner;