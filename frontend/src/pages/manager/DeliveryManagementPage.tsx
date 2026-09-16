import React, { useState, useMemo } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectCartCurrency, selectCartLocale } from '../../store/slices/cartSlice';
import {formatMoney, formatMajorAmount} from '../../utils/currency';

import { usePageStore } from '../../hooks/usePageStore';
import { withPageStoreContext } from '../../hoc/withPageStoreContext';
import {
  useGetTodayMetricsQuery,
  useAutoDispatchMutation,
  useTrackOrderQuery,
  useGetAvailableDriversQuery,
} from '../../store/api/deliveryApi';
import { useGetRecentStoreOrdersQuery, type Order } from '../../store/api/orderApi';
import type { AvailableDriver } from '../../store/api/deliveryApi';
import { getApiErrorMessage } from '../utils/apiError';

type DeliveryOrderView = Order & {
  _id?: string;
  customer?: { name?: string; phone?: string; firstName?: string; phoneNumber?: string };
  assignedDriver?: { name?: string; phone?: string; firstName?: string; lastName?: string; phoneNumber?: string };
};
import { type FilterConfig, type FilterValues, type SortConfig } from '../../components/common/FilterBar';
import { applyFilters, applySort, exportToCSV, commonFilters } from '../../utils/filterUtils';
import { t, cardStyle, sectionTitleStyle, statusBadge, primaryBtnStyle, secondaryBtnStyle, modalOverlayStyle, modalBoxStyle } from './manager-tokens';
import { countActiveDeliveries } from './quickInfoMetrics';
import {
  MOCK_STORE_LOCATION,
  getRandomCustomerLocation,
  toGeoJSONPoint,
  isTestMode,
} from '../../config/test-locations';

