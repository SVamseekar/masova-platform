/**
 * StatusBadge Component
 * Modern pill-shaped status indicator with pulse animation
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { colors, spacing, borderRadius, typography, animations, components } from '../../../../styles/driver-design-tokens';

export type StatusType = 'online' | 'offline' | 'delivering' | 'idle';

export interface StatusBadgeProps {
  status: StatusType;
  showDot?: boolean;
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
}

const statusConfig: Record<
  StatusType,
  { label: string; color: string; backgroundColor: string }
> = {
  online: {
    label: 'Online',
    color: colors.semantic.success,
    backgroundColor: colors.semantic.successBg,
  },
  offline: {
    label: 'Offline',
    color: colors.surface.disabled,
    backgroundColor: colors.surface.backgroundAlt,
  },
  delivering: {
    label: 'On Delivery',
    color: colors.semantic.info,
    backgroundColor: colors.semantic.infoBg,
  },
  idle: {
    label: 'Idle',
    color: colors.semantic.warning,
    backgroundColor: colors.semantic.warningBg,
  },
};

const sizeConfig = {
  small: {
    height: '24px',
    fontSize: typography.fontSize.small,
    dotSize: '6px',
    padding: `0 ${spacing.sm}`,
  },
  medium: {
    height: components.statusBadge.height,
    fontSize: typography.fontSize.caption,
    dotSize: components.statusBadge.dotSize,
    padding: `0 ${spacing.md}`,
  },
  large: {
    height: '40px',
    fontSize: typography.fontSize.body,
    dotSize: '10px',
    padding: `0 ${spacing.base}`,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showDot = true,
  size = 'medium',
  animated = true,
}) => {
  const config = statusConfig[status];
  const sizeProps = sizeConfig[size];

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.xs,
        height: sizeProps.height,
        padding: sizeProps.padding,
        backgroundColor: config.backgroundColor,
        borderRadius: borderRadius.full,
        border: `1px solid ${config.color}`,
      }}
    >
      {/* Status dot */}
      {showDot && (
        <Box
          sx={{
            width: sizeProps.dotSize,
            height: sizeProps.dotSize,
            borderRadius: '50%',
            backgroundColor: config.color,

            // Pulse animation for online and delivering status
            ...(animated && (status === 'online' || status === 'delivering') && {
              '@keyframes pulse': {
                '0%, 100%': {
                  opacity: 1,
                  transform: 'scale(1)',
                },
                '50%': {
                  opacity: 0.7,
                  transform: 'scale(1.2)',
                },
              },
              animation: `pulse 2s ${animations.easing.standard} infinite`,
            }),
          }}
        />
      )}

      {/* Status label */}
      <Typography
        sx={{
          fontSize: sizeProps.fontSize,
          fontWeight: typography.fontWeight.semibold,
          color: config.color,
          lineHeight: 1,
        }}
      >
        {config.label}
      </Typography>
    </Box>
  );
};

export default StatusBadge;
