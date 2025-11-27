import React, { forwardRef, InputHTMLAttributes } from 'react';
import { createNeumorphicSurface } from '../../../styles/neumorphic-utils';
import { colors, spacing, typography } from '../../../styles/design-tokens';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  label?: string;
  size?: 'sm' | 'base' | 'lg';
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  size = 'base',
  checked,
  disabled,
  className = '',
  style,
  ...props
}, ref) => {
  const sizeMap = {
    sm: { box: '16px', icon: '10px', fontSize: typography.fontSize.xs },
    base: { box: '20px', icon: '12px', fontSize: typography.fontSize.sm },
    lg: { box: '24px', icon: '14px', fontSize: typography.fontSize.base },
  };

  const currentSize = sizeMap[size];

  const containerStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[3],
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    userSelect: 'none',
    fontFamily: typography.fontFamily.primary,
  };

  const checkboxWrapperStyles: React.CSSProperties = {
    position: 'relative',
    width: currentSize.box,
    height: currentSize.box,
    flexShrink: 0,
  };

  const checkboxBoxStyles: React.CSSProperties = {
    ...(checked
      ? createNeumorphicSurface('inset', 'sm', 'base')
      : createNeumorphicSurface('raised', 'sm', 'base')
    ),
    width: '100%',
    height: '100%',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: checked ? colors.brand.primary : colors.surface.primary,
    border: `2px solid ${checked ? colors.brand.primary : colors.surface.tertiary}`,
  };

  const checkmarkStyles: React.CSSProperties = {
    width: currentSize.icon,
    height: currentSize.icon,
    color: colors.text.inverse,
    opacity: checked ? 1 : 0,
    transform: checked ? 'scale(1)' : 'scale(0.5)',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    fontWeight: typography.fontWeight.bold,
  };

  const hiddenInputStyles: React.CSSProperties = {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
    cursor: disabled ? 'not-allowed' : 'pointer',
    margin: 0,
  };

  const labelStyles: React.CSSProperties = {
    fontSize: currentSize.fontSize,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
  };

  return (
    <label style={{ ...containerStyles, ...style }} className={className}>
      <div style={checkboxWrapperStyles}>
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          style={hiddenInputStyles}
          {...props}
        />
        <div style={checkboxBoxStyles}>
          <svg
            style={checkmarkStyles}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
      {label && <span style={labelStyles}>{label}</span>}
    </label>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
