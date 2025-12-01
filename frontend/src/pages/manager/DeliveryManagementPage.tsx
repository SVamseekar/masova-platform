import React, { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useGetDeliveryMetricsQuery,
  useGetTodayMetricsQuery,
  useAutoDispatchMutation,
  useTrackOrderQuery,
} from '../../store/api/deliveryApi';
import { useGetOrdersByStatusQuery } from '../../store/api/orderApi';
import { Card, Button } from '../../components/ui/neumorphic';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface, createCard, createBadge } from '../../styles/neumorphic-utils';

const DeliveryManagementPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [trackingOpen, setTrackingOpen] = useState(false);

  // API queries
  const { data: todayMetrics, isLoading: loadingMetrics } = useGetTodayMetricsQuery();
  const { data: outForDeliveryOrders } = useGetOrdersByStatusQuery('OUT_FOR_DELIVERY', {
    pollingInterval: 30000, // Poll every 30 seconds
  });
  const { data: readyOrders } = useGetOrdersByStatusQuery('READY_FOR_PICKUP', {
    pollingInterval: 30000,
  });
  const { data: trackingData } = useTrackOrderQuery(selectedOrderId, {
    skip: !selectedOrderId,
    pollingInterval: 10000, // Poll every 10 seconds for live tracking
  });

  // Mutations
  const [autoDispatch, { isLoading: dispatching }] = useAutoDispatchMutation();

  const handleAutoDispatch = async (orderId: string) => {
    try {
      // You'd get these from the order data
      await autoDispatch({
        orderId,
        pickupLocation: {
          type: 'Point',
          coordinates: [0, 0], // Replace with actual restaurant coordinates
        },
        deliveryLocation: {
          type: 'Point',
          coordinates: [0, 0], // Replace with customer coordinates
        },
        priorityLevel: 'MEDIUM',
      }).unwrap();
      alert('Driver dispatched successfully!');
    } catch (error) {
      console.error('Error dispatching driver:', error);
      alert('Failed to dispatch driver');
    }
  };

  const handleTrackOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setTrackingOpen(true);
  };

  // Styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    fontFamily: typography.fontFamily.primary,
    padding: spacing[6],
    backgroundColor: '#e8e8e8',
    zIndex: 1,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginBottom: spacing[6],
  };

  const statsGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing[4],
    marginBottom: spacing[6],
  };

  const statCardStyles: React.CSSProperties = {
    ...createCard('md', 'base'),
    padding: spacing[5],
    textAlign: 'center',
  };

  const statValueStyles: React.CSSProperties = {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.brand.primary,
    marginBottom: spacing[1],
  };

  const statLabelStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  };

  const sectionTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  };

  const orderCardStyles: React.CSSProperties = {
    ...createCard('sm', 'base'),
    padding: spacing[4],
    marginBottom: spacing[3],
  };

  const badgeStyles = (color: string): React.CSSProperties => ({
    ...createBadge(),
    backgroundColor: color,
    color: '#fff',
    padding: `${spacing[1]} ${spacing[2]}`,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  });

  const modalOverlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyles: React.CSSProperties = {
    ...createCard('lg', 'xl'),
    backgroundColor: colors.surface.background,
    maxWidth: '800px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    padding: spacing[6],
  };

  const infoGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing[4],
    marginBottom: spacing[4],
  };

  const infoLabelStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: spacing[1],
  };

  const infoValueStyles: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  };

  if (loadingMetrics) {
    return (
      <>
        <AnimatedBackground variant="default" />
        <div style={containerStyles}>
          <AppHeader title="Delivery Management" showBackButton={false} />
          <div style={{ textAlign: 'center', padding: spacing[8] }}>Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground variant="default" />

      <div style={containerStyles}>
        <AppHeader title="Delivery Management" showBackButton={false} />

        <h1 style={titleStyles}>Delivery Management</h1>
        <p style={subtitleStyles}>Monitor and manage delivery operations</p>

        {/* Metrics Dashboard */}
        {todayMetrics && (
          <div style={statsGridStyles}>
            <div style={statCardStyles}>
              <div style={statValueStyles}>{todayMetrics.activeDeliveries}</div>
              <div style={statLabelStyles}>Active Deliveries</div>
            </div>
            <div style={statCardStyles}>
              <div style={{ ...statValueStyles, color: colors.semantic.success }}>
                {todayMetrics.completedDeliveries}
              </div>
              <div style={statLabelStyles}>Completed Today</div>
            </div>
            <div style={statCardStyles}>
              <div style={statValueStyles}>{todayMetrics.averageDeliveryTime.toFixed(1)}m</div>
              <div style={statLabelStyles}>Avg Delivery Time</div>
            </div>
            <div style={statCardStyles}>
              <div style={statValueStyles}>{todayMetrics.averageDeliveryDistance.toFixed(1)}km</div>
              <div style={statLabelStyles}>Avg Distance</div>
            </div>
            <div style={statCardStyles}>
              <div style={{ ...statValueStyles, color: colors.semantic.success }}>
                {todayMetrics.onTimeDeliveryRate.toFixed(1)}%
              </div>
              <div style={statLabelStyles}>On-Time Rate</div>
            </div>
            <div style={statCardStyles}>
              <div style={{ ...statValueStyles, color: colors.semantic.info }}>
                {todayMetrics.customerSatisfactionRate.toFixed(1)}%
              </div>
              <div style={statLabelStyles}>Satisfaction Rate</div>
            </div>
          </div>
        )}

        {/* Ready for Pickup Orders */}
        <div style={{ marginBottom: spacing[8] }}>
          <h2 style={sectionTitleStyles}>Orders Ready for Dispatch ({readyOrders?.length || 0})</h2>
          {!readyOrders || readyOrders.length === 0 ? (
            <div style={{ ...createCard('md', 'base'), padding: spacing[6], textAlign: 'center' }}>
              <p style={{ color: colors.text.tertiary }}>No orders waiting for dispatch</p>
            </div>
          ) : (
            <div>
              {readyOrders.map((order: any) => (
                <div key={order._id} style={orderCardStyles}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] }}>
                    <div>
                      <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold }}>
                        Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                      </div>
                      <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                        {order.customer?.name || order.customer?.firstName || 'Customer'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.brand.primary }}>
                        ₹{order.totalAmount}
                      </div>
                      <span style={badgeStyles(colors.semantic.warning)}>READY</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: spacing[3] }}>
                    <div style={infoLabelStyles}>Delivery Address</div>
                    <div style={infoValueStyles}>{order.deliveryAddress || 'N/A'}</div>
                  </div>

                  <div style={{ marginBottom: spacing[3] }}>
                    <div style={infoLabelStyles}>Customer Phone</div>
                    <div style={infoValueStyles}>{order.customer?.phone || order.customer?.phoneNumber || 'N/A'}</div>
                  </div>

                  <div style={{ display: 'flex', gap: spacing[2] }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAutoDispatch(order._id)}
                      disabled={dispatching}
                    >
                      {dispatching ? 'Dispatching...' : 'Auto-Dispatch Driver'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Out for Delivery Orders */}
        <div>
          <h2 style={sectionTitleStyles}>Orders Out for Delivery ({outForDeliveryOrders?.length || 0})</h2>
          {!outForDeliveryOrders || outForDeliveryOrders.length === 0 ? (
            <div style={{ ...createCard('md', 'base'), padding: spacing[6], textAlign: 'center' }}>
              <p style={{ color: colors.text.tertiary }}>No orders currently out for delivery</p>
            </div>
          ) : (
            <div>
              {outForDeliveryOrders.map((order: any) => (
                <div key={order._id} style={orderCardStyles}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] }}>
                    <div>
                      <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold }}>
                        Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                      </div>
                      <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                        {order.customer?.name || order.customer?.firstName || 'Customer'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.brand.primary }}>
                        ₹{order.totalAmount}
                      </div>
                      <span style={badgeStyles(colors.semantic.info)}>OUT FOR DELIVERY</span>
                    </div>
                  </div>

                  <div style={infoGridStyles}>
                    <div>
                      <div style={infoLabelStyles}>Driver</div>
                      <div style={infoValueStyles}>
                        {order.assignedDriver?.firstName || 'N/A'} {order.assignedDriver?.lastName || ''}
                      </div>
                    </div>
                    <div>
                      <div style={infoLabelStyles}>Driver Phone</div>
                      <div style={infoValueStyles}>{order.assignedDriver?.phone || order.assignedDriver?.phoneNumber || 'N/A'}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: spacing[3] }}>
                    <div style={infoLabelStyles}>Delivery Address</div>
                    <div style={infoValueStyles}>{order.deliveryAddress || 'N/A'}</div>
                  </div>

                  <div style={{ display: 'flex', gap: spacing[2] }}>
                    <Button variant="secondary" size="sm" onClick={() => handleTrackOrder(order._id)}>
                      Track Order
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tracking Modal */}
      {trackingOpen && trackingData && (
        <div style={modalOverlayStyles} onClick={() => setTrackingOpen(false)}>
          <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
            <h2 style={sectionTitleStyles}>Live Tracking: Order #{trackingData.orderId.slice(-6).toUpperCase()}</h2>

            <div style={{ marginBottom: spacing[6] }}>
              <div style={infoGridStyles}>
                <div>
                  <div style={infoLabelStyles}>Driver</div>
                  <div style={infoValueStyles}>{trackingData.driverName}</div>
                </div>
                <div>
                  <div style={infoLabelStyles}>Phone</div>
                  <div style={infoValueStyles}>{trackingData.driverPhone}</div>
                </div>
                <div>
                  <div style={infoLabelStyles}>Status</div>
                  <div style={infoValueStyles}>
                    <span style={badgeStyles(colors.semantic.info)}>{trackingData.status}</span>
                  </div>
                </div>
                <div>
                  <div style={infoLabelStyles}>ETA</div>
                  <div style={infoValueStyles}>
                    {new Date(trackingData.estimatedArrival).toLocaleTimeString()}
                  </div>
                </div>
                <div>
                  <div style={infoLabelStyles}>Distance Remaining</div>
                  <div style={infoValueStyles}>{(trackingData.distanceRemaining / 1000).toFixed(2)} km</div>
                </div>
                <div>
                  <div style={infoLabelStyles}>Last Updated</div>
                  <div style={infoValueStyles}>{new Date(trackingData.lastUpdated).toLocaleTimeString()}</div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div style={{
              ...createCard('md', 'base'),
              height: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface.secondary,
              marginBottom: spacing[4],
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: typography.fontSize['3xl'], marginBottom: spacing[2] }}>🗺️</div>
                <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                  Map integration placeholder
                </div>
                <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: spacing[2] }}>
                  Current Location: {trackingData.currentLocation.coordinates[1].toFixed(4)}, {trackingData.currentLocation.coordinates[0].toFixed(4)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setTrackingOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeliveryManagementPage;
