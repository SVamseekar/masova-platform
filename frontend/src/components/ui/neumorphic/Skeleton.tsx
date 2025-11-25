import React, { forwardRef, HTMLAttributes } from 'react';
import { createSkeleton } from '../../../styles/neumorphic-utils';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: boolean;
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(({
  width = '100%',
  height = '1rem',
  variant = 'text',
  animation = true,
  className = '',
  style,
  ...props
}, ref) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return {
          borderRadius: '50%',
          width: typeof height === 'string' ? height : `${height}px`,
          height: typeof height === 'string' ? height : `${height}px`,
        };
      case 'rectangular':
        return {
          borderRadius: '0.5rem',
        };
      case 'text':
      default:
        return {
          borderRadius: '0.25rem',
        };
    }
  };
  
  const widthValue = typeof width === 'number' ? `${width}px` : width;
  const heightValue = typeof height === 'number' ? `${height}px` : height;
  
  const skeletonStyles = createSkeleton(widthValue, heightValue);
  const variantStyles = getVariantStyles();
  
  const combinedStyles: React.CSSProperties = {
    ...skeletonStyles,
    ...variantStyles,
    ...style
  };

  return (
    <div
      ref={ref}
      className={`neumorphic-skeleton ${variant} ${className}`}
      style={combinedStyles}
      aria-hidden="true"
      {...props}
    >
      {animation && (
        <style>{`
          @keyframes skeleton-loading {
            0% { left: -100%; }
            100% { left: 100%; }
          }
          
          .neumorphic-skeleton::after {
            animation: skeleton-loading 1.5s infinite ease-in-out;
          }
        `}</style>
      )}
    </div>
  );
});

Skeleton.displayName = 'Skeleton';

export default Skeleton;