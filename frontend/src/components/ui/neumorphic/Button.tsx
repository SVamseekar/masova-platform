import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { createButtonVariant, createNeumorphicStates } from '../../../styles/neumorphic-utils';
import { spacing, components } from '../../../styles/design-tokens';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'base' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'base',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  disabled,
  className = '',
  style,
  ...props
}, ref) => {
  const buttonStyles = createButtonVariant(variant, size);
  
  const sizeMap = {
    sm: { height: components.button.height.sm, padding: components.button.padding.sm, fontSize: '0.875rem' },
    base: { height: components.button.height.base, padding: components.button.padding.base, fontSize: '1rem' },
    lg: { height: components.button.height.lg, padding: components.button.padding.lg, fontSize: '1.125rem' },
    xl: { height: components.button.height.xl, padding: components.button.padding.xl, fontSize: '1.25rem' },
  };
  
  const currentSize = sizeMap[size];
  
  const combinedStyles: React.CSSProperties = {
    ...buttonStyles,
    height: currentSize.height,
    padding: currentSize.padding,
    fontSize: currentSize.fontSize,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    fontFamily: 'inherit',
    fontWeight: 600,
    textDecoration: 'none',
    userSelect: 'none',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
    width: fullWidth ? '100%' : 'auto',
    opacity: (disabled || isLoading) ? 0.6 : 1,
    pointerEvents: (disabled || isLoading) ? 'none' : 'auto',
    ...style
  };

  return (
    <button
      ref={ref}
      className={`neumorphic-button ${className}`}
      style={combinedStyles}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="loading-spinner" style={{
            width: '1rem',
            height: '1rem',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="button-icon">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="button-icon">{rightIcon}</span>}
        </>
      )}
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .neumorphic-button:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        
        .neumorphic-button:active:not(:disabled) {
          transform: scale(0.98);
        }
        
        .button-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </button>
  );
});

Button.displayName = 'Button';

export { Button };
export default Button;