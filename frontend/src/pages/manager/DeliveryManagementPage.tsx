import React, { useState, useMemo } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { useSmartBackNavigation } from '../../hooks/useSmartBackNavigation';
import { usePageStore } from '../../contexts/PageStoreContext';
import { withPageStoreContext } from '../../hoc/withPageStoreContext';
import {
  useGetDeliveryMetricsQuery,
  useGetTodayMetricsQuery,
  useAutoDispatchMutation,
  useTrackOrderQuery,
  useGetAvailableDriversQuery,
} from '../../store/api/deliveryApi';
import { useGetStoreOrdersQuery } from '../../store/api/orderApi';
import { Card, Button } from '../../components/ui/neumorphic';
import AppHeader from '../../components/common/AppHeader';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { FilterBar, type FilterConfig, type FilterValues, type SortConfig } from '../../components/common/FilterBar';
import { applyFilters, applySort, exportToCSV, commonFilters } from '../../utils/filterUtils';
import { colors, spacing, typography, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface, createCard, createBadge } from '../../styles/neumorphic-utils';
import {
  MOCK_STORE_LOCATION,
  getRandomCustomerLocation,
  toGeoJSONPoint,
  toAddressDTO,
  isTestMode,
  TEST_SCENARIOS,
  type TestLocation,
} from '../../config/test-locations';

const DeliveryManagementPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const { handleBack } = useSmartBackNavigation();
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [showDriverSelector, setShowDriverSelector] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string>('');

  // Filter and sort state
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    status: '',
    dateRange: {},
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'createdAt',
    direction: 'desc',
  });

  // Get storeId
  const { selectedStoreId } = usePageStore();
  const storeId = selectedStoreId || currentUser?.storeId || '';

  // API queries
  const { data: todayMetrics, isLoading: loadingMetrics } = useGetTodayMetricsQuery(storeId, { skip: !storeId });

  // Get all store orders and filter by delivery type
  const { data: allOrders = [], isLoading: loadingOrders } = useGetStoreOrdersQuery(storeId, {
    skip: !storeId,
    pollingInterval: 30000, // Poll every 30 seconds
  });

  // Filter for delivery orders only
  const deliveryOrders = allOrders.filter((order: any) => order.orderType === 'DELIVERY');

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      type: 'search',
      label: 'Search',
      field: 'search',
      placeholder: 'Search by order ID or customer...',
    },
    {
      type: 'select',
      label: 'Status',
      field: 'status',
      options: [
        { label: 'Ready for Dispatch', value: 'READY' },
        { label: 'Out for Delivery (Dispatched)', value: 'DISPATCHED' },
        { label: 'Delivered', value: 'DELIVERED' },
      ],
    },
    {
      type: 'dateRange',
      label: 'Order Date',
      field: 'dateRange',
    },
  ];

  const sortOptions = [
    { label: 'Order Date', field: 'createdAt' },
    { label: 'Total Amount', field: 'total' },
    { label: 'Status', field: 'status' },
  ];

  // Apply filters and sorting
  const filteredAndSortedDeliveries = useMemo(() => {
    const filtered = applyFilters(deliveryOrders, filterValues, {
      search: (order, value) =>
        commonFilters.searchText(order, value as string, ['id', 'customerName', 'customerPhone']),
      status: (order, value) => order.status === value,
      dateRange: (order, value) =>
        commonFilters.dateRange(order, value as { from?: string; to?: string }, 'createdAt'),
    });

    return applySort(filtered, sortConfig);
  }, [deliveryOrders, filterValues, sortConfig]);

  const handleFilterChange = (field: string, value: string | string[] | { from?: string; to?: string }) => {
    setFilterValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilterValues({
      search: '',
      status: '',
      dateRange: {},
    });
  };

  const handleSortChange = (field: string) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleExport = () => {
    exportToCSV(
      filteredAndSortedDeliveries,
      'delivery_orders',
      [
        { label: 'Order ID', field: 'id' },
        { label: 'Customer Name', field: 'customerName' },
        { label: 'Customer Phone', field: 'customerPhone' },
        { label: 'Status', field: 'status' },
        { label: 'Total Amount', field: 'total', format: (v) => `₹${v}` },
        { label: 'Driver', field: 'driverId', format: (v) => v || 'Not Assigned' },
        { label: 'Created At', field: 'createdAt', format: (v) => new Date(v).toLocaleString() },
      ]
    );
  };

  // Filter today's delivery orders
  const today = new Date().toDateString();
  const todayDeliveryOrders = filteredAndSortedDeliveries.filter((order: any) => {
    const orderDate = new Date(order.createdAt).toDateString();
    return orderDate === today;
  });

  // Ready for dispatch: READY status (kitchen complete, awaiting driver pickup)
  const readyOrders = filteredAndSortedDeliveries.filter((order: any) =>
    order.status === 'READY'
  );

  // Out for delivery: DISPATCHED status
  const outForDeliveryOrders = filteredAndSortedDeliveries.filter((order: any) =>
    order.status === 'DISPATCHED'
  );

  // Calculate metrics from actual orders
  const calculatedMetrics = {
    activeDeliveries: outForDeliveryOrders.length, // Only count dispatched orders as active
    completedDeliveries: todayDeliveryOrders.filter((order: any) => order.status === 'DELIVERED').length,
    averageDeliveryTime: 0, // Would need actual delivery time data
    averageDeliveryDistance: 0, // Would need actual distance data
    onTimeDeliveryRate: 0, // Would need actual timing data
    customerSatisfactionRate: 0, // Would need review data
  };

  // Always use calculated metrics for now (delivery service metrics may not be accurate)
  const displayMetrics = calculatedMetrics;

  const { data: trackingData } = useTrackOrderQuery(selectedOrderId, {
    skip: !selectedOrderId,
    pollingInterval: 10000, // Poll every 10 seconds for live tracking
  });

  // Mutations
  const [autoDispatch, { isLoading: dispatching }] = useAutoDispatchMutation();

  // Fetch available drivers
  const { data: availableDrivers = [] } = useGetAvailableDriversQuery(storeId, {
    skip: !storeId,
    pollingInterval: 30000, // Refresh every 30 seconds
  });

  /**
   * Auto-dispatch driver - intelligently uses test coordinates when in development
   */
  const handleAutoDispatch = async (orderId: string, preferredDriverId?: string) => {
    try {
      // Find the order to get its details
      const order = readyOrders.find((o: any) => (o.id || o._id) === orderId);
      if (!order) {
        alert('Order not found');
        return;
      }

      // In TEST MODE: Use mock coordinates for realistic testing
      if (isTestMode()) {
        console.log('🧪 TEST MODE: Using mock GPS coordinates');

        // Get a random test scenario for variety
        const customerLocation = getRandomCustomerLocation();

        console.log('📍 Mock Locations:', {
          store: MOCK_STORE_LOCATION.name,
          customer: customerLocation.name,
          distance: customerLocation.description
        });

        await autoDispatch({
          orderId,
          storeId: storeId!,
          // Pickup from store
          pickupLocation: toGeoJSONPoint(MOCK_STORE_LOCATION),
          // Deliver to mock customer location
          deliveryLocation: toGeoJSONPoint(customerLocation),
          priorityLevel: order.priority === 'URGENT' ? 'URGENT' : 'MEDIUM',
          preferredDriverId: preferredDriverId,
        }).unwrap();

        alert(`✅ Driver dispatched!\n\n📍 Test Route:\nFrom: ${MOCK_STORE_LOCATION.name}\nTo: ${customerLocation.name}\nDistance: ${customerLocation.description}`);
        return;
      }

      // PRODUCTION MODE: Use actual order coordinates
      if (!order.deliveryAddress?.latitude || !order.deliveryAddress?.longitude) {
        alert('⚠️ Order missing GPS coordinates. Please add latitude/longitude to the delivery address.');
        return;
      }

      await autoDispatch({
        orderId,
        storeId: storeId!,
        // Use AddressDTO format with actual coordinates
        deliveryAddress: {
          street: order.deliveryAddress.street,
          city: order.deliveryAddress.city,
          state: order.deliveryAddress.state,
          zipCode: order.deliveryAddress.pincode,
          latitude: order.deliveryAddress.latitude,
          longitude: order.deliveryAddress.longitude,
        },
        priorityLevel: order.priority === 'URGENT' ? 'URGENT' : 'MEDIUM',
        preferredDriverId: preferredDriverId,
      }).unwrap();

      alert('Driver dispatched successfully!');
    } catch (error: any) {
      console.error('Error dispatching driver:', error);
      alert(`Failed to dispatch driver: ${error.data?.message || error.message || 'Unknown error'}`);
    } finally {
      setShowDriverSelector(false);
      setPendingOrderId('');
      setSelectedDriverId('');
    }
  };

  /**
   * Show driver selector modal for manual assignment
   */
  const handleManualDispatch = (orderId: string) => {
    setPendingOrderId(orderId);
    setShowDriverSelector(true);
  };

  /**
   * Confirm manual driver selection
   */
  const confirmManualDispatch = () => {
    if (!selectedDriverId) {
      alert('Please select a driver');
      return;
    }
    handleAutoDispatch(pendingOrderId, selectedDriverId);
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
    paddingTop: '80px',
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

  const badgeStyles = (color: string): React.CSSProperties => {
    const { backgroundColor: _, ...badgeBase } = createBadge();
    return {
      ...badgeBase,
      backgroundColor: color,
      color: '#fff',
      padding: `${spacing[1]} ${spacing[2]}`,
      borderRadius: borderRadius.full,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
    };
  };

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

  if (loadingOrders && !allOrders.length) {
    return (
      <>
        <AnimatedBackground variant="default" />
        <div style={containerStyles}>
          <AppHeader title="Delivery Management" showBackButton={true} onBack={handleBack} showManagerNav={true} />
          <div style={{ textAlign: 'center', padding: spacing[8] }}>Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground variant="default" />

      <div style={containerStyles}>
        <AppHeader title="Delivery Management" showBackButton={true} onBack={handleBack} showManagerNav={true} />

        <h1 style={titleStyles}>Delivery Management</h1>
        <p style={subtitleStyles}>Monitor and manage delivery operations</p>

        {/* Metrics Dashboard */}
        <div style={statsGridStyles}>
          <div style={statCardStyles}>
            <div style={statValueStyles}>{displayMetrics.activeDeliveries}</div>
            <div style={statLabelStyles}>Active Deliveries</div>
          </div>
          <div style={statCardStyles}>
            <div style={{ ...statValueStyles, color: colors.semantic.success }}>
              {displayMetrics.completedDeliveries}
            </div>
            <div style={statLabelStyles}>Completed Today</div>
          </div>
          <div style={statCardStyles}>
            <div style={statValueStyles}>
              {displayMetrics.averageDeliveryTime ? displayMetrics.averageDeliveryTime.toFixed(1) : '0.0'}m
            </div>
            <div style={statLabelStyles}>Avg Delivery Time</div>
          </div>
          <div style={statCardStyles}>
            <div style={statValueStyles}>
              {displayMetrics.averageDeliveryDistance ? displayMetrics.averageDeliveryDistance.toFixed(1) : '0.0'}km
            </div>
            <div style={statLabelStyles}>Avg Distance</div>
          </div>
          <div style={statCardStyles}>
            <div style={{ ...statValueStyles, color: colors.semantic.success }}>
              {displayMetrics.onTimeDeliveryRate ? displayMetrics.onTimeDeliveryRate.toFixed(1) : '0.0'}%
            </div>
            <div style={statLabelStyles}>On-Time Rate</div>
          </div>
          <div style={statCardStyles}>
            <div style={{ ...statValueStyles, color: colors.semantic.info }}>
              {displayMetrics.customerSatisfactionRate ? displayMetrics.customerSatisfactionRate.toFixed(1) : '0.0'}%
            </div>
            <div style={statLabelStyles}>Satisfaction Rate</div>
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar
          filters={filterConfigs}
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          sortConfig={sortConfig}
          onSortChange={handleSortChange}
          sortOptions={sortOptions}
          onExport={handleExport}
          showExport={filteredAndSortedDeliveries.length > 0}
        />

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
                <div key={order.id || order._id} style={orderCardStyles}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] }}>
                    <div>
                      <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold }}>
                        Order #{order.orderNumber || order.id?.slice(-6).toUpperCase() || order._id?.slice(-6).toUpperCase()}
                      </div>
                      <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                        {order.customerName || order.customer?.name || order.customer?.firstName || 'Customer'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.brand.primary }}>
                        ₹{order.total || order.totalAmount || 0}
                      </div>
                      <span style={badgeStyles(colors.semantic.warning)}>READY</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: spacing[3] }}>
                    <div style={infoLabelStyles}>Delivery Address</div>
                    <div style={infoValueStyles}>
                      {order.deliveryAddress ? (() => {
                        const parts = [];
                        if (order.deliveryAddress.street) parts.push(order.deliveryAddress.street);
                        if (order.deliveryAddress.city && order.deliveryAddress.city !== 'Unknown') parts.push(order.deliveryAddress.city);
                        if (order.deliveryAddress.pincode && order.deliveryAddress.pincode !== '000000') parts.push(order.deliveryAddress.pincode);
                        return parts.join(', ') || 'N/A';
                      })() : 'N/A'}
                    </div>
                  </div>

                  <div style={{ marginBottom: spacing[3] }}>
                    <div style={infoLabelStyles}>Customer Phone</div>
                    <div style={infoValueStyles}>{order.customerPhone || order.customer?.phone || order.customer?.phoneNumber || 'N/A'}</div>
                  </div>

                  <div style={{ display: 'flex', gap: spacing[2] }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAutoDispatch(order.id || order._id)}
                      disabled={dispatching}
                    >
                      {dispatching ? 'Dispatching...' : '🤖 Auto-Dispatch'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleManualDispatch(order.id || order._id)}
                      disabled={dispatching || availableDrivers.length === 0}
                    >
                      👤 Choose Driver
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
                <div key={order.id || order._id} style={orderCardStyles}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] }}>
                    <div>
                      <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold }}>
                        Order #{order.orderNumber || order.id?.slice(-6).toUpperCase() || order._id?.slice(-6).toUpperCase()}
                      </div>
                      <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                        {order.customerName || order.customer?.name || order.customer?.firstName || 'Customer'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.brand.primary }}>
                        ₹{order.total || order.totalAmount || 0}
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
                    <div style={infoValueStyles}>
                      {order.deliveryAddress ? (() => {
                        const parts = [];
                        if (order.deliveryAddress.street) parts.push(order.deliveryAddress.street);
                        if (order.deliveryAddress.city && order.deliveryAddress.city !== 'Unknown') parts.push(order.deliveryAddress.city);
                        if (order.deliveryAddress.pincode && order.deliveryAddress.pincode !== '000000') parts.push(order.deliveryAddress.pincode);
                        return parts.join(', ') || 'N/A';
                      })() : 'N/A'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: spacing[2] }}>
                    <Button variant="secondary" size="sm" onClick={() => handleTrackOrder(order.id || order._id)}>
                      Track Order
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Driver Selection Modal */}
      {showDriverSelector && (
        <div style={modalOverlayStyles} onClick={() => setShowDriverSelector(false)}>
          <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
            <h2 style={sectionTitleStyles}>Select Driver for Manual Assignment</h2>

            <p style={{ color: colors.text.secondary, marginBottom: spacing[4] }}>
              Choose a specific driver to assign to this order. The system normally auto-assigns the best available driver.
            </p>

            <div style={{ marginBottom: spacing[6] }}>
              {availableDrivers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: spacing[4], color: colors.text.tertiary }}>
                  No drivers available at the moment
                </div>
              ) : (
                <div>
                  {availableDrivers.map((driver: any) => (
                    <div
                      key={driver.id}
                      onClick={() => setSelectedDriverId(driver.id)}
                      style={{
                        ...orderCardStyles,
                        cursor: 'pointer',
                        border: selectedDriverId === driver.id ? `2px solid ${colors.brand.primary}` : 'none',
                        backgroundColor: selectedDriverId === driver.id ? colors.surface.secondary : colors.surface.background,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold }}>
                            {driver.name}
                          </div>
                          <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                            {driver.phone || 'No phone'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {driver.rating && (
                            <div style={{ fontSize: typography.fontSize.base, marginBottom: spacing[1] }}>
                              ⭐ {driver.rating.toFixed(1)}
                            </div>
                          )}
                          <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                            {driver.activeDeliveries || 0} active {driver.activeDeliveries === 1 ? 'delivery' : 'deliveries'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing[2] }}>
              <Button variant="ghost" onClick={() => setShowDriverSelector(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmManualDispatch}
                disabled={!selectedDriverId || dispatching}
              >
                {dispatching ? 'Dispatching...' : 'Assign Driver'}
              </Button>
            </div>
          </div>
        </div>
      )}

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

export default withPageStoreContext(DeliveryManagementPage, 'deliveries');
