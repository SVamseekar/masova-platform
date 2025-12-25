/**
 * DeliveryHistoryPage - Redesigned (Timeline Style)
 * Modern timeline view with charts and clean search/filter
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  MenuItem,
  Divider,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useGetOrdersByStatusQuery } from '../../../store/api/orderApi';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { MetricCard, StatsChart } from '../components/shared';
import { colors, spacing, typography, borderRadius, shadows, animations } from '../../../styles/driver-design-tokens';
import { skeletonStyles } from '../utils/animations';

const DeliveryHistoryPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [timeFilter, setTimeFilter] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'day' | 'week' | 'month'>('week');

  // Fetch delivered orders
  const { data: deliveredOrders, isLoading } = useGetOrdersByStatusQuery('DELIVERED', {
    pollingInterval: 60000
  });

  // Filter orders for this driver
  const myDeliveries = deliveredOrders?.filter((order: any) =>
    order.assignedDriver?.id === user?.id || order.assignedDriver === user?.id
  ) || [];

  // Apply time filter
  const filteredByTime = myDeliveries.filter((order: any) => {
    const orderDate = new Date(order.deliveredAt || order.updatedAt);
    const now = new Date();

    switch (timeFilter) {
      case 'today':
        return orderDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= weekAgo;
      case 'month':
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });

  // Apply search filter
  const filteredDeliveries = filteredByTime.filter((order: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const orderNumber = (order.orderNumber || (order.id || order._id).slice(-6)).toLowerCase();
    const customerName = (order.customer?.name || '').toLowerCase();
    return orderNumber.includes(query) || customerName.includes(query);
  });

  // Calculate stats
  const stats = {
    totalDeliveries: filteredDeliveries.length,
    totalEarnings: filteredDeliveries.reduce((sum: number, order: any) => sum + (order.totalAmount * 0.2), 0),
    totalDistance: filteredDeliveries.length * 5.5,
    avgDeliveryTime: 28
  };

  // Mock chart data (replace with real API data)
  const deliveryChartData = [
    { label: 'Mon', value: 12 },
    { label: 'Tue', value: 15 },
    { label: 'Wed', value: 18 },
    { label: 'Thu', value: 14 },
    { label: 'Fri', value: 22 },
    { label: 'Sat', value: 28 },
    { label: 'Sun', value: filteredDeliveries.length },
  ];

  // Group deliveries by date
  const groupedDeliveries = filteredDeliveries.reduce((groups: any, order: any) => {
    const date = new Date(order.deliveredAt || order.updatedAt);
    const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(order);
    return groups;
  }, {});

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: spacing.lg }}>
        <Box sx={{ mb: spacing.lg }}>
          <Box sx={{ ...skeletonStyles.text('250px', '24px'), mb: spacing.sm }} />
          <Box sx={{ ...skeletonStyles.text('180px', '14px') }} />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.md, mb: spacing.lg }}>
          {[1, 2, 3, 4].map((i) => (
            <Box key={i} sx={{ ...skeletonStyles.card('100px') }} />
          ))}
        </Box>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100%',
        background: colors.surface.backgroundAlt,
      }}
    >
      <Container maxWidth="md" sx={{ py: spacing.lg, pb: `calc(${spacing.xxl} + ${spacing.lg})` }}>
        {/* Header */}
        <Box sx={{ mb: spacing.lg }}>
          <Typography
            sx={{
              fontSize: typography.fontSize.h1,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              mb: spacing.xs,
            }}
          >
            Delivery History
          </Typography>
          <Typography
            sx={{
              fontSize: typography.fontSize.caption,
              color: colors.text.secondary,
            }}
          >
            {filteredDeliveries.length} {filteredDeliveries.length === 1 ? 'delivery' : 'deliveries'} completed
          </Typography>
        </Box>

        {/* Filter Bar */}
        <Box
          sx={{
            display: 'flex',
            gap: spacing.md,
            marginBottom: spacing.lg,
            background: colors.surface.background,
            padding: spacing.base,
            borderRadius: borderRadius.md,
            boxShadow: shadows.subtle,
          }}
        >
          <TextField
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: colors.text.tertiary, fontSize: '20px' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: borderRadius.sm,
                fontSize: typography.fontSize.body,
                '& fieldset': {
                  borderColor: colors.surface.border,
                },
                '&:hover fieldset': {
                  borderColor: colors.primary.green,
                },
              },
            }}
          />

          <TextField
            select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            size="small"
            sx={{
              minWidth: '120px',
              '& .MuiOutlinedInput-root': {
                borderRadius: borderRadius.sm,
                fontSize: typography.fontSize.body,
              },
            }}
          >
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </TextField>
        </Box>

        {/* Deliveries Chart */}
        {filteredDeliveries.length > 0 && (
          <Box sx={{ mb: spacing.lg }}>
            <StatsChart
              title="Deliveries Over Time"
              data={deliveryChartData}
              type="bar"
              height={180}
              showPeriodToggle
              currentPeriod={chartPeriod}
              onPeriodChange={setChartPeriod}
            />
          </Box>
        )}

        {/* Timeline List */}
        {filteredDeliveries.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: spacing.xxl,
            }}
          >
            <Box sx={{ fontSize: '64px', mb: spacing.base, opacity: 0.5, display: 'flex', justifyContent: 'center', color: colors.text.secondary }}>
              <CheckCircleIcon sx={{ fontSize: '64px' }} />
            </Box>
            <Typography
              sx={{
                fontSize: typography.fontSize.h2,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
                mb: spacing.xs,
              }}
            >
              No Deliveries Found
            </Typography>
            <Typography
              sx={{
                fontSize: typography.fontSize.body,
                color: colors.text.secondary,
              }}
            >
              {searchQuery ? 'Try adjusting your search or filters' : 'Complete deliveries will appear here'}
            </Typography>
          </Box>
        ) : (
          <Box>
            {Object.entries(groupedDeliveries).map(([date, orders]: [string, any]) => (
              <Box key={date} sx={{ mb: spacing.lg }}>
                {/* Date Header */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md,
                    mb: spacing.base,
                  }}
                >
                  <Divider sx={{ flexGrow: 1, borderColor: colors.surface.border }} />
                  <Typography
                    sx={{
                      fontSize: typography.fontSize.caption,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.secondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {date}
                  </Typography>
                  <Divider sx={{ flexGrow: 1, borderColor: colors.surface.border }} />
                </Box>

                {/* Timeline Items */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                  {orders.map((order: any) => {
                    const deliveryTime = new Date(order.deliveredAt || order.updatedAt);
                    const earnings = (order.totalAmount * 0.2).toFixed(0);
                    const isExpanded = expandedOrder === (order.id || order._id);

                    return (
                      <Box
                        key={order.id || order._id}
                        sx={{
                          display: 'flex',
                          gap: spacing.base,
                          alignItems: 'flex-start',
                        }}
                      >
                        {/* Timeline Dot */}
                        <Box
                          sx={{
                            marginTop: spacing.xs,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                          }}
                        >
                          <CheckCircleIcon
                            sx={{
                              fontSize: '20px',
                              color: colors.semantic.success,
                            }}
                          />
                        </Box>

                        {/* Order Card */}
                        <Box
                          sx={{
                            flex: 1,
                            background: colors.surface.background,
                            borderRadius: borderRadius.md,
                            padding: spacing.base,
                            boxShadow: shadows.subtle,
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              mb: spacing.sm,
                            }}
                          >
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                sx={{
                                  fontSize: typography.fontSize.caption,
                                  color: colors.text.secondary,
                                  lineHeight: typography.lineHeight.tight,
                                }}
                              >
                                {deliveryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: typography.fontSize.body,
                                  fontWeight: typography.fontWeight.semibold,
                                  color: colors.text.primary,
                                }}
                              >
                                #{order.orderNumber || (order.id || order._id).slice(-6).toUpperCase()} · ₹{order.totalAmount}
                              </Typography>
                            </Box>

                            <Box sx={{ textAlign: 'right' }}>
                              <Typography
                                sx={{
                                  fontSize: typography.fontSize.h2,
                                  fontWeight: typography.fontWeight.bold,
                                  color: colors.semantic.success,
                                  lineHeight: typography.lineHeight.tight,
                                }}
                              >
                                +₹{earnings}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: typography.fontSize.small,
                                  color: colors.text.tertiary,
                                }}
                              >
                                earned
                              </Typography>
                            </Box>
                          </Box>

                          <Typography
                            sx={{
                              fontSize: typography.fontSize.caption,
                              color: colors.text.secondary,
                              mb: spacing.xs,
                            }}
                          >
                            {order.customer?.name || 'Customer'} · {(stats.totalDistance / stats.totalDeliveries).toFixed(1)} km · {stats.avgDeliveryTime} min
                          </Typography>

                          {/* Expandable Details */}
                          <Collapse in={isExpanded}>
                            <Divider sx={{ my: spacing.sm }} />
                            <Box sx={{ fontSize: typography.fontSize.caption, color: colors.text.secondary }}>
                              <Box sx={{ mb: spacing.xs }}>
                                <strong>Address:</strong> {order.deliveryAddress || 'N/A'}
                              </Box>
                              {order.items && order.items.length > 0 && (
                                <Box>
                                  <strong>Items ({order.items.length}):</strong>
                                  {order.items.slice(0, 3).map((item: any, idx: number) => (
                                    <Box key={idx} sx={{ ml: spacing.sm }}>
                                      • {item.quantity}x {item.name}
                                    </Box>
                                  ))}
                                  {order.items.length > 3 && (
                                    <Box sx={{ ml: spacing.sm, fontStyle: 'italic' }}>
                                      +{order.items.length - 3} more items
                                    </Box>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Collapse>

                          <IconButton
                            size="small"
                            onClick={() => setExpandedOrder(isExpanded ? null : (order.id || order._id))}
                            sx={{
                              marginTop: spacing.xs,
                              color: colors.text.tertiary,
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                              transition: `transform ${animations.duration.normal} ${animations.easing.standard}`,
                            }}
                          >
                            <ExpandMoreIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default DeliveryHistoryPage;
