/**
 * ActionButton Component
 * Uber-style action buttons with primary/secondary/neumorphic variants
 */

import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import { colors, spacing, borderRadius, typography, animations, components, createNeumorphicSurface } from '../../../../styles/driver-design-tokens';

export interface ActionButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'neumorphic' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  startIcon,
  endIcon,
  onClick,
  type = 'button',
}) => {
  const sizeStyles = {
    small: {
      height: components.button.height.small,
      fontSize: typography.fontSize.caption,
      padding: `0 ${spacing.md}`,
    },
    medium: {
      height: components.button.height.medium,
      fontSize: typography.fontSize.body,
      padding: `0 ${spacing.base}`,
    },
    large: {
      height: components.button.height.large,
      fontSize: typography.fontSize.h2,
      padding: `0 ${spacing.lg}`,
    },
  };

  const variantStyles = {
    primary: {
      background: colors.primary.green,
      color: colors.text.inverse,
      border: 'none',
      boxShadow: 'none',
      '&:hover': {
        background: colors.primary.greenDark,
        boxShadow: 'none',
      },
      '&:active': {
        background: colors.primary.greenDark,
        transform: 'scale(0.98)',
      },
      '&:disabled': {
        background: colors.surface.disabled,
        color: colors.text.disabled,
      },
    },
    secondary: {
      background: colors.primary.white,
      color: colors.primary.green,
      border: `2px solid ${colors.primary.green}`,
      boxShadow: 'none',
      '&:hover': {
        background: colors.primary.greenLight,
        borderColor: colors.primary.greenDark,
        boxShadow: 'none',
      },
      '&:active': {
        background: colors.primary.greenLight,
        transform: 'scale(0.98)',
      },
      '&:disabled': {
        background: colors.surface.background,
        borderColor: colors.surface.disabled,
        color: colors.text.disabled,
      },
    },
    neumorphic: {
      ...createNeumorphicSurface('raised', colors.surface.background),
      background: colors.surface.background,
      color: colors.text.primary,
      border: 'none',
      '&:hover': {
        ...createNeumorphicSurface('raised', colors.surface.backgroundAlt),
      },
      '&:active': {
        ...createNeumorphicSurface('pressed', colors.surface.background),
        transform: 'scale(0.98)',
      },
      '&:disabled': {
        background: colors.surface.disabled,
        color: colors.text.disabled,
        boxShadow: 'none',
      },
    },
    text: {
      background: 'transparent',
      color: colors.primary.green,
      border: 'none',
      boxShadow: 'none',
      '&:hover': {
        background: colors.primary.greenLight,
        boxShadow: 'none',
      },
      '&:active': {
        background: colors.primary.greenLight,
        transform: 'scale(0.98)',
      },
      '&:disabled': {
        color: colors.text.disabled,
      },
    },
  };

  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      startIcon={!loading && startIcon}
      endIcon={!loading && endIcon}
      sx={{
        ...sizeStyles[size],
        ...variantStyles[variant],
        borderRadius: borderRadius.sm,
        fontWeight: typography.fontWeight.semibold,
        textTransform: 'none',
        transition: `all ${animations.duration.normal} ${animations.easing.standard}`,
        position: 'relative',

        // Disable MUI's default styles
        '&.MuiButton-root': {
          minWidth: 'unset',
        },

        // Loading state
        ...(loading && {
          color: 'transparent',
        }),
      }}
    >
      {children}

      {/* Loading spinner */}
      {loading && (
        <CircularProgress
          size={size === 'small' ? 16 : size === 'medium' ? 20 : 24}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: size === 'small' ? '-8px' : size === 'medium' ? '-10px' : '-12px',
            marginLeft: size === 'small' ? '-8px' : size === 'medium' ? '-10px' : '-12px',
            color: variant === 'primary' ? colors.text.inverse : colors.primary.green,
          }}
        />
      )}
    </Button>
  );
};

export default ActionButton;
