import React, { forwardRef, HTMLAttributes } from 'react';
import { createBadge } from '../../../styles/neumorphic-utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'base';
  dot?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({
  variant = 'primary',
  size = 'base',
  dot = false,
  children,
  className = '',
  style,
  ...props
}, ref) => {
  const badgeStyles = createBadge(variant, size);
  
  const dotStyles: React.CSSProperties = {
    width: size === 'sm' ? '0.5rem' : '0.625rem',
    height: size === 'sm' ? '0.5rem' : '0.625rem',
    borderRadius: '50%',
    padding: 0,
    minWidth: 'auto',
  };
  
  const combinedStyles: React.CSSProperties = {
    ...badgeStyles,
    ...(dot ? dotStyles : {}),
    ...style
  };

  return (
    <span
      ref={ref}
      className={`neumorphic-badge ${dot ? 'dot' : ''} ${className}`}
      style={combinedStyles}
      {...props}
    >
      {!dot && children}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge;