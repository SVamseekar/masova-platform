/**
 * StatsChart Component
 * Earnings/performance chart using Recharts
 */

import React from 'react';
import { Box, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { colors, spacing, borderRadius, typography, createCard } from '../../../../styles/driver-design-tokens';

export interface StatsChartProps {
  data: Array<{ label: string; value: number; date?: string }>;
  title?: string;
  type?: 'line' | 'bar' | 'area';
  height?: number;
  showPeriodToggle?: boolean;
  currentPeriod?: 'day' | 'week' | 'month';
  onPeriodChange?: (period: 'day' | 'week' | 'month') => void;
  valuePrefix?: string;
  valueSuffix?: string;
  loading?: boolean;
}

export const StatsChart: React.FC<StatsChartProps> = ({
  data,
  title,
  type = 'line',
  height = 200,
  showPeriodToggle = false,
  currentPeriod = 'day',
  onPeriodChange,
  valuePrefix = '',
  valueSuffix = '',
  loading = false,
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            background: colors.surface.background,
            padding: spacing.sm,
            borderRadius: borderRadius.xs,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            border: `1px solid ${colors.surface.border}`,
          }}
        >
          <Typography
            sx={{
              fontSize: typography.fontSize.caption,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
            }}
          >
            {payload[0].payload.label}
          </Typography>
          <Typography
            sx={{
              fontSize: typography.fontSize.body,
              fontWeight: typography.fontWeight.bold,
              color: colors.primary.green,
            }}
          >
            {valuePrefix}{payload[0].value}{valueSuffix}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box sx={{ ...createCard(), height }}>
        <Box
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: borderRadius.md,
            background: colors.surface.backgroundAlt,
            animation: 'shimmer 2s infinite',
          }}
        />
      </Box>
    );
  }

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.surface.border} />
            <XAxis
              dataKey="label"
              stroke={colors.text.tertiary}
              style={{ fontSize: typography.fontSize.small }}
            />
            <YAxis
              stroke={colors.text.tertiary}
              style={{ fontSize: typography.fontSize.small }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill={colors.primary.green} radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.primary.green} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors.primary.green} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.surface.border} />
            <XAxis
              dataKey="label"
              stroke={colors.text.tertiary}
              style={{ fontSize: typography.fontSize.small }}
            />
            <YAxis
              stroke={colors.text.tertiary}
              style={{ fontSize: typography.fontSize.small }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={colors.primary.green}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        );

      case 'line':
      default:
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.surface.border} />
            <XAxis
              dataKey="label"
              stroke={colors.text.tertiary}
              style={{ fontSize: typography.fontSize.small }}
            />
            <YAxis
              stroke={colors.text.tertiary}
              style={{ fontSize: typography.fontSize.small }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={colors.primary.green}
              strokeWidth={2}
              dot={{ fill: colors.primary.green, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );
    }
  };

  return (
    <Box sx={{ ...createCard() }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.md,
        }}
      >
        {title && (
          <Typography
            sx={{
              fontSize: typography.fontSize.h2,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            {title}
          </Typography>
        )}

        {showPeriodToggle && onPeriodChange && (
          <ToggleButtonGroup
            value={currentPeriod}
            exclusive
            onChange={(_, value) => value && onPeriodChange(value)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                fontSize: typography.fontSize.small,
                padding: `${spacing.xs} ${spacing.sm}`,
                borderColor: colors.surface.border,
                color: colors.text.secondary,
                textTransform: 'none',

                '&.Mui-selected': {
                  backgroundColor: colors.primary.green,
                  color: colors.text.inverse,
                  borderColor: colors.primary.green,

                  '&:hover': {
                    backgroundColor: colors.primary.greenDark,
                  },
                },
              },
            }}
          >
            <ToggleButton value="day">Day</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </Box>
  );
};

export default StatsChart;
