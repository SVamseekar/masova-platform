// src/apps/POSSystem/components/MetricsTiles.tsx
import React from 'react';
import { Grid, Paper, Box, Typography, Skeleton, Alert } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as OrderIcon,
  LocalShipping as DeliveryIcon,
} from '@mui/icons-material';
import { CURRENCY } from '../../../config/business-config';
import {
  useGetTodaySalesMetricsQuery,
  useGetAverageOrderValueQuery,
  useGetDriverStatusQuery,
} from '../../../store/api/analyticsApi';

interface MetricsTilesProps {
  storeId?: string;
}

/**
 * Real-time metrics display for POS dashboard
 * Shows today's sales, comparisons, and operational stats
 */
const MetricsTiles: React.FC<MetricsTilesProps> = ({ storeId = 'default-store' }) => {
  // Fetch real-time metrics from analytics service
  const {
    data: salesMetrics,
    isLoading: salesLoading,
    error: salesError,
  } = useGetTodaySalesMetricsQuery(storeId, {
    pollingInterval: 60000, // Refresh every minute
  });

  const {
    data: avgOrderValue,
    isLoading: avgLoading,
  } = useGetAverageOrderValueQuery(storeId, {
    pollingInterval: 60000,
  });

  const {
    data: driverStatus,
    isLoading: driverLoading,
  } = useGetDriverStatusQuery(storeId, {
    pollingInterval: 30000, // Refresh every 30 seconds
  });

  const isLoading = salesLoading || avgLoading || driverLoading;

  // Show error state if sales data fails to load
  if (salesError) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        Unable to load metrics. Using offline mode.
      </Alert>
    );
  }

  const MetricCard = ({
    title,
    value,
    subtitle,
    icon,
    trend,
    trendValue,
    color = 'primary.main'
  }: any) => (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box
        sx={{
          width: 50,
          height: 50,
          borderRadius: 2,
          backgroundColor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          {title}
        </Typography>
        <Typography variant="h6" fontWeight="bold">
          {isLoading ? <Skeleton width={80} /> : value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        {trend && trendValue !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            {trendValue >= 0 ? (
              <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
            )}
            <Typography
              variant="caption"
              sx={{
                color: trendValue >= 0 ? 'success.main' : 'error.main',
                fontWeight: 'bold',
              }}
            >
              {trendValue >= 0 ? '+' : ''}{trendValue.toFixed(1)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {trend}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );

  return (
    <Grid container spacing={2}>
      {/* Today's Sales */}
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Today's Sales"
          value={salesMetrics ? CURRENCY.format(salesMetrics.todaySales) : '-'}
          subtitle={salesMetrics ? `${salesMetrics.todayOrderCount} orders` : 'Loading...'}
          icon={<MoneyIcon />}
          trend="vs yesterday"
          trendValue={salesMetrics?.percentChangeFromYesterday}
          color="#4caf50"
        />
      </Grid>

      {/* Average Order Value */}
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Avg Order Value"
          value={avgOrderValue ? CURRENCY.format(avgOrderValue.averageOrderValue) : '-'}
          subtitle={avgOrderValue ? `${avgOrderValue.totalOrders} orders` : 'Loading...'}
          icon={<OrderIcon />}
          trend={avgOrderValue ? 'vs yesterday' : undefined}
          trendValue={avgOrderValue?.percentChange}
          color="#2196f3"
        />
      </Grid>

      {/* Year-over-Year Comparison */}
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Last Year (Same Day)"
          value={salesMetrics ? CURRENCY.format(salesMetrics.lastYearSameDaySales) : '-'}
          trend="YoY growth"
          trendValue={salesMetrics?.percentChangeFromLastYear}
          icon={<TrendingUpIcon />}
          color="#ff9800"
        />
      </Grid>

      {/* Active Deliveries */}
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Active Deliveries"
          value={driverStatus?.activeDeliveries ?? '-'}
          subtitle={driverStatus ? `${driverStatus.availableDrivers}/${driverStatus.totalDrivers} drivers available` : 'Loading...'}
          icon={<DeliveryIcon />}
          color="#9c27b0"
        />
      </Grid>
    </Grid>
  );
};

export default MetricsTiles;
