import React, { forwardRef, HTMLAttributes } from 'react';
import { createProgressBar } from '../../../styles/neumorphic-utils';
import { typography, colors } from '../../../styles/design-tokens';

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  color?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'base' | 'lg';
  showLabel?: boolean;
  label?: string;
  animate?: boolean;
}

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(({
  value,
  max = 100,
  color = 'primary',
  size = 'base',
  showLabel = false,
  label,
  animate = true,
  className = '',
  style,
  ...props
}, ref) => {
  const progress = Math.min(100, Math.max(0, (value / max) * 100));
  const progressStyles = createProgressBar(progress, color);
  
  const sizeMap = {
    sm: '4px',
    base: '8px',
    lg: '12px',
  };
  
  const trackHeight = sizeMap[size];
  
  const containerStyles: React.CSSProperties = {
    width: '100%',
    ...style
  };
  
  const trackStyles: React.CSSProperties = {
    ...progressStyles.track,
    height: trackHeight,
  };
  
  const fillStyles: React.CSSProperties = {
    ...progressStyles.fill,
    transition: animate ? progressStyles.fill.transition : 'none',
  };
  
  const labelStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  };

  return (
    <div
      ref={ref}
      className={`neumorphic-progress ${className}`}
      style={containerStyles}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label || `Progress: ${value} of ${max}`}
      {...props}
    >
      {(showLabel || label) && (
        <div style={labelStyles}>
          {label && <span>{label}</span>}
          {showLabel && <span>{Math.round(progress)}%</span>}
        </div>
      )}
      
      <div style={trackStyles}>
        <div style={fillStyles} />
      </div>
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;