// eslint-disable-next-line react-refresh/only-export-components -- page component with HOC export
const DeliveryManagementPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const currency = useAppSelector(selectCartCurrency);
  const locale = useAppSelector(selectCartLocale);
  const fmt = (v: number) => formatMajorAmount(v , currency, locale);

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
  const { data: _todayMetrics, isLoading: _loadingMetrics } = useGetTodayMetricsQuery(storeId, { skip: !storeId });

  // Get all store orders and filter by delivery type
  const { data: allOrders = [], isLoading: loadingOrders } = useGetRecentStoreOrdersQuery(
    { storeId, days: 2, page: 0, size: 100 },
    { skip: !storeId, pollingInterval: 30000 },
  );

  // Filter for delivery orders only
  const deliveryOrders = allOrders.filter((order) => order.orderType === 'DELIVERY') as DeliveryOrderView[];

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
        { label: 'Dispatched (Awaiting Pickup)', value: 'DISPATCHED' },
        { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
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
        { label: 'Total Amount', field: 'total', format: (v) => fmt(Number(v)) },
        { label: 'Driver', field: 'driverId', format: (v) => v || 'Not Assigned' },
        { label: 'Created At', field: 'createdAt', format: (v) => new Date(String(v)).toLocaleString() },
      ]
    );
  };

  // Filter today's delivery orders
  const today = new Date().toDateString();
  const todayDeliveryOrders = filteredAndSortedDeliveries.filter((order: DeliveryOrderView) => {
    const orderDate = new Date(order.createdAt).toDateString();
    return orderDate === today;
  });

  // Ready for dispatch: READY status (kitchen complete, awaiting driver pickup)
  const readyOrders = filteredAndSortedDeliveries.filter((order: DeliveryOrderView) =>
    order.status === 'READY'
  );

  // Out for delivery: DISPATCHED (awaiting pickup) or OUT_FOR_DELIVERY (driver en route)
  const outForDeliveryOrders = filteredAndSortedDeliveries.filter((order: DeliveryOrderView) =>
    order.status === 'DISPATCHED' || order.status === 'OUT_FOR_DELIVERY'
  );

  // Calculate metrics from actual orders
  const calculatedMetrics = {
    activeDeliveries: countActiveDeliveries(deliveryOrders),
    completedDeliveries: deliveryOrders.filter((order: DeliveryOrderView) =>
      ['DELIVERED', 'COMPLETED', 'SERVED'].includes(order.status)).length,
    averageDeliveryTime: 0,
    averageDeliveryDistance: 0,
    onTimeDeliveryRate: 0,
    customerSatisfactionRate: 0,
    todayCompleted: todayDeliveryOrders.filter((order: DeliveryOrderView) => order.status === 'DELIVERED').length,
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
      const order = readyOrders.find((o: DeliveryOrderView) => (o.id || o._id) === orderId);
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
    } catch (error: unknown) {
      console.error('Error dispatching driver:', error);
      alert(`Failed to dispatch driver: ${getApiErrorMessage(error, 'Unknown error')}`);
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

  const miniStat: React.CSSProperties = { ...cardStyle, padding: 14, textAlign: 'center' };
  const statLabel: React.CSSProperties = { fontSize: 12, color: t.gray, margin: 0 };
  const statValue = (c?: string): React.CSSProperties => ({ fontSize: 15, fontWeight: 700, color: c || t.black, margin: '4px 0 0', overflowWrap: 'anywhere', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 });
  const orderCardStyles: React.CSSProperties = { ...cardStyle, padding: 14, marginBottom: 10 };
  const infoLabelStyles: React.CSSProperties = { fontSize: 11, color: t.grayMuted, marginBottom: 2 };
  const infoValueStyles: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: t.black };
  const infoGridStyles: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 };

  if (loadingOrders && !allOrders.length) {
    return <p style={{ textAlign: 'center', padding: 40, color: t.gray }}>Loading deliveries…</p>;
  }

  return (
    <>
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 20 }}>
          <div style={miniStat}><p style={statLabel}>Active deliveries</p><p style={statValue(t.orange)}>{displayMetrics.activeDeliveries}</p></div>
          <div style={miniStat}><p style={statLabel}>Completed</p><p style={statValue(t.green)}>{displayMetrics.completedDeliveries}</p></div>
          <div style={miniStat}><p style={statLabel}>Ready to dispatch</p><p style={statValue(t.blue)}>{readyOrders.length}</p></div>
          <div style={miniStat}><p style={statLabel}>Drivers available</p><p style={statValue()}>{availableDrivers.length}</p></div>
        </div>

        <div data-testid="filter-bar" style={{ ...cardStyle, padding: 14, marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="Search order or customer"
            value={String(filterValues.search || '')}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            style={{ flex: 1, minWidth: 180, padding: '8px 12px', border: `1px solid ${t.grayLight}`, borderRadius: t.radius.md, fontFamily: t.font, fontSize: 13 }}
          />
          <select
            value={String(filterValues.status || '')}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={{ padding: '8px 12px', border: `1px solid ${t.grayLight}`, borderRadius: t.radius.md, fontFamily: t.font, fontSize: 13, color: t.black }}
          >
            <option value="">All statuses</option>
            <option value="READY">Ready</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="OUT_FOR_DELIVERY">Out for delivery</option>
            <option value="DELIVERED">Delivered</option>
          </select>
          {sortOptions.map((opt) => (
            <button key={opt.field} type="button" onClick={() => handleSortChange(opt.field)}
              style={{ ...secondaryBtnStyle, padding: '8px 12px', background: sortConfig.field === opt.field ? t.orangeLight : t.white, color: sortConfig.field === opt.field ? t.orange : t.black }}>
              {opt.label}{sortConfig.field === opt.field ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓') : ''}
            </button>
          ))}
          {filteredAndSortedDeliveries.length > 0 && (
            <button type="button" style={secondaryBtnStyle} onClick={handleExport}>Export CSV</button>
          )}
        </div>

        {/* Ready for Pickup Orders */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ ...sectionTitleStyle, marginBottom: 12 }}>Orders Ready for Dispatch ({readyOrders?.length || 0})</h2>
          {!readyOrders || readyOrders.length === 0 ? (
            <div style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
              <p style={{ color: t.grayMuted }}>No orders waiting for dispatch</p>
            </div>
          ) : (
            <div>
              {readyOrders.map((order: DeliveryOrderView) => (
                <div key={order.id || order._id} style={orderCardStyles}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: t.orange }}>
                        #{order.orderNumber || order.id?.slice(-6).toUpperCase() || order._id?.slice(-6).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 13, color: t.gray }}>
                        {order.customerName || order.customer?.name || order.customer?.firstName || 'Customer'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: t.black }}>
                        {fmt(order.total || order.totalAmount || 0)}
                      </div>
                      <span style={statusBadge('READY')}>READY</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
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

                  <div style={{ marginBottom: 10 }}>
                    <div style={infoLabelStyles}>Customer Phone</div>
                    <div style={infoValueStyles}>{order.customerPhone || order.customer?.phone || order.customer?.phoneNumber || 'N/A'}</div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      style={primaryBtnStyle}
                      onClick={() => { const orderId = order.id || order._id; if (orderId) handleAutoDispatch(orderId); }}
                      disabled={dispatching}
                    >
                      {dispatching ? 'Dispatching...' : 'Auto-dispatch'}
                    </button>
                    <button
                      type="button"
                      style={secondaryBtnStyle}
                      onClick={() => { const orderId = order.id || order._id; if (orderId) handleManualDispatch(orderId); }}
                      disabled={dispatching || availableDrivers.length === 0}
                    >
                      Choose driver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Out for Delivery Orders */}
        <div>
          <h2 style={{ ...sectionTitleStyle, marginBottom: 12 }}>Orders Out for Delivery ({outForDeliveryOrders?.length || 0})</h2>
          {!outForDeliveryOrders || outForDeliveryOrders.length === 0 ? (
            <div style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
              <p style={{ color: t.grayMuted }}>No orders currently out for delivery</p>
            </div>
          ) : (
            <div>
              {outForDeliveryOrders.map((order: DeliveryOrderView) => (
                <div key={order.id || order._id} style={orderCardStyles}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: t.orange }}>
                        #{order.orderNumber || order.id?.slice(-6).toUpperCase() || order._id?.slice(-6).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 13, color: t.gray }}>
                        {order.customerName || order.customer?.name || order.customer?.firstName || 'Customer'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: t.black }}>
                        {fmt(order.total || order.totalAmount || 0)}
                      </div>
                      <span style={{ ...statusBadge('PENDING'), background: '#DBEAFE', color: t.blue }}>OUT FOR DELIVERY</span>
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

                  <div style={{ marginBottom: 10 }}>
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

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" style={secondaryBtnStyle} onClick={() => { const orderId = order.id || order._id; if (orderId) handleTrackOrder(orderId); }}>
                      Track order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showDriverSelector && (
        <div style={modalOverlayStyle} onClick={() => setShowDriverSelector(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ ...sectionTitleStyle, marginBottom: 8 }}>Select driver</h2>
            <p style={{ color: t.gray, marginBottom: 14, fontSize: 13 }}>
              Assign a specific driver, or cancel to keep auto-dispatch.
            </p>
            {availableDrivers.length === 0 ? (
              <p style={{ textAlign: 'center', padding: 16, color: t.grayMuted }}>No drivers available</p>
            ) : availableDrivers.map((driver: AvailableDriver) => (
              <div
                key={driver.id}
                onClick={() => setSelectedDriverId(driver.id)}
                style={{
                  ...orderCardStyles,
                  cursor: 'pointer',
                  border: selectedDriverId === driver.id ? `2px solid ${t.orange}` : `1px solid ${t.grayLight}`,
                  background: selectedDriverId === driver.id ? t.orangeLight : t.white,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: t.black }}>{driver.name}</div>
                    <div style={{ fontSize: 12, color: t.gray }}>{driver.phone || 'No phone'}</div>
                  </div>
                  <div style={{ fontSize: 12, color: t.gray }}>{driver.activeDeliveries || 0} active</div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button type="button" style={secondaryBtnStyle} onClick={() => setShowDriverSelector(false)}>Cancel</button>
              <button type="button" style={primaryBtnStyle} onClick={confirmManualDispatch} disabled={!selectedDriverId || dispatching}>
                {dispatching ? 'Dispatching...' : 'Assign driver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {trackingOpen && trackingData && (
        <div style={modalOverlayStyle} onClick={() => setTrackingOpen(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ ...sectionTitleStyle, marginBottom: 16 }}>Live tracking</h2>
            <div style={infoGridStyles}>
              <div><div style={infoLabelStyles}>Driver</div><div style={infoValueStyles}>{trackingData.driverName}</div></div>
              <div><div style={infoLabelStyles}>Phone</div><div style={infoValueStyles}>{trackingData.driverPhone}</div></div>
              <div><div style={infoLabelStyles}>Status</div><div style={infoValueStyles}><span style={statusBadge(trackingData.status)}>{trackingData.status}</span></div></div>
              <div><div style={infoLabelStyles}>ETA</div><div style={infoValueStyles}>{trackingData.estimatedArrival ? new Date(trackingData.estimatedArrival).toLocaleTimeString() : '—'}</div></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" style={secondaryBtnStyle} onClick={() => setTrackingOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// eslint-disable-next-line react-refresh/only-export-components -- HOC default export
export default withPageStoreContext(DeliveryManagementPage, 'deliveries');
