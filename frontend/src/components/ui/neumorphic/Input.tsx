import React, { forwardRef, InputHTMLAttributes, useState } from 'react';
import { createInputField } from '../../../styles/neumorphic-utils';
import { colors, spacing, typography } from '../../../styles/design-tokens';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'base' | 'lg';
  state?: 'default' | 'error' | 'success';
  label?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  size = 'base',
  state = 'default',
  label,
  helperText,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  type = 'text',
  className = '',
  style,
  id,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputStyles = createInputField(size, state);
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const actualType = showPasswordToggle && type === 'password' 
    ? showPassword ? 'text' : 'password'
    : type;
  
  const hasLeftIcon = !!leftIcon;
  const hasRightIcon = !!rightIcon || showPasswordToggle;
  
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
  };
  
  const inputContainerStyles: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };
  
  const combinedInputStyles: React.CSSProperties = {
    ...inputStyles,
    paddingLeft: hasLeftIcon ? '2.5rem' : inputStyles.padding.split(' ')[1],
    paddingRight: hasRightIcon ? '2.5rem' : inputStyles.padding.split(' ')[1],
    ...style
  };
  
  const labelStyles: React.CSSProperties = {
    display: 'block',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: state === 'error' ? colors.semantic.error : colors.text.secondary,
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  };
  
  const helperTextStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: state === 'error' ? colors.semantic.error : 
           state === 'success' ? colors.semantic.success : 
           colors.text.tertiary,
    marginTop: spacing[1],
    lineHeight: typography.lineHeight.normal,
  };
  
  const iconStyles: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.text.tertiary,
    fontSize: size === 'sm' ? '1rem' : size === 'lg' ? '1.25rem' : '1.125rem',
    zIndex: 1,
  };

  return (
    <div style={containerStyles} className={`neumorphic-input-container ${className}`}>
      {label && (
        <label htmlFor={inputId} style={labelStyles}>
          {label}
        </label>
      )}
      
      <div style={inputContainerStyles}>
        {leftIcon && (
          <span style={{ ...iconStyles, left: '0.75rem' }}>
            {leftIcon}
          </span>
        )}
        
        <input
          ref={ref}
          id={inputId}
          type={actualType}
          style={combinedInputStyles}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              ...iconStyles,
              right: '0.75rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: spacing[1],
              borderRadius: '0.375rem',
              transition: 'color 0.2s ease',
            }}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        )}
        
        {rightIcon && !showPasswordToggle && (
          <span style={{ ...iconStyles, right: '0.75rem' }}>
            {rightIcon}
          </span>
        )}
      </div>
      
      {helperText && (
        <div style={helperTextStyles}>
          {helperText}
        </div>
      )}
      
      <style>{`
        .neumorphic-input-container input:focus {
          outline: none;
        }
        
        .neumorphic-input-container input::placeholder {
          transition: opacity 0.2s ease;
        }
        
        .neumorphic-input-container input:focus::placeholder {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
});

Input.displayName = 'Input';

export default Input;