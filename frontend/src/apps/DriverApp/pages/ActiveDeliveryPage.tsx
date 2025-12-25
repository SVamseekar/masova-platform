/**
 * ActiveDeliveryPage - Redesigned (Uber-style)
 * Clean delivery cards with modern layout and actions
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
} from '@mui/material';
import {
  ViewList as ListIcon,
  Map as MapIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useGetOrdersByStatusQuery, useUpdateOrderStatusMutation } from '../../../store/api/orderApi';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { DeliveryCard } from '../components/shared';
import CustomerContact from '../components/CustomerContact';
import { colors, spacing, typography, borderRadius, shadows } from '../../../styles/driver-design-tokens';
import { skeletonStyles } from '../utils/animations';

const ActiveDeliveryPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState<'time' | 'distance' | 'amount'>('time');
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  // Fetch orders assigned to this driver with status DISPATCHED
  const { data: activeOrders, isLoading, refetch } = useGetOrdersByStatusQuery('DISPATCHED', {
    pollingInterval: 30000
  });

  // Filter orders assigned to current driver
  const myDeliveries = activeOrders?.filter((order: any) =>
    order.assignedDriver?.id === user?.id || order.assignedDriver === user?.id
  ) || [];

  useEffect(() => {
    // Auto-select first order if available
    if (myDeliveries.length > 0 && !selectedOrder) {
      setSelectedOrder(myDeliveries[0]);
    }
  }, [myDeliveries, selectedOrder]);

  const handleMarkDelivered = async (orderId: string) => {
    try {
      await updateOrderStatus({
        orderId,
        status: 'DELIVERED'
      }).unwrap();

      // Clear selection and refetch
      setSelectedOrder(null);
      refetch();
    } catch (error) {
      console.error('Failed to mark as delivered:', error);
    }
  };

  const openGoogleMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const formatAddress = (rawAddress: any): string => {
    if (typeof rawAddress === 'string') {
      return rawAddress;
    } else if (rawAddress && typeof rawAddress === 'object') {
      const parts = [
        rawAddress.street,
        rawAddress.landmark,
        rawAddress.city,
        rawAddress.state,
        rawAddress.pincode
      ].filter(Boolean);
      return parts.join(', ') || 'Address not provided';
    }
    return 'Address not provided';
  };

  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: spacing.lg }}>
        {/* Header Skeleton */}
        <Box sx={{ mb: spacing.lg }}>
          <Box sx={{ ...skeletonStyles.text('200px', '24px'), mb: spacing.sm }} />
          <Box sx={{ ...skeletonStyles.text('150px', '14px') }} />
        </Box>

        {/* Card Skeletons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {[1, 2, 3].map((i) => (
            <Box key={i} sx={{ ...skeletonStyles.card('200px') }} />
          ))}
        </Box>
      </Container>
    );
  }

  // Empty state
  if (myDeliveries.length === 0) {
    return (
      <Box
        sx={{
          minHeight: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: colors.gradients.heroBackground,
        }}
      >
        <Container maxWidth="sm" sx={{ py: spacing.xxl, textAlign: 'center' }}>
          {/* Illustration */}
          <Box
            sx={{
              fontSize: '80px',
              mb: spacing.lg,
              opacity: 0.5,
            }}
          >
            🎯
          </Box>

          <Typography
            sx={{
              fontSize: typography.fontSize.h1,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              mb: spacing.sm,
            }}
          >
            No Active Deliveries
          </Typography>

          <Typography
            sx={{
              fontSize: typography.fontSize.body,
              color: colors.text.secondary,
              mb: spacing.lg,
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            You're all caught up! Go online to receive new delivery assignments.
          </Typography>

          {/* Optional CTA */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing.xs,
              padding: `${spacing.sm} ${spacing.base}`,
              background: colors.primary.greenLight,
              color: colors.primary.green,
              borderRadius: borderRadius.full,
              fontSize: typography.fontSize.caption,
              fontWeight: typography.fontWeight.medium,
            }}
          >
            <span>💡</span>
            <span>New orders will appear here automatically</span>
          </Box>
        </Container>
      </Box>
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
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: spacing.lg,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: typography.fontSize.h1,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                lineHeight: typography.lineHeight.tight,
              }}
            >
              Active Deliveries
            </Typography>
            <Typography
              sx={{
                fontSize: typography.fontSize.caption,
                color: colors.text.secondary,
                mt: spacing.xs,
              }}
            >
              {myDeliveries.length} {myDeliveries.length === 1 ? 'order' : 'orders'} in queue
            </Typography>
          </Box>

          {/* View Toggle */}
          <Box sx={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
            {/* Filter Button */}
            <IconButton
              size="small"
              sx={{
                color: colors.text.secondary,
                '&:hover': {
                  backgroundColor: colors.primary.greenLight,
                  color: colors.primary.green,
                },
              }}
            >
              <FilterIcon />
            </IconButton>

            {/* List/Map Toggle */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, value) => value && setViewMode(value)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  padding: spacing.xs,
                  border: `1px solid ${colors.surface.border}`,
                  color: colors.text.secondary,

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
              <ToggleButton value="list">
                <ListIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="map">
                <MapIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Delivery Cards */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md,
          }}
        >
          {myDeliveries.map((order: any) => {
            const rawAddress = order.deliveryAddress || order.customer?.address;
            const customerAddress = formatAddress(rawAddress);
            const customerPhone = order.customer?.phone || 'Phone not provided';
            const customerName = order.customer?.name || 'Customer';

            const items = order.items?.map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
            })) || [];

            return (
              <DeliveryCard
                key={order.id || order._id}
                orderNumber={`#${order.orderNumber || (order.id || order._id).slice(-6).toUpperCase()}`}
                amount={order.totalAmount}
                customerName={customerName}
                customerPhone={customerPhone}
                address={customerAddress}
                items={items}
                onNavigate={() => openGoogleMaps(customerAddress)}
                onContact={() => {
                  setSelectedOrder(order);
                  setShowContactDialog(true);
                }}
                onComplete={() => handleMarkDelivered(order.id || order._id)}
              />
            );
          })}
        </Box>

        {/* Map View Placeholder (for future implementation) */}
        {viewMode === 'map' && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: colors.surface.background,
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                sx={{
                  fontSize: typography.fontSize.h2,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.primary,
                  mb: spacing.sm,
                }}
              >
                Map View
              </Typography>
              <Typography
                sx={{
                  fontSize: typography.fontSize.body,
                  color: colors.text.secondary,
                  mb: spacing.lg,
                }}
              >
                Interactive map with delivery routes coming soon
              </Typography>
              <IconButton
                onClick={() => setViewMode('list')}
                sx={{
                  backgroundColor: colors.primary.green,
                  color: colors.text.inverse,
                  '&:hover': {
                    backgroundColor: colors.primary.greenDark,
                  },
                }}
              >
                <ListIcon />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* Customer Contact Dialog */}
        {selectedOrder && (
          <CustomerContact
            open={showContactDialog}
            onClose={() => setShowContactDialog(false)}
            customerName={selectedOrder.customer?.name || 'Customer'}
            customerPhone={selectedOrder.customer?.phone || 'Phone not provided'}
            orderNumber={selectedOrder.orderNumber || (selectedOrder.id || selectedOrder._id).slice(-6).toUpperCase()}
          />
        )}
      </Container>
    </Box>
  );
};

export default ActiveDeliveryPage;
