import React, { forwardRef, HTMLAttributes } from 'react';
import { createCard } from '../../../styles/neumorphic-utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: 'sm' | 'base' | 'md' | 'lg';
  padding?: 'sm' | 'base' | 'lg' | 'xl';
  interactive?: boolean;
  as?: 'div' | 'article' | 'section';
}

const Card = forwardRef<HTMLDivElement, CardProps>(({
  elevation = 'base',
  padding = 'base',
  interactive = false,
  as: Component = 'div',
  children,
  className = '',
  style,
  ...props
}, ref) => {
  const cardStyles = createCard(elevation, padding, interactive);
  
  const combinedStyles: React.CSSProperties = {
    ...cardStyles,
    position: 'relative',
    ...style
  };

  return (
    <Component
      ref={ref}
      className={`neumorphic-card ${interactive ? 'interactive' : ''} ${className}`}
      style={combinedStyles}
      {...props}
    >
      {children}
      
      <style>{`
        .neumorphic-card.interactive:hover {
          transform: translateY(-2px);
        }
        
        .neumorphic-card.interactive:active {
          transform: scale(0.99);
        }
      `}</style>
    </Component>
  );
});

Card.displayName = 'Card';

export default Card;