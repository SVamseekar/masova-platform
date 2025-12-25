/**
 * MetricCard Component
 * Clean, Uber-style metric display card with optional neumorphic variant
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { colors, spacing, borderRadius, shadows, createCard, createNeumorphicSurface, typography, animations } from '../../../../styles/driver-design-tokens';

export interface MetricCardProps {
  icon?: React.ReactNode;
  value: string | number;
  label: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  sparkline?: number[];
  variant?: 'flat' | 'neumorphic';
  onClick?: () => void;
  loading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  value,
  label,
  trend,
  sparkline,
  variant = 'flat',
  onClick,
  loading = false,
}) => {
  const cardStyle = variant === 'neumorphic'
    ? createNeumorphicSurface('raised')
    : createCard();

  if (loading) {
    return (
      <Box
        sx={{
          ...cardStyle,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.sm,
          cursor: onClick ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Skeleton loader */}
        <Box
          sx={{
            width: '32px',
            height: '32px',
            borderRadius: '4px',
            background: colors.surface.backgroundAlt,
            animation: 'shimmer 2s infinite',
          }}
        />
        <Box
          sx={{
            width: '60%',
            height: '32px',
            borderRadius: '4px',
            background: colors.surface.backgroundAlt,
            animation: 'shimmer 2s infinite',
          }}
        />
        <Box
          sx={{
            width: '40%',
            height: '14px',
            borderRadius: '4px',
            background: colors.surface.backgroundAlt,
            animation: 'shimmer 2s infinite',
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      onClick={onClick}
      sx={{
        ...cardStyle,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
        cursor: onClick ? 'pointer' : 'default',
        transition: `all ${animations.duration.normal} ${animations.easing.standard}`,
        position: 'relative',
        overflow: 'hidden',

        ...(onClick && {
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: shadows.elevated,
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        }),
      }}
    >
      {/* Icon */}
      {icon && (
        <Box
          sx={{
            fontSize: '24px',
            color: colors.primary.green,
          }}
        >
          {icon}
        </Box>
      )}

      {/* Value */}
      <Typography
        sx={{
          fontSize: typography.fontSize.hero,
          fontWeight: typography.fontWeight.bold,
          color: colors.text.primary,
          lineHeight: typography.lineHeight.tight,
        }}
      >
        {value}
      </Typography>

      {/* Label */}
      <Typography
        sx={{
          fontSize: typography.fontSize.caption,
          fontWeight: typography.fontWeight.regular,
          color: colors.text.secondary,
          lineHeight: typography.lineHeight.normal,
        }}
      >
        {label}
      </Typography>

      {/* Trend indicator */}
      {trend && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            marginTop: spacing.xs,
          }}
        >
          <Typography
            sx={{
              fontSize: typography.fontSize.small,
              fontWeight: typography.fontWeight.medium,
              color: trend.isPositive ? colors.semantic.success : colors.semantic.error,
            }}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </Typography>
          <Typography
            sx={{
              fontSize: typography.fontSize.small,
              color: colors.text.tertiary,
            }}
          >
            vs last period
          </Typography>
        </Box>
      )}

      {/* Sparkline mini chart */}
      {sparkline && sparkline.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '40%',
            height: '30px',
            opacity: 0.3,
          }}
        >
          <svg width="100%" height="100%" preserveAspectRatio="none">
            <polyline
              points={sparkline
                .map((val, idx) => {
                  const x = (idx / (sparkline.length - 1)) * 100;
                  const y = 100 - (val / Math.max(...sparkline)) * 100;
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke={colors.primary.green}
              strokeWidth="2"
            />
          </svg>
        </Box>
      )}
    </Box>
  );
};

export default MetricCard;
